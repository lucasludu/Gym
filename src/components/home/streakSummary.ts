import { getWeekdayName } from '../../domain/format';
import type { WeekDayActivity } from '../../domain/streak';

export interface StreakSummary {
  streakText: string;
  progressText: string;
  /** Share of the weekly goal reached, from 0 to 1 (capped). */
  progress: number;
  fulfilled: boolean;
}

/** Texts of the streak card in Inicio (see specs/features/home.md). */
export function getStreakSummary({
  streak,
  activeDays,
  weeklyGoal,
}: {
  streak: number;
  activeDays: number;
  weeklyGoal: number;
}): StreakSummary {
  const streakText =
    streak === 0
      ? 'Empezá tu racha esta semana'
      : `${streak} ${streak === 1 ? 'semana seguida' : 'semanas seguidas'}`;
  return {
    streakText,
    progressText: `${activeDays} de ${weeklyGoal} ${weeklyGoal === 1 ? 'día' : 'días'} esta semana`,
    progress: Math.min(activeDays / weeklyGoal, 1),
    fulfilled: activeDays >= weeklyGoal,
  };
}

/** "Lunes, con actividad" / "Miércoles, hoy, sin actividad". */
export function describeWeekDay(day: WeekDayActivity): string {
  const parts: string[] = [getWeekdayName(day.date)];
  if (day.isToday) parts.push('hoy');
  parts.push(day.active ? 'con actividad' : 'sin actividad');
  return parts.join(', ');
}
