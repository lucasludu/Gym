import { router } from 'expo-router';
import { View } from 'react-native';

import { getNextRoutineDay } from '../../domain/routineRotation';
import { combineQueries } from '../../hooks/combineQueries';
import { useRoutine } from '../../hooks/useRoutine';
import { useWorkoutHistory } from '../../hooks/useWorkoutHistory';
import { useTheme } from '../../theme';
import { Button, Text } from '../ui';
import { HomeCard } from './HomeCard';

// The workout logger arrives in T5.21; until then starting a workout opens the Rutina tab.
const startWorkout = () => router.navigate('/routine');

const exerciseCount = (n: number) => `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`;

/** T5.9: the next day of the routine (rotation), or an invitation to train free. */
export function TodayWorkoutCard({ userId }: { userId: string }) {
  const { spacing } = useTheme();
  const today = combineQueries(
    [useRoutine(userId), useWorkoutHistory(userId)] as const,
    ([routine, history]) => {
      if (routine === null) return null;
      const finished = history.sessions.filter((s) => s.finishedAt !== null);
      const day = getNextRoutineDay(routine.days, finished);
      if (day === null) return null;
      const exercises = routine.exercises.filter((e) => e.routineDayId === day.id).length;
      return { day, exercises };
    },
  );

  return (
    <HomeCard title="Entrenamiento de hoy" query={today}>
      {(data) =>
        data === null ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="subtitle">Todavía no tenés rutina</Text>
            <Text color="textMuted">
              Pedile una a tu entrenador. Mientras tanto podés entrenar libre.
            </Text>
            <Button label="Entrenamiento libre" variant="secondary" onPress={startWorkout} />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xxs }}>
              <Text variant="subtitle">{data.day.name}</Text>
              <Text color="textMuted">{exerciseCount(data.exercises)}</Text>
            </View>
            <Button
              label="Empezar"
              accessibilityLabel={`Empezar ${data.day.name}`}
              onPress={startWorkout}
            />
            <Button
              label="Elegir otro día"
              variant="ghost"
              onPress={() => router.navigate('/routine')}
            />
          </View>
        )
      }
    </HomeCard>
  );
}
