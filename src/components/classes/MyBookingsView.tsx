import { router } from 'expo-router';
import { View } from 'react-native';

import { hasStarted } from '../../domain/classSession';
import { formatDayLabel, formatTime } from '../../domain/format';
import { splitMyBookings, type BookingOutcome } from '../../domain/myBookings';
import { useBookedClasses, type BookedClass } from '../../hooks/useBookedClasses';
import { useTheme } from '../../theme';
import { Badge, Card, EmptyState, ErrorState, LoadingSkeleton, Text, type BadgeTone } from '../ui';

const OUTCOMES: Record<BookingOutcome, { label: string; tone: BadgeTone }> = {
  attended: { label: 'Asististe', tone: 'success' },
  no_show: { label: 'No asististe', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
  finished: { label: 'Finalizada', tone: 'neutral' },
};

function BookingRow({
  item,
  now,
  kind,
  badge,
}: {
  item: BookedClass;
  now: Date;
  kind: 'Reserva' | 'Historial';
  badge: { label: string; tone: BadgeTone } | null;
}) {
  const { spacing } = useTheme();
  const when = `${formatDayLabel(item.startsAt, now)} · ${formatTime(item.startsAt)}`;
  const trainer = `${item.trainer.firstName} ${item.trainer.lastName}`;
  const label = [
    `${kind}: ${item.classType.name}`,
    when,
    ...(kind === 'Reserva' ? [`con ${trainer}`] : []),
    ...(badge === null ? [] : [badge.label.toLowerCase()]),
  ].join(', ');

  return (
    <Card onPress={() => router.push(`/classes/${item.session.id}`)} accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <Text variant="bodyStrong">{item.classType.name}</Text>
          <Text color="textMuted">{when}</Text>
          {kind === 'Reserva' && <Text color="textMuted">con {trainer}</Text>}
        </View>
        {badge !== null && <Badge label={badge.label} tone={badge.tone} />}
      </View>
    </Card>
  );
}

/** T5.16: "Próximas" and "Historial" of the member's bookings. */
export function MyBookingsView({
  userId,
  now,
  onShowCalendar,
}: {
  userId: string;
  now: Date;
  onShowCalendar: () => void;
}) {
  const { spacing } = useTheme();
  const booked = useBookedClasses(userId);

  if (booked.data === undefined) {
    return booked.isError ? (
      <ErrorState
        error={booked.error}
        retrying={booked.isRefetching}
        onRetry={() => void booked.refetch()}
      />
    ) : (
      <LoadingSkeleton rows={2} accessibilityLabel="Cargando tus reservas" />
    );
  }

  const { upcoming, history } = splitMyBookings(booked.data, now);
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="subtitle" accessibilityRole="header">
        Próximas
      </Text>
      {upcoming.length === 0 ? (
        <EmptyState
          title="No tenés clases reservadas"
          action={{ label: 'Ver calendario', onPress: onShowCalendar }}
        />
      ) : (
        upcoming.map((item) => (
          <BookingRow
            key={item.booking.id}
            item={item}
            now={now}
            kind="Reserva"
            badge={hasStarted(item.session, now) ? { label: 'En curso', tone: 'primary' } : null}
          />
        ))
      )}
      <Text variant="subtitle" accessibilityRole="header">
        Historial
      </Text>
      {history.length === 0 ? (
        <EmptyState title="Todavía no fuiste a ninguna clase" />
      ) : (
        history.map(({ item, outcome }) => (
          <BookingRow
            key={item.booking.id}
            item={item}
            now={now}
            kind="Historial"
            badge={OUTCOMES[outcome]}
          />
        ))
      )}
    </View>
  );
}
