import { ScrollView } from 'react-native';

import { useNow } from '../../hooks/useNow';
import { useTheme } from '../../theme';
import { EmptyState } from '../ui';
import { useCalendarSelection, WeekDayPicker } from './WeekDayPicker';

/** Clases tab (specs/features/reservas.md). The list of the day arrives in T5.12. */
export function ClassesScreen() {
  const { colors, spacing } = useTheme();
  const now = useNow();
  const selection = useCalendarSelection(now);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
    >
      <WeekDayPicker selection={selection} today={now} />
      <EmptyState title="Clases del día" message="La lista de clases está en construcción." />
    </ScrollView>
  );
}
