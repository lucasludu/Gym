import { describeWeekDay, getStreakSummary } from './streakSummary';

describe('getStreakSummary', () => {
  it.each([
    [0, 'Empezá tu racha esta semana'],
    [1, '1 semana seguida'],
    [4, '4 semanas seguidas'],
  ])('describes a streak of %p (criterion 16)', (streak, text) => {
    expect(getStreakSummary({ streak, activeDays: 0, weeklyGoal: 3 }).streakText).toBe(text);
  });

  it('shows the progress of the week (criterion 12)', () => {
    expect(getStreakSummary({ streak: 2, activeDays: 2, weeklyGoal: 3 })).toEqual({
      streakText: '2 semanas seguidas',
      progressText: '2 de 3 días esta semana',
      progress: 2 / 3,
      fulfilled: false,
    });
  });

  it('caps the progress at 100% and marks the week as fulfilled (criterion 13)', () => {
    expect(getStreakSummary({ streak: 1, activeDays: 4, weeklyGoal: 3 })).toMatchObject({
      progressText: '4 de 3 días esta semana',
      progress: 1,
      fulfilled: true,
    });
  });

  it('fulfills the week exactly at the goal', () => {
    expect(getStreakSummary({ streak: 0, activeDays: 3, weeklyGoal: 3 }).fulfilled).toBe(true);
  });

  it('uses the singular for a goal of 1 day', () => {
    expect(getStreakSummary({ streak: 0, activeDays: 0, weeklyGoal: 1 }).progressText).toBe(
      '0 de 1 día esta semana',
    );
  });
});

describe('describeWeekDay', () => {
  it('describes each day for screen readers, not only with color', () => {
    expect(describeWeekDay({ date: '2026-11-02', active: true, isToday: false })).toBe(
      'Lunes, con actividad',
    );
    expect(describeWeekDay({ date: '2026-11-04', active: false, isToday: true })).toBe(
      'Miércoles, hoy, sin actividad',
    );
  });
});
