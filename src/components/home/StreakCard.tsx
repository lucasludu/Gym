import { View } from 'react-native';

import { getWeekdayName } from '../../domain/format';
import { getActiveDaysInWeek, getWeekActivity, getWeeklyStreak } from '../../domain/streak';
import { combineQueries } from '../../hooks/combineQueries';
import { useBookedClasses } from '../../hooks/useBookedClasses';
import { useUser } from '../../hooks/useUser';
import { useWorkoutHistory } from '../../hooks/useWorkoutHistory';
import { useTheme } from '../../theme';
import { Text } from '../ui';
import { HomeCard } from './HomeCard';
import { describeWeekDay, getStreakSummary } from './streakSummary';

const BAR_HEIGHT = 8;
const DOT_SIZE = 32;

/** T5.8: weekly streak and progress towards the weekly goal. Not interactive. */
export function StreakCard({ userId, now }: { userId: string; now: Date }) {
  const { colors, spacing, radii } = useTheme();
  const streak = combineQueries(
    [useUser(userId), useWorkoutHistory(userId), useBookedClasses(userId)] as const,
    ([user, history, booked]) => {
      const activity = {
        workoutSessions: history.sessions,
        bookings: booked.map((b) => ({ status: b.status, classSession: { startsAt: b.startsAt } })),
      };
      const activeDays = getActiveDaysInWeek(activity, now);
      return {
        week: getWeekActivity(activity, now),
        activeDays,
        weeklyGoal: user.weeklyGoal,
        summary: getStreakSummary({
          streak: getWeeklyStreak({ ...activity, weeklyGoal: user.weeklyGoal, today: now }),
          activeDays,
          weeklyGoal: user.weeklyGoal,
        }),
      };
    },
  );

  return (
    <HomeCard title="Racha semanal" query={streak}>
      {({ week, activeDays, weeklyGoal, summary }) => (
        <View style={{ gap: spacing.sm }}>
          <Text variant="subtitle">{summary.streakText}</Text>
          <Text color={summary.fulfilled ? 'success' : 'textMuted'}>
            {summary.fulfilled ? '¡Objetivo cumplido esta semana!' : summary.progressText}
          </Text>
          {summary.fulfilled && (
            <Text variant="caption" color="textMuted">
              {summary.progressText}
            </Text>
          )}
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Objetivo semanal"
            accessibilityValue={{ min: 0, max: weeklyGoal, now: Math.min(activeDays, weeklyGoal) }}
            style={{
              height: BAR_HEIGHT,
              borderRadius: radii.pill,
              backgroundColor: colors.surfaceAlt,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${summary.progress * 100}%`,
                height: '100%',
                backgroundColor: summary.fulfilled ? colors.success : colors.primary,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map((day) => (
              <View
                key={day.date}
                accessible
                accessibilityLabel={describeWeekDay(day)}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: day.active ? colors.primary : colors.surfaceAlt,
                  borderWidth: day.isToday ? 2 : 0,
                  borderColor: colors.text,
                }}
              >
                <Text variant="caption" color={day.active ? 'onPrimary' : 'textMuted'}>
                  {getWeekdayName(day.date).charAt(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </HomeCard>
  );
}
