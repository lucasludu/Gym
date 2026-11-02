import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import {
  CANCELLATION_LIMIT_HOURS,
  canBookClass,
  canCancelBooking,
  findOverlappingBooking,
} from '../../domain/bookingRules';
import type { ClassSession } from '../../domain/classSession';
import type { ClassType } from '../../domain/classType';
import { combineQueries } from '../../hooks/combineQueries';
import { queryKeys } from '../../hooks/queryKeys';
import { isOptimisticBooking, useBookClass } from '../../hooks/useBookClass';
import { useBookedClasses } from '../../hooks/useBookedClasses';
import { useCancelBooking } from '../../hooks/useCancelBooking';
import { useMembership } from '../../hooks/useMembership';
import { useMyBookings } from '../../hooks/useMyBookings';
import { useTheme } from '../../theme';
import { Badge, Button, ErrorState, LoadingSkeleton, Text } from '../ui';
import { formatBookingWhen, getBlockMessage } from './bookingMessages';

/** How long the "Reservaste…" notice stays on screen. */
export const NOTICE_MS = 4_000;

type Notice = { kind: 'success' | 'error'; text: string } | null;

/** A message announced by screen readers. */
function LiveNotice({ notice }: { notice: Notice }) {
  if (notice === null) return null;
  return (
    <Text
      accessibilityRole={notice.kind === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      color={notice.kind === 'error' ? 'danger' : 'success'}
      variant="bodyStrong"
    >
      {notice.text}
    </Text>
  );
}

/**
 * T5.14 and T5.15: "Reservar", or the reason the class cannot be booked; a booked class
 * shows "Reservada" and "Cancelar reserva" until 2 hours before it starts.
 */
export function BookingAction({
  userId,
  session,
  classType,
  now,
}: {
  userId: string;
  session: ClassSession;
  classType: ClassType;
  now: Date;
}) {
  const { spacing } = useTheme();
  const client = useQueryClient();
  const book = useBookClass(userId);
  const cancel = useCancelBooking(userId);
  const [notice, setNotice] = useState<Notice>(null);
  const bookings = useMyBookings(userId);
  const rulesData = combineQueries(
    [useMembership(userId), useBookedClasses(userId), bookings] as const,
    ([membership, booked]) => ({ membership, booked }),
  );

  const myBooking = bookings.data?.find(
    (b) => b.status === 'confirmed' && b.classSessionId === session.id,
  );
  // Success notices go away on their own; errors stay until the next try.
  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const id = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  const content = (() => {
    if (myBooking !== undefined) {
      const when = formatBookingWhen(session.startsAt, now);
      const confirmCancel = () =>
        Alert.alert(
          '¿Cancelar la reserva?',
          `${classType.name}, ${when}. Vas a liberar tu lugar.`,
          [
            { text: 'Volver', style: 'cancel' },
            {
              text: 'Cancelar reserva',
              style: 'destructive',
              onPress: () => {
                setNotice(null);
                cancel.mutate(
                  { booking: myBooking, now },
                  {
                    onSuccess: () =>
                      setNotice({
                        kind: 'success',
                        text: `Cancelaste tu reserva de ${classType.name}`,
                      }),
                    onError: () =>
                      setNotice({ kind: 'error', text: 'No pudimos cancelar. Intentá de nuevo.' }),
                  },
                );
              },
            },
          ],
        );
      // A booking just made has no server id yet: cancelling waits for it.
      const waitingForId = isOptimisticBooking(myBooking);
      return (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Badge label="Reservada" tone="primary" />
            <Text color="textMuted">Tenés un lugar en esta clase.</Text>
          </View>
          {canCancelBooking(myBooking, session, now) ? (
            <Button
              label="Cancelar reserva"
              variant="danger"
              loading={waitingForId || cancel.isPending}
              onPress={confirmCancel}
            />
          ) : (
            <Text color="textMuted">
              Ya no podés cancelar: el límite es {CANCELLATION_LIMIT_HOURS} horas antes de la clase.
            </Text>
          )}
        </View>
      );
    }
    if (rulesData.data === undefined) {
      return rulesData.isError ? (
        <ErrorState
          compact
          error={rulesData.error}
          retrying={rulesData.isRefetching}
          onRetry={() => void rulesData.refetch()}
        />
      ) : (
        <LoadingSkeleton rows={1} accessibilityLabel="Cargando si podés reservar" />
      );
    }

    const { membership, booked } = rulesData.data;
    const scheduled = {
      id: session.id,
      startsAt: session.startsAt,
      durationMinutes: classType.durationMinutes,
    };
    const userBookings = booked.map((b) => ({
      status: b.status,
      name: b.classType.name,
      classSession: { id: b.session.id, startsAt: b.startsAt, durationMinutes: b.durationMinutes },
    }));
    const result = canBookClass({
      classSession: { ...scheduled, capacity: session.capacity, bookedCount: session.bookedCount },
      membership: membership?.membership ?? null,
      plan: membership?.plan ?? null,
      userBookings,
      now,
    });

    if (result.ok) {
      return (
        <Button
          label="Reservar"
          loading={book.isPending}
          onPress={() => {
            if (book.isPending) return;
            setNotice(null);
            book.mutate(
              { classSessionId: session.id, now },
              {
                onSuccess: () =>
                  setNotice({
                    kind: 'success',
                    text: `Reservaste ${classType.name}, ${formatBookingWhen(session.startsAt, now)}`,
                  }),
                onError: () => {
                  setNotice({ kind: 'error', text: 'No pudimos reservar. Intentá de nuevo.' });
                  // The class may have changed (e.g. it filled up): ask for it again.
                  void client.invalidateQueries({ queryKey: queryKeys.classSession(session.id) });
                },
              },
            );
          }}
        />
      );
    }

    const overlapping = findOverlappingBooking(scheduled, userBookings);
    const message = getBlockMessage({
      reason: result.reason,
      today: now,
      membershipEndDate: membership?.membership.endDate,
      overlapping:
        overlapping === null
          ? undefined
          : { name: overlapping.name, startsAt: overlapping.classSession.startsAt },
      weeklyLimit: membership?.plan.weeklyClassLimit ?? undefined,
    });
    if (message === null) return null;
    return (
      <View style={{ gap: spacing.xs }}>
        <Button label={message.button} disabled onPress={() => undefined} />
        <Text color="textMuted">{message.explanation}</Text>
      </View>
    );
  })();

  return (
    <View style={{ gap: spacing.sm }}>
      {content}
      <LiveNotice notice={notice} />
    </View>
  );
}
