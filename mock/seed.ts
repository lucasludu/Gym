import type { Booking } from '../src/domain/booking';
import type { ClassSession } from '../src/domain/classSession';
import type { ClassType } from '../src/domain/classType';
import { toInstantMs } from '../src/domain/common';
import { addDays, getWeekStart, toLocalDate, type LocalDate } from '../src/domain/dates';
import type { Exercise } from '../src/domain/exercise';
import type { Membership } from '../src/domain/membership';
import type { Plan } from '../src/domain/plan';
import type { Routine } from '../src/domain/routine';
import type { RoutineDay } from '../src/domain/routineDay';
import type { RoutineExercise } from '../src/domain/routineExercise';
import type { Trainer } from '../src/domain/trainer';
import type { User } from '../src/domain/user';
import type { WorkoutSession } from '../src/domain/workoutSession';
import type { WorkoutSet } from '../src/domain/workoutSet';

/**
 * Builds the mock data (everything except `exercises`) relative to `now`, so the mock
 * never goes stale. Pure and deterministic: same `now` and catalog, same output.
 *
 * Edge cases covered (see "API mock" in specs/01-modelo-datos.md), for the main user:
 * - expiring membership, plan limited to 3 classes per week
 * - a class running right now, an upcoming full class, a booking within 2 hours
 *   (cannot be cancelled), a schedule overlap and the weekly limit reached next week
 * - 8 weeks of history with a 4-week streak, broken 5 weeks ago
 * - routine with the three tracking types and an exercise without image
 * Other users: one with an active membership, one expired and one without membership.
 */

export const MAIN_USER_ID = 'user-1';

export interface SeedData {
  users: User[];
  plans: Plan[];
  memberships: Membership[];
  trainers: Trainer[];
  classTypes: ClassType[];
  classSessions: ClassSession[];
  bookings: Booking[];
  routines: Routine[];
  routineDays: RoutineDay[];
  routineExercises: RoutineExercise[];
  workoutSessions: WorkoutSession[];
  workoutSets: WorkoutSet[];
}

// ---------------------------------------------------------------------------
// Time helpers (Buenos Aires, fixed UTC-3)

const MS_PER_MINUTE = 60_000;
const OFFSET_MS = -3 * 60 * MS_PER_MINUTE;

/** "2026-11-04" + "19:00" → "2026-11-04T19:00:00-03:00" */
const at = (date: LocalDate, time: string): string => `${date}T${time}:00-03:00`;

const isoFromMs = (ms: number): string =>
  `${new Date(ms + OFFSET_MS).toISOString().slice(0, 19)}-03:00`;

const FIVE_MINUTES = 5 * MS_PER_MINUTE;
const floorTo5 = (ms: number) => Math.floor(ms / FIVE_MINUTES) * FIVE_MINUTES;
const ceilTo5 = (ms: number) => Math.ceil(ms / FIVE_MINUTES) * FIVE_MINUTES;

// ---------------------------------------------------------------------------
// Static catalog

const plans: Plan[] = [
  { id: 'plan-1', name: 'Pase libre', price: 48000, weeklyClassLimit: null },
  { id: 'plan-2', name: '3 veces por semana', price: 36000, weeklyClassLimit: 3 },
  { id: 'plan-3', name: '2 veces por semana', price: 28000, weeklyClassLimit: 2 },
];

const trainers: Trainer[] = [
  { id: 'trainer-1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null },
  { id: 'trainer-2', firstName: 'Nicolás', lastName: 'Pérez', avatarUrl: null },
  { id: 'trainer-3', firstName: 'Lucía', lastName: 'Sosa', avatarUrl: null },
  { id: 'trainer-4', firstName: 'Diego', lastName: 'Romero', avatarUrl: null },
];

type ClassKey = 'funcional' | 'spinning' | 'yoga' | 'pilates' | 'zumba' | 'hiit';

const CLASS_TYPES: Record<ClassKey, ClassType & { capacity: number; trainerId: string }> = {
  funcional: {
    id: 'class-type-funcional',
    name: 'Funcional',
    description: 'Circuitos con el peso del cuerpo y elementos para ganar fuerza y resistencia.',
    durationMinutes: 60,
    intensity: 'high',
    color: 'accentOrange',
    capacity: 20,
    trainerId: 'trainer-1',
  },
  spinning: {
    id: 'class-type-spinning',
    name: 'Spinning',
    description: 'Bicicleta fija al ritmo de la música, con cambios de intensidad.',
    durationMinutes: 45,
    intensity: 'high',
    color: 'accentBlue',
    capacity: 15,
    trainerId: 'trainer-2',
  },
  yoga: {
    id: 'class-type-yoga',
    name: 'Yoga',
    description: 'Posturas, respiración y relajación para ganar movilidad.',
    durationMinutes: 60,
    intensity: 'low',
    color: 'accentGreen',
    capacity: 12,
    trainerId: 'trainer-4',
  },
  pilates: {
    id: 'class-type-pilates',
    name: 'Pilates',
    description: 'Trabajo de core, postura y control del movimiento.',
    durationMinutes: 50,
    intensity: 'medium',
    color: 'accentPurple',
    capacity: 10,
    trainerId: 'trainer-4',
  },
  zumba: {
    id: 'class-type-zumba',
    name: 'Zumba',
    description: 'Baile aeróbico con ritmos latinos.',
    durationMinutes: 55,
    intensity: 'medium',
    color: 'accentPink',
    capacity: 25,
    trainerId: 'trainer-3',
  },
  hiit: {
    id: 'class-type-hiit',
    name: 'HIIT',
    description: 'Intervalos cortos de alta intensidad con pausas breves.',
    durationMinutes: 30,
    intensity: 'high',
    color: 'accentTeal',
    capacity: 16,
    trainerId: 'trainer-3',
  },
};

type Slot = readonly [time: string, key: ClassKey];

/** Weekly schedule by weekday (0 = Monday). 19:00 has two classes at once (two rooms). */
const scheduleFor = (weekday: number): readonly Slot[] => {
  if (weekday === 6) return [['10:00', 'yoga']];
  if (weekday === 5) {
    return [
      ['09:00', 'funcional'],
      ['10:30', 'yoga'],
      ['12:00', 'zumba'],
    ];
  }
  return [
    ['07:00', 'funcional'],
    ['08:30', 'spinning'],
    ['12:30', 'hiit'],
    ['18:00', weekday % 2 === 0 ? 'yoga' : 'pilates'],
    ['19:00', 'spinning'],
    ['19:00', 'funcional'],
    ['20:15', 'zumba'],
  ];
};

const sessionId = (date: LocalDate, time: string, key: ClassKey) =>
  `class-${date}-${time.replace(':', '')}-${key}`;

// ---------------------------------------------------------------------------
// Routine

interface PlannedExercise {
  sourceId: string;
  targetReps: string;
  /** Weight in week 0 of the history; null for non-weighted exercises. */
  baseWeightKg: number | null;
  /** Weight added every 2 weeks. */
  stepKg: number;
  /** Reps (or seconds for time exercises) in week 0. */
  baseAmount: number;
  notes: string | null;
}

const ROUTINE_DAYS: readonly { name: string; exercises: readonly PlannedExercise[] }[] = [
  {
    name: 'Día A – Tren inferior',
    exercises: [
      {
        sourceId: '615',
        targetReps: '8-10',
        baseWeightKg: 60,
        stepKg: 2.5,
        baseAmount: 10,
        notes: 'Bajá hasta la paralela.',
      },
      {
        sourceId: '507',
        targetReps: '10',
        baseWeightKg: 50,
        stepKg: 2.5,
        baseAmount: 10,
        notes: null,
      },
      {
        sourceId: '1706',
        targetReps: '10',
        baseWeightKg: 12,
        stepKg: 1,
        baseAmount: 10,
        notes: 'Por pierna.',
      },
      {
        sourceId: '458',
        targetReps: '1',
        baseWeightKg: null,
        stepKg: 0,
        baseAmount: 30,
        notes: null,
      },
    ],
  },
  {
    name: 'Día B – Empuje',
    exercises: [
      {
        sourceId: '73',
        targetReps: '8',
        baseWeightKg: 50,
        stepKg: 2.5,
        baseAmount: 8,
        notes: null,
      },
      {
        sourceId: '418',
        targetReps: '8-10',
        baseWeightKg: 30,
        stepKg: 2.5,
        baseAmount: 9,
        notes: null,
      },
      {
        sourceId: '1378',
        targetReps: '12',
        baseWeightKg: 7.5,
        stepKg: 1,
        baseAmount: 12,
        notes: null,
      },
      {
        sourceId: '194',
        targetReps: 'AMRAP',
        baseWeightKg: null,
        stepKg: 0,
        baseAmount: 6,
        notes: null,
      },
    ],
  },
  {
    name: 'Día C – Tirón',
    exercises: [
      {
        sourceId: '184',
        targetReps: '5',
        baseWeightKg: 80,
        stepKg: 5,
        baseAmount: 5,
        notes: 'Espalda neutra.',
      },
      {
        sourceId: '1698',
        targetReps: '8-10',
        baseWeightKg: 40,
        stepKg: 2.5,
        baseAmount: 9,
        notes: null,
      },
      {
        sourceId: '475',
        targetReps: 'AMRAP',
        baseWeightKg: null,
        stepKg: 0,
        baseAmount: 4,
        notes: null,
      },
      {
        sourceId: '92',
        targetReps: '10-12',
        baseWeightKg: 10,
        stepKg: 1,
        baseAmount: 11,
        notes: null,
      },
    ],
  },
];

/** Exercises of the free workout (not from the routine). */
const FREE_WORKOUT: readonly PlannedExercise[] = [
  ROUTINE_DAYS[2].exercises[2], // pull-ups
  ROUTINE_DAYS[0].exercises[3], // plank
  ROUTINE_DAYS[2].exercises[3], // biceps curl
];

const SETS_PER_EXERCISE = 3;
const REST_SECONDS = 90;
const TIME_SECONDS_STEP = 5;

// ---------------------------------------------------------------------------
// History plan for the main user (weeks before the current one; 0 = Monday)

interface HistoryWeek {
  workoutDays: readonly number[];
  freeWorkoutDay?: number;
  attendedDays?: readonly (readonly [weekday: number, time: string, key: ClassKey])[];
  noShowDays?: readonly (readonly [weekday: number, time: string, key: ClassKey])[];
  cancelledDays?: readonly (readonly [weekday: number, time: string, key: ClassKey])[];
}

/** Index k - 1 is k weeks before the current one. Week 5 is the broken one. */
const HISTORY: readonly HistoryWeek[] = [
  { workoutDays: [0, 2, 4] },
  { workoutDays: [0, 2], attendedDays: [[4, '19:00', 'spinning']] },
  { workoutDays: [1, 3, 5], cancelledDays: [[2, '18:00', 'yoga']] },
  { workoutDays: [0, 2, 4], attendedDays: [[1, '07:00', 'funcional']] },
  { workoutDays: [1], noShowDays: [[3, '19:00', 'spinning']] },
  { workoutDays: [0, 2], freeWorkoutDay: 4 },
  { workoutDays: [0, 3], attendedDays: [[5, '10:30', 'yoga']] },
  { workoutDays: [0, 2, 4] },
];

// ---------------------------------------------------------------------------

export function buildSeed(now: string | Date, exercises: readonly Exercise[]): SeedData {
  const nowMs = toInstantMs(now);
  const today = toLocalDate(now);
  const weekStart = getWeekStart(today);
  const nextWeek = addDays(weekStart, 7);
  const daysAgo = (days: number, time = '10:00') => at(addDays(today, -days), time);

  const exerciseBySourceId = new Map(
    exercises.filter((e) => e.source === 'wger').map((e) => [e.sourceId, e]),
  );
  const exerciseFor = (sourceId: string): Exercise => {
    const exercise = exerciseBySourceId.get(sourceId);
    if (exercise === undefined) {
      throw new Error(`Exercise wger ${sourceId} not found; run npm run import:exercises`);
    }
    return exercise;
  };

  // --- Users and memberships ------------------------------------------------

  const users: User[] = [
    {
      id: MAIN_USER_ID,
      firstName: 'Sofía',
      lastName: 'Martínez',
      email: 'sofia.martinez@example.com',
      avatarUrl: null,
      weeklyGoal: 3,
      createdAt: daysAgo(200),
    },
    {
      id: 'user-2',
      firstName: 'Martín',
      lastName: 'Gómez',
      email: 'martin.gomez@example.com',
      avatarUrl: null,
      weeklyGoal: 4,
      createdAt: daysAgo(90),
    },
    {
      id: 'user-3',
      firstName: 'Valentina',
      lastName: 'López',
      email: 'valentina.lopez@example.com',
      avatarUrl: null,
      weeklyGoal: 2,
      createdAt: daysAgo(120),
    },
    {
      id: 'user-4',
      firstName: 'Joaquín',
      lastName: 'Fernández',
      email: 'joaquin.fernandez@example.com',
      avatarUrl: null,
      weeklyGoal: 3,
      createdAt: daysAgo(1),
    },
  ];

  const memberships: Membership[] = [
    // Expiring: 3 days left.
    {
      id: 'membership-1',
      userId: MAIN_USER_ID,
      planId: 'plan-2',
      startDate: addDays(today, -27),
      endDate: addDays(today, 3),
    },
    {
      id: 'membership-2',
      userId: 'user-2',
      planId: 'plan-1',
      startDate: addDays(today, -10),
      endDate: addDays(today, 20),
    },
    // Expired 15 days ago.
    {
      id: 'membership-3',
      userId: 'user-3',
      planId: 'plan-3',
      startDate: addDays(today, -45),
      endDate: addDays(today, -15),
    },
    // user-4 just registered: no membership.
  ];

  // --- Class sessions -------------------------------------------------------

  const sessions = new Map<string, ClassSession>();
  let occupancyIndex = 0;

  /** Deterministic occupancy between 30% and 84% of capacity, never full. */
  const addSession = (id: string, startsAt: string, key: ClassKey): ClassSession => {
    const existing = sessions.get(id);
    if (existing !== undefined) return existing;
    const type = CLASS_TYPES[key];
    const ratio = 0.3 + 0.06 * ((occupancyIndex * 7) % 10);
    occupancyIndex += 1;
    const session: ClassSession = {
      id,
      classTypeId: type.id,
      trainerId: type.trainerId,
      startsAt,
      capacity: type.capacity,
      bookedCount: Math.floor(type.capacity * ratio),
    };
    sessions.set(id, session);
    return session;
  };

  const addScheduled = (date: LocalDate, time: string, key: ClassKey) =>
    addSession(sessionId(date, time, key), at(date, time), key);

  // Next 2 weeks, today included (also classes that already happened today).
  for (let d = 0; d < 14; d += 1) {
    const date = addDays(today, d);
    const weekday = (Date.parse(`${date}T00:00:00Z`) / 86_400_000 + 3) % 7; // 1970-01-01 was Thursday
    scheduleFor(weekday).forEach(([time, key]) => addScheduled(date, time, key));
  }

  // Running right now: started 30 minutes ago (or at midnight, if earlier).
  const dayStartMs = toInstantMs(at(today, '00:00'));
  addSession(
    'class-started',
    isoFromMs(Math.max(dayStartMs, floorTo5(nowMs - 30 * MS_PER_MINUTE))),
    'funcional',
  );
  // Starts in about an hour: the main user booked it and can no longer cancel.
  const soonClass = addSession(
    'class-soon',
    isoFromMs(ceilTo5(nowMs + 60 * MS_PER_MINUTE)),
    'hiit',
  );

  // Next week: an upcoming full class.
  const fullClass = addScheduled(addDays(nextWeek, 3), '20:15', 'zumba');
  fullClass.bookedCount = fullClass.capacity;

  // --- Bookings -------------------------------------------------------------

  const bookings: Booking[] = [];
  const addBooking = (
    userId: string,
    session: ClassSession,
    status: Booking['status'],
    createdAt: string,
    cancelledAt: string | null = null,
  ) => {
    bookings.push({
      id: `booking-${bookings.length + 1}`,
      userId,
      classSessionId: session.id,
      status,
      createdAt,
      cancelledAt,
    });
  };

  const twoDaysAgo = isoFromMs(nowMs - 2 * 24 * 60 * MS_PER_MINUTE);
  const yesterday = isoFromMs(nowMs - 24 * 60 * MS_PER_MINUTE);

  // Main user, upcoming: next week reaches the 3-per-week limit.
  // Monday 19:00 Spinning overlaps with Monday 19:00 Funcional (schedule_overlap).
  addBooking(MAIN_USER_ID, addScheduled(nextWeek, '19:00', 'spinning'), 'confirmed', twoDaysAgo);
  addBooking(
    MAIN_USER_ID,
    addScheduled(addDays(nextWeek, 2), '19:00', 'spinning'),
    'confirmed',
    twoDaysAgo,
  );
  addBooking(
    MAIN_USER_ID,
    addScheduled(addDays(nextWeek, 4), '18:00', 'yoga'),
    'confirmed',
    twoDaysAgo,
  );
  addBooking(MAIN_USER_ID, soonClass, 'confirmed', yesterday);
  addBooking(
    MAIN_USER_ID,
    addScheduled(addDays(nextWeek, 1), '12:30', 'hiit'),
    'cancelled',
    twoDaysAgo,
    yesterday,
  );

  // Main user, history.
  const pastSlot = (weeksAgo: number, weekday: number, time: string, key: ClassKey) =>
    addScheduled(addDays(weekStart, -7 * weeksAgo + weekday), time, key);
  const createdBefore = (session: ClassSession) =>
    isoFromMs(toInstantMs(session.startsAt) - 2 * 24 * 60 * MS_PER_MINUTE);

  HISTORY.forEach((week, index) => {
    const weeksAgo = index + 1;
    week.attendedDays?.forEach(([weekday, time, key]) => {
      const session = pastSlot(weeksAgo, weekday, time, key);
      addBooking(MAIN_USER_ID, session, 'attended', createdBefore(session));
    });
    week.noShowDays?.forEach(([weekday, time, key]) => {
      const session = pastSlot(weeksAgo, weekday, time, key);
      addBooking(MAIN_USER_ID, session, 'no_show', createdBefore(session));
    });
    week.cancelledDays?.forEach(([weekday, time, key]) => {
      const session = pastSlot(weeksAgo, weekday, time, key);
      const cancelledAt = isoFromMs(toInstantMs(session.startsAt) - 24 * 60 * MS_PER_MINUTE);
      addBooking(MAIN_USER_ID, session, 'cancelled', createdBefore(session), cancelledAt);
    });
  });

  // Other users.
  addBooking(
    'user-2',
    addScheduled(addDays(nextWeek, 2), '08:30', 'spinning'),
    'confirmed',
    twoDaysAgo,
  );
  addBooking('user-2', fullClass, 'confirmed', twoDaysAgo);
  const user3Past = pastSlot(2, 0, '07:00', 'funcional');
  addBooking('user-3', user3Past, 'attended', createdBefore(user3Past));

  // bookedCount includes every confirmed booking of the seed.
  bookings
    .filter((b) => b.status === 'confirmed')
    .forEach((b) => {
      const session = sessions.get(b.classSessionId);
      if (session === undefined) return;
      const confirmed = bookings.filter(
        (x) => x.classSessionId === session.id && x.status === 'confirmed',
      ).length;
      session.bookedCount = Math.min(session.capacity, Math.max(session.bookedCount, confirmed));
    });

  // --- Routine --------------------------------------------------------------

  const routines: Routine[] = [
    {
      id: 'routine-1',
      userId: MAIN_USER_ID,
      trainerId: 'trainer-1',
      name: 'Hipertrofia – Bloque 1',
      startDate: addDays(weekStart, -7 * 9),
      endDate: null,
      isActive: true,
    },
  ];

  const routineDays: RoutineDay[] = ROUTINE_DAYS.map((day, i) => ({
    id: `routine-day-${i + 1}`,
    routineId: 'routine-1',
    order: i + 1,
    name: day.name,
  }));

  const routineExercises: RoutineExercise[] = ROUTINE_DAYS.flatMap((day, i) =>
    day.exercises.map((planned, j) => {
      const exercise = exerciseFor(planned.sourceId);
      const isTime = exercise.trackingType === 'time';
      return {
        id: `routine-exercise-${i + 1}-${j + 1}`,
        routineDayId: `routine-day-${i + 1}`,
        exerciseId: exercise.id,
        order: j + 1,
        targetSets: SETS_PER_EXERCISE,
        targetReps: planned.targetReps,
        targetWeightKg: exercise.trackingType === 'weight_reps' ? planned.baseWeightKg : null,
        targetSeconds: isTime ? 45 : null,
        restSeconds: isTime ? 60 : REST_SECONDS,
        notes: planned.notes,
      };
    }),
  );

  // --- Workout history ------------------------------------------------------

  const workoutSessions: WorkoutSession[] = [];
  const workoutSets: WorkoutSet[] = [];
  let rotation = 0;

  const addWorkout = (
    date: LocalDate,
    progress: number,
    planned: readonly PlannedExercise[],
    routineDayId: string | null,
  ) => {
    const id = `workout-${workoutSessions.length + 1}`;
    const startMs = toInstantMs(at(date, '19:00'));
    let setIndex = 0;

    planned.forEach((p) => {
      const exercise = exerciseFor(p.sourceId);
      const steps = Math.ceil(progress / 2);
      for (let s = 1; s <= SETS_PER_EXERCISE; s += 1) {
        setIndex += 1;
        const completedMs = startMs + setIndex * 3 * MS_PER_MINUTE;
        const amount =
          p.baseAmount +
          (exercise.trackingType === 'time' ? steps * TIME_SECONDS_STEP : steps) -
          (s - 1);
        workoutSets.push({
          id: `set-${workoutSessions.length + 1}-${setIndex}`,
          workoutSessionId: id,
          exerciseId: exercise.id,
          order: s,
          weightKg:
            exercise.trackingType === 'weight_reps' && p.baseWeightKg !== null
              ? Math.round((p.baseWeightKg + steps * p.stepKg) * 10) / 10
              : null,
          reps: exercise.trackingType === 'time' ? null : Math.max(1, amount),
          seconds: exercise.trackingType === 'time' ? Math.max(1, amount) : null,
          completed: true,
          completedAt: isoFromMs(completedMs),
        });
      }
    });

    workoutSessions.push({
      id,
      userId: MAIN_USER_ID,
      routineDayId,
      startedAt: isoFromMs(startMs),
      finishedAt: isoFromMs(startMs + (setIndex * 3 + 5) * MS_PER_MINUTE),
      notes: null,
    });
  };

  const addRoutineWorkout = (date: LocalDate, progress: number) => {
    const day = rotation % ROUTINE_DAYS.length;
    rotation += 1;
    addWorkout(date, progress, ROUTINE_DAYS[day].exercises, `routine-day-${day + 1}`);
  };

  // Oldest week first, so ids and the routine rotation follow time.
  [...HISTORY].reverse().forEach((week, reversedIndex) => {
    const weeksAgo = HISTORY.length - reversedIndex;
    const progress = HISTORY.length - weeksAgo; // 0 for the oldest week
    const monday = addDays(weekStart, -7 * weeksAgo);
    const days = [
      ...week.workoutDays,
      ...(week.freeWorkoutDay === undefined ? [] : [week.freeWorkoutDay]),
    ].sort();
    days.forEach((weekday) => {
      const date = addDays(monday, weekday);
      if (weekday === week.freeWorkoutDay) addWorkout(date, progress, FREE_WORKOUT, null);
      else addRoutineWorkout(date, progress);
    });
  });

  // Current week: Monday, if it is already over. One day only, so the week is in progress.
  if (weekStart < today) addRoutineWorkout(weekStart, HISTORY.length);

  // The last set of the latest workout was skipped.
  const lastSet = workoutSets[workoutSets.length - 1];
  if (lastSet !== undefined) {
    lastSet.completed = false;
    lastSet.completedAt = null;
  }

  return {
    users,
    plans,
    memberships,
    trainers,
    classTypes: Object.values(CLASS_TYPES).map(({ capacity: _c, trainerId: _t, ...type }) => type),
    classSessions: [...sessions.values()].sort(
      (a, b) => toInstantMs(a.startsAt) - toInstantMs(b.startsAt) || a.id.localeCompare(b.id),
    ),
    bookings,
    routines,
    routineDays,
    routineExercises,
    workoutSessions,
    workoutSets,
  };
}
