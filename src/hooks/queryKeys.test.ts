import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('builds keys that identify each query', () => {
    expect(queryKeys.classTypes()).toEqual(['classTypes']);
    expect(queryKeys.trainers()).toEqual(['trainers']);
    expect(queryKeys.classSessions({ from: '2026-11-04', to: '2026-11-10' })).toEqual([
      'classSessions',
      '2026-11-04',
      '2026-11-10',
    ]);
    expect(queryKeys.bookings('user-1')).toEqual(['bookings', 'user-1']);
    expect(queryKeys.membership('user-1')).toEqual(['membership', 'user-1']);
    expect(queryKeys.routine('user-1')).toEqual(['routine', 'user-1']);
    expect(queryKeys.exercises()).toEqual(['exercises']);
    expect(queryKeys.workoutHistory('user-1')).toEqual(['workoutHistory', 'user-1']);
  });

  it('nests range keys under a prefix, so all class sessions can be invalidated at once', () => {
    const key = queryKeys.classSessions({ from: '2026-11-04', to: '2026-11-10' });
    expect(key.slice(0, queryKeys.allClassSessions().length)).toEqual(queryKeys.allClassSessions());
  });

  it('separates the data of different users', () => {
    expect(queryKeys.bookings('user-1')).not.toEqual(queryKeys.bookings('user-2'));
  });
});
