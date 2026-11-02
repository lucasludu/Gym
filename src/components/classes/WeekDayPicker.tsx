import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  describeCalendarDay,
  formatWeekRange,
  getCalendarWeekStarts,
  getDefaultDay,
  getWeekDays,
} from '../../domain/classCalendar';
import { getWeekStart, type LocalDate } from '../../domain/dates';
import { MIN_TOUCH_TARGET, useTheme } from '../../theme';
import { IconButton, Text } from '../ui';

const WEEK_TITLES = ['Esta semana', 'Semana que viene'] as const;

export interface CalendarSelection {
  weekIndex: number;
  weekStart: LocalDate;
  selectedDate: LocalDate;
  selectWeek: (index: number) => void;
  selectDate: (date: LocalDate) => void;
}

/**
 * Week and day chosen in the class calendar. Opens on today; changing week selects
 * today in the current week and the Monday in the next one.
 */
export function useCalendarSelection(today: Date): CalendarSelection {
  const weekStarts = getCalendarWeekStarts(today);
  const [weekIndex, setWeekIndex] = useState(0);
  const weekStart = weekStarts[weekIndex] ?? getWeekStart(today);
  const [selectedDate, setSelectedDate] = useState(() => getDefaultDay(weekStart, today));

  return {
    weekIndex,
    weekStart,
    selectedDate,
    selectWeek: (index) => {
      const start = weekStarts[index];
      if (start === undefined) return;
      setWeekIndex(index);
      setSelectedDate(getDefaultDay(start, today));
    },
    selectDate: setSelectedDate,
  };
}

/** T5.10: "Esta semana" / "Semana que viene" with its range, and the strip of 7 days. */
export function WeekDayPicker({ selection, today }: { selection: CalendarSelection; today: Date }) {
  const { colors, spacing, radii } = useTheme();
  const { weekIndex, weekStart, selectedDate, selectWeek, selectDate } = selection;
  const lastWeek = getCalendarWeekStarts(today).length - 1;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton
          accessibilityLabel="Semana anterior"
          disabled={weekIndex === 0}
          onPress={() => selectWeek(weekIndex - 1)}
          icon={<MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />}
        />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="subtitle" accessibilityRole="header">
            {WEEK_TITLES[weekIndex] ?? ''}
          </Text>
          <Text variant="caption" color="textMuted">
            {formatWeekRange(weekStart, today)}
          </Text>
        </View>
        <IconButton
          accessibilityLabel="Semana siguiente"
          disabled={weekIndex === lastWeek}
          onPress={() => selectWeek(weekIndex + 1)}
          icon={<MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
        {getWeekDays(weekStart, today).map((day) => {
          const selected = day.date === selectedDate;
          const textColor = selected ? 'onPrimary' : day.isPast ? 'textMuted' : 'text';
          return (
            <Pressable
              key={day.date}
              onPress={() => selectDate(day.date)}
              accessibilityRole="button"
              accessibilityLabel={describeCalendarDay(day.date, today)}
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                minHeight: MIN_TOUCH_TARGET + spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.xs,
                borderRadius: radii.md,
                backgroundColor: selected ? colors.primary : 'transparent',
                borderWidth: day.isToday && !selected ? 1 : 0,
                borderColor: colors.primary,
              }}
            >
              <Text variant="caption" color={textColor}>
                {day.shortName}
              </Text>
              <Text variant="bodyStrong" color={textColor}>
                {day.dayOfMonth}
              </Text>
              {day.isToday && (
                <Text variant="caption" color={selected ? 'onPrimary' : 'primary'}>
                  Hoy
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
