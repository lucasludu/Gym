import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { addDays } from '../../domain/dates';
import { getDayClasses } from '../../domain/dayClasses';
import { combineQueries } from '../../hooks/combineQueries';
import { useClassSessions } from '../../hooks/useClassSessions';
import { useClassTypes } from '../../hooks/useClassTypes';
import { useMyBookings } from '../../hooks/useMyBookings';
import { useNow } from '../../hooks/useNow';
import { useTrainers } from '../../hooks/useTrainers';
import { useSession } from '../../store/appSession';
import { useTheme } from '../../theme';
import { ClassTypeFilter, DayClassList } from './DayClassList';
import { useCalendarSelection, WeekDayPicker } from './WeekDayPicker';

/** Clases tab, "Calendario" (specs/features/reservas.md, T5.10 and T5.12). */
export function ClassesScreen() {
  const { colors, spacing } = useTheme();
  const now = useNow();
  const selection = useCalendarSelection(now);
  const [classTypeId, setClassTypeId] = useState<string | null>(null);
  const userId = useSession((s) => s.userId);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // One request per visible week; the day and the filter are applied on the phone.
  const sessions = useClassSessions({
    from: selection.weekStart,
    to: addDays(selection.weekStart, 6),
  });
  const classTypes = useClassTypes();
  const trainers = useTrainers();
  // Without bookings (loading or failed) the list still shows, just without "Reservada".
  const bookings = useMyBookings(userId);

  const dayClasses = combineQueries(
    [sessions, classTypes, trainers] as const,
    ([sessionList, typeList, trainerList]) =>
      getDayClasses({
        sessions: sessionList,
        classTypes: typeList,
        trainers: trainerList,
        bookings: bookings.data ?? null,
        date: selection.selectedDate,
        classTypeId,
      }),
  );
  const filterName = classTypes.data?.find((t) => t.id === classTypeId)?.name ?? null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <WeekDayPicker selection={selection} today={now} />
      {classTypes.data !== undefined && (
        <ClassTypeFilter
          classTypes={classTypes.data}
          selected={classTypeId}
          onChange={setClassTypeId}
        />
      )}
      <DayClassList
        query={dayClasses}
        filterName={filterName}
        now={now}
        onClearFilter={() => setClassTypeId(null)}
        // The class detail arrives in T5.13.
        onOpenClass={() => undefined}
      />
    </ScrollView>
  );
}
