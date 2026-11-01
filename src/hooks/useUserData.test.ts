import { waitFor } from '@testing-library/react-native';

import { getUserBookings } from '../api/bookings';
import { getPlan, getUserMembership } from '../api/memberships';
import { getActiveRoutine, getRoutineDays, getRoutineExercises } from '../api/routines';
import { getWorkoutSessions, getWorkoutSets } from '../api/workouts';
import type { Booking } from '../domain/booking';
import type { Membership } from '../domain/membership';
import type { Plan } from '../domain/plan';
import type { Routine } from '../domain/routine';
import type { RoutineDay } from '../domain/routineDay';
import type { RoutineExercise } from '../domain/routineExercise';
import type { WorkoutSession } from '../domain/workoutSession';
import type { WorkoutSet } from '../domain/workoutSet';
import { renderQueryHook } from './testing';
import { useMembership } from './useMembership';
import { useMyBookings } from './useMyBookings';
import { useRoutine } from './useRoutine';
import { useWorkoutHistory } from './useWorkoutHistory';

jest.mock('../api/bookings');
jest.mock('../api/memberships');
jest.mock('../api/routines');
jest.mock('../api/workouts');

const booking: Booking = {
  id: 'booking-1',
  userId: 'user-1',
  classSessionId: 'class-1',
  status: 'confirmed',
  createdAt: '2026-11-01T10:00:00-03:00',
  cancelledAt: null,
};
const membership: Membership = {
  id: 'membership-1',
  userId: 'user-1',
  planId: 'plan-2',
  startDate: '2026-10-05',
  endDate: '2026-11-04',
};
const plan: Plan = { id: 'plan-2', name: '3 veces por semana', price: 36000, weeklyClassLimit: 3 };
const routine: Routine = {
  id: 'routine-1',
  userId: 'user-1',
  trainerId: 'trainer-1',
  name: 'Hipertrofia',
  startDate: '2026-08-31',
  endDate: null,
  isActive: true,
};
const days: RoutineDay[] = [
  { id: 'day-1', routineId: 'routine-1', order: 1, name: 'Día A' },
  { id: 'day-2', routineId: 'routine-1', order: 2, name: 'Día B' },
];
const routineExercise: RoutineExercise = {
  id: 're-1',
  routineDayId: 'day-1',
  exerciseId: 'wger-73',
  order: 1,
  targetSets: 3,
  targetReps: '8',
  targetWeightKg: 50,
  targetSeconds: null,
  restSeconds: 90,
  notes: null,
};
const workout: WorkoutSession = {
  id: 'workout-1',
  userId: 'user-1',
  routineDayId: 'day-1',
  startedAt: '2026-11-02T19:00:00-03:00',
  finishedAt: '2026-11-02T20:00:00-03:00',
  notes: null,
};
const set: WorkoutSet = {
  id: 'set-1',
  workoutSessionId: 'workout-1',
  exerciseId: 'wger-73',
  order: 1,
  weightKg: 50,
  reps: 8,
  seconds: null,
  completed: true,
  completedAt: '2026-11-02T19:05:00-03:00',
};

beforeEach(() => jest.resetAllMocks());

describe('useMyBookings', () => {
  it('loads the bookings of the user', async () => {
    jest.mocked(getUserBookings).mockResolvedValue([booking]);
    const { result } = await renderQueryHook(() => useMyBookings('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([booking]);
    expect(jest.mocked(getUserBookings).mock.calls[0]?.[0]).toBe('user-1');
  });

  it('does not fetch without a user (logged out)', async () => {
    const { result } = await renderQueryHook(() => useMyBookings(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserBookings).not.toHaveBeenCalled();
  });
});

describe('useMembership', () => {
  it('loads the membership together with its plan', async () => {
    jest.mocked(getUserMembership).mockResolvedValue(membership);
    jest.mocked(getPlan).mockResolvedValue(plan);
    const { result } = await renderQueryHook(() => useMembership('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ membership, plan });
    expect(jest.mocked(getPlan).mock.calls[0]?.[0]).toBe('plan-2');
  });

  it('returns null without asking for a plan when the user has no membership', async () => {
    jest.mocked(getUserMembership).mockResolvedValue(null);
    const { result } = await renderQueryHook(() => useMembership('user-4'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(getPlan).not.toHaveBeenCalled();
  });

  it('fails when the plan cannot be loaded', async () => {
    jest.mocked(getUserMembership).mockResolvedValue(membership);
    jest.mocked(getPlan).mockRejectedValue(new Error('404'));
    const { result } = await renderQueryHook(() => useMembership('user-1'));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch without a user', async () => {
    const { result } = await renderQueryHook(() => useMembership(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(getUserMembership).not.toHaveBeenCalled();
  });
});

describe('useRoutine', () => {
  it('loads the active routine with its days and exercises', async () => {
    jest.mocked(getActiveRoutine).mockResolvedValue(routine);
    jest.mocked(getRoutineDays).mockResolvedValue(days);
    jest.mocked(getRoutineExercises).mockResolvedValue([routineExercise]);
    const { result } = await renderQueryHook(() => useRoutine('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ routine, days, exercises: [routineExercise] });
    expect(jest.mocked(getRoutineDays).mock.calls[0]?.[0]).toBe('routine-1');
    expect(jest.mocked(getRoutineExercises).mock.calls[0]?.[0]).toEqual(['day-1', 'day-2']);
  });

  it('returns null when the user has no routine assigned', async () => {
    jest.mocked(getActiveRoutine).mockResolvedValue(null);
    const { result } = await renderQueryHook(() => useRoutine('user-4'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(getRoutineDays).not.toHaveBeenCalled();
  });

  it('does not fetch without a user', async () => {
    const { result } = await renderQueryHook(() => useRoutine(null));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useWorkoutHistory', () => {
  it('loads the workouts and their sets', async () => {
    jest.mocked(getWorkoutSessions).mockResolvedValue([workout]);
    jest.mocked(getWorkoutSets).mockResolvedValue([set]);
    const { result } = await renderQueryHook(() => useWorkoutHistory('user-1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ sessions: [workout], sets: [set] });
    expect(jest.mocked(getWorkoutSets).mock.calls[0]?.[0]).toEqual(['workout-1']);
  });

  it('returns empty lists for a user without workouts', async () => {
    jest.mocked(getWorkoutSessions).mockResolvedValue([]);
    jest.mocked(getWorkoutSets).mockResolvedValue([]);
    const { result } = await renderQueryHook(() => useWorkoutHistory('user-4'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ sessions: [], sets: [] });
  });

  it('does not fetch without a user', async () => {
    const { result } = await renderQueryHook(() => useWorkoutHistory(null));
    expect(result.current.fetchStatus).toBe('idle');
  });
});
