import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
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
import { SegmentedControl } from '../ui';
import { ClassTypeFilter, DayClassList } from './DayClassList';
import { MyBookingsView } from './MyBookingsView';
import { useCalendarSelection, WeekDayPicker } from './WeekDayPicker';

const VIEWS = [
  { value: 'calendar', label: 'Calendario' },
  { value: 'mine', label: 'Mis reservas' },
] as const;

/** Clases tab: "Calendario" (T5.10, T5.12) and "Mis reservas" (T5.16), specs/features/reservas.md. */
export function ClassesScreen() {
  const { colors, spacing } = useTheme();
  const now = useNow();
  const selection = useCalendarSelection(now);
  const [classTypeId, setClassTypeId] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'mine'>('calendar');
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
      <SegmentedControl options={VIEWS} value={view} onChange={setView} />
      {view === 'mine' && userId !== null ? (
        <MyBookingsView userId={userId} now={now} onShowCalendar={() => setView('calendar')} />
      ) : (
        <>
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
            onOpenClass={(id) => router.push(`/classes/${id}`)}
          />
        </>
      )}
    </ScrollView>
  );
}
