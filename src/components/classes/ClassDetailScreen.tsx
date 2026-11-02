import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { isApiError } from '../../api/client';
import { getSpotsLeft } from '../../domain/classSession';
import { formatDayLabel } from '../../domain/format';
import { combineQueries } from '../../hooks/combineQueries';
import { useClassSession } from '../../hooks/useClassSession';
import { useClassTypes } from '../../hooks/useClassTypes';
import { useNow } from '../../hooks/useNow';
import { useTrainers } from '../../hooks/useTrainers';
import { useTheme } from '../../theme';
import { EmptyState, ErrorState, LoadingSkeleton, Text } from '../ui';
import { getClassCardSummary } from './classCardSummary';
import { INTENSITY_LABELS } from './ClassCard';

/** T5.13: everything about one class. Booking and cancelling are added in T5.14 and T5.15. */
export function ClassDetailScreen({ id }: { id: string }) {
  const { colors, spacing, radii } = useTheme();
  const now = useNow();
  const session = useClassSession(id);
  const detail = combineQueries(
    [session, useClassTypes(), useTrainers()] as const,
    ([s, types, trainers]) => ({
      session: s,
      classType: types.find((t) => t.id === s.classTypeId) ?? null,
      trainer: trainers.find((t) => t.id === s.trainerId) ?? null,
    }),
  );

  const frame = (children: ReactNode) => (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  );

  const notFound =
    (isApiError(session.error) && session.error.status === 404) ||
    (detail.data !== undefined && detail.data.classType === null);
  if (notFound) {
    return frame(
      <EmptyState
        title="Esta clase ya no existe"
        action={{ label: 'Volver a clases', onPress: () => router.navigate('/classes') }}
      />,
    );
  }
  if (detail.data === undefined) {
    return frame(
      detail.isError ? (
        <ErrorState
          error={detail.error}
          retrying={detail.isRefetching}
          onRetry={() => void detail.refetch()}
        />
      ) : (
        <LoadingSkeleton rows={4} accessibilityLabel="Cargando la clase" />
      ),
    );
  }

  const { session: s, classType, trainer } = detail.data;
  if (classType === null) return null; // handled above as "no longer exists"
  const summary = getClassCardSummary({
    startsAt: s.startsAt,
    durationMinutes: classType.durationMinutes,
    capacity: s.capacity,
    bookedCount: s.bookedCount,
    booked: false,
    now,
  });
  const spots = Math.min(getSpotsLeft(s), s.capacity);

  return frame(
    <>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            width: spacing.xs,
            borderRadius: radii.pill,
            backgroundColor: colors[classType.color],
          }}
        />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="title">{classType.name}</Text>
          <Text variant="bodyStrong">
            {formatDayLabel(s.startsAt, now)} · {summary.timeRange}
          </Text>
          <Text color="textMuted">
            {classType.durationMinutes} min · {INTENSITY_LABELS[classType.intensity]}
          </Text>
          {trainer !== null && (
            <Text color="textMuted">
              con {trainer.firstName} {trainer.lastName}
            </Text>
          )}
        </View>
      </View>
      <Text>{classType.description}</Text>
      <Text variant="subtitle">
        {spots} de {s.capacity} lugares libres
      </Text>
    </>,
  );
}
