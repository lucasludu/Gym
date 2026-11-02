import { View } from 'react-native';

import type { ClassSession } from '../../domain/classSession';
import type { ClassType, Intensity } from '../../domain/classType';
import type { Trainer } from '../../domain/trainer';
import { useTheme } from '../../theme';
import { Badge, Card, Text } from '../ui';
import { getClassCardSummary } from './classCardSummary';

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: 'Intensidad baja',
  medium: 'Intensidad media',
  high: 'Intensidad alta',
};

const STARTED_OPACITY = 0.6;

export interface ClassCardProps {
  session: ClassSession;
  classType: ClassType;
  trainer: Trainer;
  /** The member has a confirmed booking for this class. */
  booked: boolean;
  now: Date;
  /** Opens the class detail; booking happens there, not on the card. */
  onPress: () => void;
}

/** T5.11: a class of the day with its state (Reservada, Empezada, Llena or the spots left). */
export function ClassCard({ session, classType, trainer, booked, now, onPress }: ClassCardProps) {
  const { colors, spacing, radii } = useTheme();
  const summary = getClassCardSummary({
    startsAt: session.startsAt,
    durationMinutes: classType.durationMinutes,
    capacity: session.capacity,
    bookedCount: session.bookedCount,
    booked,
    now,
  });
  const trainerName = `${trainer.firstName} ${trainer.lastName}`;
  const label = [
    classType.name,
    summary.timeRange.replace(' – ', ' a '),
    `con ${trainerName}`,
    summary.badge.label.toLowerCase(),
  ].join(', ');

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        { padding: 0, overflow: 'hidden' },
        summary.status === 'started' && { opacity: STARTED_OPACITY },
      ]}
    >
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            width: spacing.xs,
            backgroundColor: colors[classType.color],
            borderTopLeftRadius: radii.lg,
            borderBottomLeftRadius: radii.lg,
          }}
        />
        <View style={{ flex: 1, padding: spacing.md, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {summary.timeRange}
            </Text>
            <Badge label={summary.badge.label} tone={summary.badge.tone} />
          </View>
          <Text variant="subtitle">{classType.name}</Text>
          <Text color="textMuted">con {trainerName}</Text>
          <Text variant="caption" color="textMuted">
            {INTENSITY_LABELS[classType.intensity]}
          </Text>
        </View>
      </View>
    </Card>
  );
}
