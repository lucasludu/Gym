import { bookingSchema } from '../src/domain/booking';
import { canBookClass, canCancelBooking, type UserBooking } from '../src/domain/bookingRules';
import { classSessionSchema, hasStarted, isFull } from '../src/domain/classSession';
import { classTypeSchema } from '../src/domain/classType';
import { addDays, getWeekStart, toLocalDate } from '../src/domain/dates';
import { exerciseSchema } from '../src/domain/exercise';
import { getMembershipStatus, membershipSchema } from '../src/domain/membership';
import { getPersonalRecords, isNewRecord } from '../src/domain/personalRecord';
import { planSchema } from '../src/domain/plan';
import { routineSchema } from '../src/domain/routine';
import { routineDaySchema } from '../src/domain/routineDay';
import { routineExerciseSchema } from '../src/domain/routineExercise';
import { getWeeklyStreak } from '../src/domain/streak';
import { trainerSchema } from '../src/domain/trainer';
import { userSchema } from '../src/domain/user';
import { workoutSessionSchema } from '../src/domain/workoutSession';
import { workoutSetSchema } from '../src/domain/workoutSet';
import db from './db.json';
import { MAIN_USER_ID, buildSeed, type SeedData } from './seed';

const exercises = exerciseSchema.array().parse(db.exercises);

// Wednesday 10:00 in Buenos Aires.
const NOW = '2026-11-04T10:00:00-03:00';
const seed = buildSeed(NOW, exercises);

const MS_PER_MINUTE = 60_000;

// ---------------------------------------------------------------------------
// Helpers

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]));

const durationOf = (data: SeedData, classTypeId: string): number => {
  const classType = data.classTypes.find((t) => t.id === classTypeId);
  if (classType === undefined) throw new Error(`Unknown class type ${classTypeId}`);
  return classType.durationMinutes;
};

const userBookingsOf = (data: SeedData, userId: string): UserBooking[] => {
  const sessions = byId(data.classSessions);
  return data.bookings
    .filter((b) => b.userId === userId)
    .map((b) => {
      const session = sessions.get(b.classSessionId);
      if (session === undefined) throw new Error(`Booking ${b.id} has no session`);
      return {
        status: b.status,
        classSession: {
          id: session.id,
          startsAt: session.startsAt,
          durationMinutes: durationOf(data, session.classTypeId),
        },
      };
    });
};

const membershipOf = (data: SeedData, userId: string) =>
  data.memberships.find((m) => m.userId === userId) ?? null;

const canUserBook = (data: SeedData, userId: string, now: string) => {
  const membership = membershipOf(data, userId);
  const plan =
    membership === null ? null : (data.plans.find((p) => p.id === membership.planId) ?? null);
  const userBookings = userBookingsOf(data, userId);
  return (sessionId: string) => {
    const session = data.classSessions.find((s) => s.id === sessionId);
    if (session === undefined) throw new Error(`Unknown session ${sessionId}`);
    return canBookClass({
      classSession: { ...session, durationMinutes: durationOf(data, session.classTypeId) },
      membership,
      plan,
      userBookings,
      now,
    });
  };
};

const reasonsFor = (data: SeedData, userId: string, now: string) => {
  const check = canUserBook(data, userId, now);
  const today = toLocalDate(now);
  return new Set(
    data.classSessions
      .filter((s) => toLocalDate(s.startsAt) >= today)
      .map((s) => {
        const result = check(s.id);
        return result.ok ? 'ok' : result.reason;
      }),
  );
};

const mainUserWorkouts = (data: SeedData) =>
  data.workoutSessions.filter((w) => w.userId === MAIN_USER_ID);

const streakOf = (data: SeedData, userId: string, today: string) => {
  const user = data.users.find((u) => u.id === userId);
  if (user === undefined) throw new Error(`Unknown user ${userId}`);
  const sessions = byId(data.classSessions);
  return getWeeklyStreak({
    workoutSessions: data.workoutSessions.filter((w) => w.userId === userId),
    bookings: data.bookings
      .filter((b) => b.userId === userId)
      .map((b) => {
        const session = sessions.get(b.classSessionId);
        if (session === undefined) throw new Error(`Booking ${b.id} has no session`);
        return { status: b.status, classSession: session };
      }),
    weeklyGoal: user.weeklyGoal,
    today,
  });
};

/** A "now" for each day of the current week plus late-night and early-morning edges. */
const NOWS = [
  ...Array.from({ length: 7 }, (_, i) => `${addDays('2026-11-02', i)}T10:00:00-03:00`),
  '2026-11-08T23:50:00-03:00', // Sunday night
  '2026-11-09T00:05:00-03:00', // Monday just after midnight
  '2026-11-04T06:00:00-03:00', // before the first class of the day
];

// ---------------------------------------------------------------------------

describe('buildSeed', () => {
  it('is deterministic for the same "now"', () => {
    expect(buildSeed(NOW, exercises)).toEqual(seed);
  });

  it('does not include the exercises collection (it belongs to the importer)', () => {
    expect(seed).not.toHaveProperty('exercises');
  });

  it('throws when a routine exercise is missing from the catalog', () => {
    expect(() => buildSeed(NOW, exercises.slice(0, 5))).toThrow(/not found/);
  });

  describe.each(NOWS)('invariants with now = %s', (now) => {
    const data = buildSeed(now, exercises);
    const today = toLocalDate(now);

    it('passes every schema', () => {
      expect(() => {
        userSchema.array().parse(data.users);
        planSchema.array().parse(data.plans);
        membershipSchema.array().parse(data.memberships);
        trainerSchema.array().parse(data.trainers);
        classTypeSchema.array().parse(data.classTypes);
        classSessionSchema.array().parse(data.classSessions);
        bookingSchema.array().parse(data.bookings);
        routineSchema.array().parse(data.routines);
        routineDaySchema.array().parse(data.routineDays);
        routineExerciseSchema.array().parse(data.routineExercises);
        workoutSessionSchema.array().parse(data.workoutSessions);
        workoutSetSchema.array().parse(data.workoutSets);
      }).not.toThrow();
    });

    it('has unique ids in every collection', () => {
      Object.values(data).forEach((collection: readonly { id: string }[]) => {
        expect(new Set(collection.map((item) => item.id)).size).toBe(collection.length);
      });
    });

    it('only references existing ids', () => {
      const ids = {
        users: byId(data.users),
        plans: byId(data.plans),
        trainers: byId(data.trainers),
        classTypes: byId(data.classTypes),
        classSessions: byId(data.classSessions),
        routines: byId(data.routines),
        routineDays: byId(data.routineDays),
        workoutSessions: byId(data.workoutSessions),
        exercises: byId(exercises),
      };
      const missing: string[] = [];
      const expectRef = (map: Map<string, unknown>, id: string | null, label: string) => {
        if (id !== null && !map.has(id)) missing.push(`${label}: ${id}`);
      };

      data.memberships.forEach((m) => {
        expectRef(ids.users, m.userId, 'membership.userId');
        expectRef(ids.plans, m.planId, 'membership.planId');
      });
      data.classSessions.forEach((s) => {
        expectRef(ids.classTypes, s.classTypeId, 'session.classTypeId');
        expectRef(ids.trainers, s.trainerId, 'session.trainerId');
      });
      data.bookings.forEach((b) => {
        expectRef(ids.users, b.userId, 'booking.userId');
        expectRef(ids.classSessions, b.classSessionId, 'booking.classSessionId');
      });
      data.routines.forEach((r) => {
        expectRef(ids.users, r.userId, 'routine.userId');
        expectRef(ids.trainers, r.trainerId, 'routine.trainerId');
      });
      data.routineDays.forEach((d) => expectRef(ids.routines, d.routineId, 'day.routineId'));
      data.routineExercises.forEach((e) => {
        expectRef(ids.routineDays, e.routineDayId, 'routineExercise.routineDayId');
        expectRef(ids.exercises, e.exerciseId, 'routineExercise.exerciseId');
      });
      data.workoutSessions.forEach((w) => {
        expectRef(ids.users, w.userId, 'workout.userId');
        expectRef(ids.routineDays, w.routineDayId, 'workout.routineDayId');
      });
      data.workoutSets.forEach((s) => {
        expectRef(ids.workoutSessions, s.workoutSessionId, 'set.workoutSessionId');
        expectRef(ids.exercises, s.exerciseId, 'set.exerciseId');
      });

      expect(missing).toEqual([]);
    });

    it('generates upcoming classes for the next 2 weeks, starting today', () => {
      const upcoming = data.classSessions.filter((s) => toLocalDate(s.startsAt) >= today);
      const days = new Set(upcoming.map((s) => toLocalDate(s.startsAt)));
      expect(days.has(today)).toBe(true);
      expect([...days].every((d) => d <= addDays(today, 13))).toBe(true);
      expect(days.size).toBeGreaterThanOrEqual(12);
    });

    it('never has more confirmed bookings than bookedCount, nor bookedCount above capacity', () => {
      data.classSessions.forEach((s) => {
        const confirmed = data.bookings.filter(
          (b) => b.classSessionId === s.id && b.status === 'confirmed',
        ).length;
        expect(s.bookedCount).toBeGreaterThanOrEqual(confirmed);
        expect(s.bookedCount).toBeLessThanOrEqual(s.capacity);
      });
    });

    it('has a class that already started today and is still running', () => {
      const running = data.classSessions.filter((s) => {
        const endMs = Date.parse(s.startsAt) + durationOf(data, s.classTypeId) * MS_PER_MINUTE;
        return toLocalDate(s.startsAt) === today && hasStarted(s, now) && Date.parse(now) < endMs;
      });
      expect(running.length).toBeGreaterThanOrEqual(1);
    });

    it('has an upcoming full class', () => {
      expect(data.classSessions.some((s) => isFull(s) && !hasStarted(s, now))).toBe(true);
    });

    it('lets the main user hit every booking outcome', () => {
      expect([...reasonsFor(data, MAIN_USER_ID, now)].sort()).toEqual(
        [
          'already_booked',
          'class_full',
          'class_started',
          'ok',
          'schedule_overlap',
          'weekly_limit_reached',
        ].sort(),
      );
    });

    it('has a user without membership and a user with an expired one', () => {
      const withoutMembership = data.users.filter((u) => membershipOf(data, u.id) === null);
      expect(withoutMembership).toHaveLength(1);
      const blockedReasons = data.users.map((u) => reasonsFor(data, u.id, now));
      expect(blockedReasons.some((r) => r.has('no_membership'))).toBe(true);
      expect(blockedReasons.some((r) => r.has('membership_expired'))).toBe(true);
    });

    it('gives the main user an expiring membership', () => {
      const membership = membershipOf(data, MAIN_USER_ID);
      expect(membership).not.toBeNull();
      if (membership !== null) expect(getMembershipStatus(membership, now)).toBe('expiring');
    });

    it('covers the three membership statuses', () => {
      const statuses = new Set(data.memberships.map((m) => getMembershipStatus(m, now)));
      expect([...statuses].sort()).toEqual(['active', 'expired', 'expiring']);
    });

    it('gives the main user a booking that can be cancelled and one that cannot', () => {
      const sessions = byId(data.classSessions);
      const results = data.bookings
        .filter((b) => b.userId === MAIN_USER_ID && b.status === 'confirmed')
        .map((b) => {
          const session = sessions.get(b.classSessionId);
          if (session === undefined) throw new Error(`Booking ${b.id} has no session`);
          return canCancelBooking(b, session, now);
        });
      expect(results).toContain(true);
      expect(results).toContain(false);
    });

    it('keeps the main user streak at 4 weeks, broken 5 weeks ago', () => {
      expect(streakOf(data, MAIN_USER_ID, today)).toBe(4);
    });

    it('stores only finished workouts, all in the past', () => {
      data.workoutSessions.forEach((w) => {
        expect(w.finishedAt).not.toBeNull();
        expect(Date.parse(w.finishedAt ?? '')).toBeLessThanOrEqual(Date.parse(now));
      });
    });
  });

  describe('classes', () => {
    it('has 6 class types, one per accent color', () => {
      expect(new Set(seed.classTypes.map((t) => t.color)).size).toBe(6);
    });

    it('uses every trainer', () => {
      const used = new Set(seed.classSessions.map((s) => s.trainerId));
      expect(used.size).toBe(seed.trainers.length);
    });
  });

  describe('bookings history', () => {
    const statuses = new Set(
      seed.bookings.filter((b) => b.userId === MAIN_USER_ID).map((b) => b.status),
    );

    it.each(['confirmed', 'attended', 'cancelled', 'no_show'] as const)(
      'includes a %s booking for the main user',
      (status) => {
        expect(statuses.has(status)).toBe(true);
      },
    );

    it('includes bookings from other users', () => {
      expect(seed.bookings.some((b) => b.userId !== MAIN_USER_ID)).toBe(true);
    });
  });

  describe('routine', () => {
    const routine = seed.routines.find((r) => r.userId === MAIN_USER_ID && r.isActive);
    const days = seed.routineDays.filter((d) => d.routineId === routine?.id);
    const routineExercises = seed.routineExercises.filter((e) =>
      days.some((d) => d.id === e.routineDayId),
    );
    const catalog = byId(exercises);

    it('gives the main user an active routine with 3 days', () => {
      expect(routine).toBeDefined();
      expect(days.map((d) => d.order)).toEqual([1, 2, 3]);
    });

    it('uses the three tracking types', () => {
      const types = new Set(routineExercises.map((e) => catalog.get(e.exerciseId)?.trackingType));
      expect([...types].sort()).toEqual(['reps', 'time', 'weight_reps']);
    });

    it('includes an exercise without image', () => {
      expect(routineExercises.some((e) => catalog.get(e.exerciseId)?.imageUrl === null)).toBe(true);
    });

    it('sets targetSeconds only for time exercises and a weight only for weighted ones', () => {
      routineExercises.forEach((e) => {
        const trackingType = catalog.get(e.exerciseId)?.trackingType;
        expect(e.targetSeconds !== null).toBe(trackingType === 'time');
        if (trackingType !== 'weight_reps') expect(e.targetWeightKg).toBeNull();
      });
    });
  });

  describe('workout history', () => {
    const workouts = mainUserWorkouts(seed);
    const catalog = byId(exercises);
    const today = toLocalDate(NOW);

    it('spans the 8 weeks before the current one', () => {
      const weeks = new Set(workouts.map((w) => getWeekStart(w.startedAt)));
      for (let k = 1; k <= 8; k += 1) {
        expect(weeks.has(addDays(getWeekStart(today), -7 * k))).toBe(true);
      }
      expect(weeks.has(addDays(getWeekStart(today), -7 * 9))).toBe(false);
    });

    it('includes a free workout (without routine day)', () => {
      expect(workouts.some((w) => w.routineDayId === null)).toBe(true);
    });

    it('has at least one completed set in every workout', () => {
      workouts.forEach((w) => {
        expect(seed.workoutSets.some((s) => s.workoutSessionId === w.id && s.completed)).toBe(true);
      });
    });

    it('includes a set that was not completed', () => {
      expect(seed.workoutSets.some((s) => !s.completed)).toBe(true);
    });

    it('fills each set according to the exercise tracking type', () => {
      seed.workoutSets.forEach((s) => {
        const trackingType = catalog.get(s.exerciseId)?.trackingType;
        expect({
          weight: s.weightKg !== null,
          reps: s.reps !== null,
          seconds: s.seconds !== null,
        }).toEqual({
          weight: trackingType === 'weight_reps',
          reps: trackingType !== 'time',
          seconds: trackingType === 'time',
        });
      });
    });

    it('completes sets during their workout', () => {
      const sessions = byId(seed.workoutSessions);
      seed.workoutSets
        .filter((s) => s.completedAt !== null)
        .forEach((s) => {
          const session = sessions.get(s.workoutSessionId);
          const at = Date.parse(s.completedAt ?? '');
          expect(at).toBeGreaterThanOrEqual(Date.parse(session?.startedAt ?? ''));
          expect(at).toBeLessThanOrEqual(Date.parse(session?.finishedAt ?? ''));
        });
    });

    it('has a personal record set in the latest week', () => {
      const lastWeek = addDays(getWeekStart(today), -7);
      const isBefore = (date: string) => getWeekStart(date) < lastWeek;
      const sessions = byId(seed.workoutSessions);
      const previousSets = seed.workoutSets.filter((s) =>
        isBefore(sessions.get(s.workoutSessionId)?.startedAt ?? ''),
      );
      const records = byId(
        getPersonalRecords(previousSets).map((r) => ({ ...r, id: r.exerciseId })),
      );
      const lastWeekSets = seed.workoutSets.filter(
        (s) => getWeekStart(sessions.get(s.workoutSessionId)?.startedAt ?? '') === lastWeek,
      );
      expect(lastWeekSets.some((s) => isNewRecord(s, records.get(s.exerciseId) ?? null))).toBe(
        true,
      );
    });
  });
});
