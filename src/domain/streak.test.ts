import {
  getActiveDaysInWeek,
  getWeekActivity,
  getWeeklyStreak,
  type WeeklyStreakInput,
  type StreakBooking,
  type StreakWorkout,
} from './streak';

// Today is Wednesday 2026-11-04. Current week: Mon 2026-11-02 to Sun 2026-11-08.
// Previous weeks start on Oct 26, Oct 19, Oct 12 and Oct 5.
const TODAY = '2026-11-04';

const at = (date: string, time = '18:00:00') => `${date}T${time}-03:00`;

const workout = (date: string, time?: string): StreakWorkout => ({
  startedAt: at(date, time),
  finishedAt: at(date, '23:00:00'),
});

const inProgress = (date: string): StreakWorkout => ({ startedAt: at(date), finishedAt: null });

const booking = (date: string, status: StreakBooking['status'] = 'attended'): StreakBooking => ({
  status,
  classSession: { startsAt: at(date, '09:00:00') },
});

const input = (patch: Partial<WeeklyStreakInput>): WeeklyStreakInput => ({
  workoutSessions: [],
  bookings: [],
  weeklyGoal: 2,
  today: TODAY,
  ...patch,
});

describe('getActiveDaysInWeek', () => {
  it('returns 0 without activity', () => {
    expect(getActiveDaysInWeek(input({}), TODAY)).toBe(0);
  });

  it('counts distinct days with a finished workout or an attended booking', () => {
    expect(
      getActiveDaysInWeek(
        input({
          workoutSessions: [workout('2026-11-02')],
          bookings: [booking('2026-11-03')],
        }),
        TODAY,
      ),
    ).toBe(2);
  });

  it('counts several activities on the same day once', () => {
    expect(
      getActiveDaysInWeek(
        input({
          workoutSessions: [workout('2026-11-02', '08:00:00'), workout('2026-11-02', '19:00:00')],
          bookings: [booking('2026-11-02')],
        }),
        TODAY,
      ),
    ).toBe(1);
  });

  it('ignores workouts in progress', () => {
    expect(getActiveDaysInWeek(input({ workoutSessions: [inProgress('2026-11-03')] }), TODAY)).toBe(
      0,
    );
  });

  it.each(['confirmed', 'cancelled', 'no_show'] as const)('ignores %s bookings', (status) => {
    expect(getActiveDaysInWeek(input({ bookings: [booking('2026-11-03', status)] }), TODAY)).toBe(
      0,
    );
  });

  it('only counts days inside the week (Monday to Sunday)', () => {
    expect(
      getActiveDaysInWeek(
        input({
          workoutSessions: [
            workout('2026-11-01'), // previous Sunday
            workout('2026-11-02'), // Monday
            workout('2026-11-08'), // Sunday
            workout('2026-11-09'), // next Monday
          ],
        }),
        TODAY,
      ),
    ).toBe(2);
  });

  it('uses the Buenos Aires date of each activity', () => {
    // 02:30Z on Nov 2 is 23:30 on Sunday Nov 1 in Buenos Aires.
    const lateSunday = { startedAt: '2026-11-02T02:30:00Z', finishedAt: '2026-11-02T03:30:00Z' };
    expect(getActiveDaysInWeek(input({ workoutSessions: [lateSunday] }), TODAY)).toBe(0);
  });

  it('counts a workout on the day it started, even if it ends after midnight', () => {
    const acrossMidnight = {
      startedAt: '2026-11-01T23:30:00-03:00', // Sunday, previous week
      finishedAt: '2026-11-02T00:30:00-03:00',
    };
    expect(getActiveDaysInWeek(input({ workoutSessions: [acrossMidnight] }), TODAY)).toBe(0);
  });

  it('accepts any day of the week as reference', () => {
    const data = input({ workoutSessions: [workout('2026-11-02'), workout('2026-11-05')] });
    expect(getActiveDaysInWeek(data, '2026-11-08')).toBe(2);
    expect(getActiveDaysInWeek(data, '2026-11-02T10:00:00-03:00')).toBe(2);
  });
});

describe('getWeeklyStreak', () => {
  const fulfilledWeek = (monday: string, tuesday: string) => [workout(monday), workout(tuesday)];

  it('returns 0 without activity', () => {
    expect(getWeeklyStreak(input({}))).toBe(0);
  });

  it('counts consecutive fulfilled weeks before the current one', () => {
    expect(
      getWeeklyStreak(
        input({
          workoutSessions: [
            ...fulfilledWeek('2026-10-26', '2026-10-27'),
            ...fulfilledWeek('2026-10-19', '2026-10-20'),
            ...fulfilledWeek('2026-10-12', '2026-10-13'),
          ],
        }),
      ),
    ).toBe(3);
  });

  it('stops at the first unfulfilled week (broken streak)', () => {
    expect(
      getWeeklyStreak(
        input({
          workoutSessions: [
            ...fulfilledWeek('2026-10-26', '2026-10-27'),
            workout('2026-10-19'), // only 1 day: not fulfilled
            ...fulfilledWeek('2026-10-12', '2026-10-13'),
            ...fulfilledWeek('2026-10-05', '2026-10-06'),
          ],
        }),
      ),
    ).toBe(1);
  });

  it('is 0 when last week was not fulfilled, even with older fulfilled weeks', () => {
    expect(
      getWeeklyStreak(input({ workoutSessions: fulfilledWeek('2026-10-19', '2026-10-20') })),
    ).toBe(0);
  });

  it('does not break the streak while the current week is in progress', () => {
    expect(
      getWeeklyStreak(
        input({
          workoutSessions: [
            workout('2026-11-02'), // current week: 1 of 2
            ...fulfilledWeek('2026-10-26', '2026-10-27'),
            ...fulfilledWeek('2026-10-19', '2026-10-20'),
          ],
        }),
      ),
    ).toBe(2);
  });

  it('adds 1 when the current week is already fulfilled', () => {
    expect(
      getWeeklyStreak(
        input({
          workoutSessions: [
            ...fulfilledWeek('2026-11-02', '2026-11-03'),
            ...fulfilledWeek('2026-10-26', '2026-10-27'),
          ],
        }),
      ),
    ).toBe(2);
  });

  it('returns 1 when only the current week is fulfilled', () => {
    expect(
      getWeeklyStreak(input({ workoutSessions: fulfilledWeek('2026-11-02', '2026-11-03') })),
    ).toBe(1);
  });

  it('counts several activities on the same day as one day', () => {
    expect(
      getWeeklyStreak(
        input({
          workoutSessions: [workout('2026-10-26', '08:00:00'), workout('2026-10-26', '19:00:00')],
          bookings: [booking('2026-10-26')],
        }),
      ),
    ).toBe(0);
  });

  it('combines workouts and attended bookings to fulfill a week', () => {
    expect(
      getWeeklyStreak(
        input({ workoutSessions: [workout('2026-10-26')], bookings: [booking('2026-10-28')] }),
      ),
    ).toBe(1);
  });

  it('fulfills a week with more days than the goal', () => {
    const days = ['26', '27', '28', '29'].map((d) => workout(`2026-10-${d}`));
    expect(getWeeklyStreak(input({ workoutSessions: days }))).toBe(1);
  });

  it('respects the weekly goal of the user', () => {
    const threeDays = ['26', '27', '28'].map((d) => workout(`2026-10-${d}`));
    expect(getWeeklyStreak(input({ workoutSessions: threeDays, weeklyGoal: 3 }))).toBe(1);
    expect(getWeeklyStreak(input({ workoutSessions: threeDays, weeklyGoal: 4 }))).toBe(0);
  });

  it('works with a goal of 1 day per week', () => {
    expect(
      getWeeklyStreak(
        input({
          weeklyGoal: 1,
          workoutSessions: [workout('2026-10-26'), workout('2026-10-19'), workout('2026-10-12')],
        }),
      ),
    ).toBe(3);
  });

  it('accepts today as an ISO datetime or a Date', () => {
    const data = { workoutSessions: fulfilledWeek('2026-10-26', '2026-10-27') };
    expect(getWeeklyStreak(input({ ...data, today: '2026-11-04T10:00:00-03:00' }))).toBe(1);
    expect(getWeeklyStreak(input({ ...data, today: new Date('2026-11-04T13:00:00Z') }))).toBe(1);
  });

  it('treats Monday as the start of the current week', () => {
    // On Monday Nov 2 the previous week (Oct 26–Nov 1) counts as last week.
    expect(
      getWeeklyStreak(
        input({ today: '2026-11-02', workoutSessions: fulfilledWeek('2026-10-26', '2026-11-01') }),
      ),
    ).toBe(1);
  });

  it.each([0, 8, 2.5])('throws with an invalid weekly goal (%s)', (weeklyGoal) => {
    expect(() => getWeeklyStreak(input({ weeklyGoal }))).toThrow();
  });
});

describe('getWeekActivity', () => {
  const noActivity = { workoutSessions: [], bookings: [] };

  it('lists Monday to Sunday of the week of today', () => {
    expect(getWeekActivity(noActivity, TODAY).map((d) => d.date)).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
  });

  it('marks today', () => {
    expect(getWeekActivity(noActivity, TODAY).map((d) => d.isToday)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('marks the days with a finished workout or an attended class', () => {
    const days = getWeekActivity(
      {
        workoutSessions: [workout('2026-11-02'), workout('2026-10-30')],
        bookings: [booking('2026-11-04'), booking('2026-11-05', 'confirmed')],
      },
      TODAY,
    );
    expect(days.filter((d) => d.active).map((d) => d.date)).toEqual(['2026-11-02', '2026-11-04']);
  });

  it('agrees with getActiveDaysInWeek', () => {
    const activity = {
      workoutSessions: [workout('2026-11-02'), workout('2026-11-02', '20:00:00')],
      bookings: [booking('2026-11-03')],
    };
    expect(getWeekActivity(activity, TODAY).filter((d) => d.active)).toHaveLength(
      getActiveDaysInWeek(activity, TODAY),
    );
  });
});
