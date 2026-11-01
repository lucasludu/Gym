import { combineQueries, type QueryState } from './combineQueries';

const ok = <T>(data: T): QueryState<T> => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  isRefetching: false,
  refetch: jest.fn(),
});
const loading = (): QueryState<never> => ({
  data: undefined,
  isPending: true,
  isError: false,
  error: null,
  isRefetching: false,
  refetch: jest.fn(),
});
const failed = (error: Error): QueryState<never> => ({
  data: undefined,
  isPending: false,
  isError: true,
  error,
  isRefetching: false,
  refetch: jest.fn(),
});

describe('combineQueries', () => {
  it('has data once every query has data', () => {
    const combined = combineQueries([ok(1), ok('a')] as const, ([n, s]) => `${n}${s}`);
    expect(combined).toMatchObject({ data: '1a', isPending: false, isError: false });
  });

  it('is pending while any query is pending', () => {
    const combined = combineQueries([ok(1), loading()] as const, () => 'x');
    expect(combined).toMatchObject({ data: undefined, isPending: true, isError: false });
  });

  it('fails with the first error', () => {
    const boom = new Error('boom');
    const combined = combineQueries(
      [ok(1), failed(boom), failed(new Error('2'))] as const,
      () => 'x',
    );
    expect(combined).toMatchObject({ data: undefined, isError: true, error: boom });
  });

  it('refetches only the failed queries on retry', async () => {
    const good = ok(1);
    const bad = failed(new Error('boom'));
    await combineQueries([good, bad] as const, () => 'x').refetch();
    expect(bad.refetch).toHaveBeenCalledTimes(1);
    expect(good.refetch).not.toHaveBeenCalled();
  });

  it('is refetching while any query is refetching', () => {
    const combined = combineQueries([ok(1), { ...ok(2), isRefetching: true }] as const, () => 'x');
    expect(combined.isRefetching).toBe(true);
  });
});
