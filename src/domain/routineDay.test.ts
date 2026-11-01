import { routineDaySchema } from './routineDay';

const validDay = { id: 'routine-day-1', routineId: 'routine-1', order: 1, name: 'Día A' };

describe('routineDaySchema', () => {
  it('accepts a valid routine day', () => {
    expect(routineDaySchema.parse(validDay)).toEqual(validDay);
  });

  it.each([
    ['order 0', { order: 0 }],
    ['non-integer order', { order: 1.5 }],
    ['empty name', { name: '' }],
    ['empty routineId', { routineId: '' }],
  ])('rejects %s', (_label, patch) => {
    expect(routineDaySchema.safeParse({ ...validDay, ...patch }).success).toBe(false);
  });
});
