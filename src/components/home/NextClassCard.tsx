import { router } from 'expo-router';
import { View } from 'react-native';

import { CANCELLATION_LIMIT_HOURS, canCancelBooking } from '../../domain/bookingRules';
import { hasStarted } from '../../domain/classSession';
import { toInstantMs } from '../../domain/common';
import { formatDayLabel, formatTime } from '../../domain/format';
import { getNextClass } from '../../domain/nextClass';
import { useBookedClasses, type BookedClass } from '../../hooks/useBookedClasses';
import { useTheme } from '../../theme';
import { Badge, Button, Card, Text } from '../ui';
import { HomeCard } from './HomeCard';

const MS_PER_HOUR = 3_600_000;

/** "Podés cancelar hasta las 17:00", only for today's classes that can still be cancelled. */
const cancelNotice = (item: BookedClass, now: Date): string | null => {
  if (formatDayLabel(item.startsAt, now) !== 'Hoy') return null;
  if (!canCancelBooking(item.booking, item.session, now)) return null;
  const deadline = new Date(toInstantMs(item.startsAt) - CANCELLATION_LIMIT_HOURS * MS_PER_HOUR);
  return `Podés cancelar hasta las ${formatTime(deadline)}`;
};

function NextClass({ item, now }: { item: BookedClass; now: Date }) {
  const { colors, spacing, radii } = useTheme();
  const when = `${formatDayLabel(item.startsAt, now)} · ${formatTime(item.startsAt)}`;
  const trainer = `${item.trainer.firstName} ${item.trainer.lastName}`;
  const notice = cancelNotice(item, now);

  return (
    <Card
      onPress={() => router.push(`/classes/${item.session.id}`)}
      accessibilityLabel={`Próxima clase: ${item.classType.name}, ${when}, con ${trainer}`}
      style={{ padding: 0, overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            width: spacing.xs,
            backgroundColor: colors[item.classType.color],
            borderTopLeftRadius: radii.lg,
            borderBottomLeftRadius: radii.lg,
          }}
        />
        <View style={{ flex: 1, padding: spacing.md, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="subtitle">{item.classType.name}</Text>
            {hasStarted(item.session, now) && <Badge label="En curso" tone="primary" />}
          </View>
          <Text variant="bodyStrong">{when}</Text>
          <Text color="textMuted">
            {item.classType.durationMinutes} min · con {trainer}
          </Text>
          {notice !== null && (
            <Text variant="caption" color="textMuted">
              {notice}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

/** T5.7: the next confirmed class that has not ended. */
export function NextClassCard({ userId, now }: { userId: string; now: Date }) {
  const { spacing } = useTheme();
  const bookedClasses = useBookedClasses(userId);

  return (
    <HomeCard title="Próxima clase" query={bookedClasses}>
      {(items) => {
        const next = getNextClass(items, now);
        if (next === null) {
          return (
            <View style={{ gap: spacing.sm }}>
              <Text variant="subtitle">No tenés clases reservadas</Text>
              <Button
                label="Ver clases"
                variant="secondary"
                onPress={() => router.navigate('/classes')}
              />
            </View>
          );
        }
        return <NextClass item={next} now={now} />;
      }}
    </HomeCard>
  );
}
