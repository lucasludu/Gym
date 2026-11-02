import { ScrollView, View } from 'react-native';

import type { ClassType } from '../../domain/classType';
import type { DayClass } from '../../domain/dayClasses';
import type { QueryState } from '../../hooks/combineQueries';
import { useTheme } from '../../theme';
import { Chip, EmptyState, ErrorState, LoadingSkeleton } from '../ui';
import { ClassCard } from './ClassCard';

/** "Todas" plus one chip per class type; one type at a time. */
export function ClassTypeFilter({
  classTypes,
  selected,
  onChange,
}: {
  classTypes: readonly ClassType[];
  selected: string | null;
  onChange: (classTypeId: string | null) => void;
}) {
  const { spacing } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.xs }}
    >
      <Chip label="Todas" selected={selected === null} onPress={() => onChange(null)} />
      {classTypes.map((t) => (
        <Chip
          key={t.id}
          label={t.name}
          selected={selected === t.id}
          onPress={() => onChange(t.id)}
        />
      ))}
    </ScrollView>
  );
}

/** T5.12: the classes of the selected day, with loading, error and empty states. */
export function DayClassList({
  query,
  filterName,
  now,
  onClearFilter,
  onOpenClass,
}: {
  query: QueryState<DayClass[]>;
  /** Name of the filtered class type, or `null` without filter. */
  filterName: string | null;
  now: Date;
  onClearFilter: () => void;
  onOpenClass: (classSessionId: string) => void;
}) {
  const { spacing } = useTheme();

  if (query.data === undefined) {
    if (query.isError) {
      return (
        <ErrorState
          error={query.error}
          retrying={query.isRefetching}
          onRetry={() => void query.refetch()}
        />
      );
    }
    return <LoadingSkeleton rows={3} accessibilityLabel="Cargando clases" />;
  }

  if (query.data.length === 0) {
    return filterName === null ? (
      <EmptyState title="No hay clases este día" />
    ) : (
      <EmptyState
        title={`No hay clases de ${filterName} este día`}
        action={{ label: 'Ver todas', onPress: onClearFilter }}
      />
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {query.data.map((item) => (
        <ClassCard
          key={item.session.id}
          session={item.session}
          classType={item.classType}
          trainer={item.trainer}
          booked={item.booked}
          now={now}
          onPress={() => onOpenClass(item.session.id)}
        />
      ))}
    </View>
  );
}
