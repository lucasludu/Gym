import { planSchema } from './plan';

const validPlan = { id: 'plan-1', name: 'Pase libre', price: 45000, weeklyClassLimit: null };

describe('planSchema', () => {
  it('accepts a plan without class limit', () => {
    expect(planSchema.parse(validPlan)).toEqual(validPlan);
  });

  it('accepts a plan with a weekly class limit', () => {
    const plan = { ...validPlan, name: '3 veces por semana', weeklyClassLimit: 3 };
    expect(planSchema.safeParse(plan).success).toBe(true);
  });

  it('accepts a free plan (price 0)', () => {
    expect(planSchema.safeParse({ ...validPlan, price: 0 }).success).toBe(true);
  });

  it.each([
    ['empty name', { name: '' }],
    ['negative price', { price: -1 }],
    ['weeklyClassLimit 0', { weeklyClassLimit: 0 }],
    ['non-integer weeklyClassLimit', { weeklyClassLimit: 2.5 }],
    ['missing weeklyClassLimit', { weeklyClassLimit: undefined }],
  ])('rejects %s', (_label, patch) => {
    expect(planSchema.safeParse({ ...validPlan, ...patch }).success).toBe(false);
  });
});
