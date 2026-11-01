/** The part of a TanStack Query result that a card needs to show loading, error and data. */
export interface QueryState<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isRefetching: boolean;
  refetch: () => Promise<unknown> | unknown;
}

type DataOf<Q extends readonly QueryState<unknown>[]> = {
  [K in keyof Q]: Q[K] extends QueryState<infer T> ? T : never;
};

/**
 * Several queries seen as one: data once all have data (combined with `select`),
 * the first error if any failed, and a refetch that retries only the failed ones.
 */
export function combineQueries<const Q extends readonly QueryState<unknown>[], R>(
  queries: Q,
  select: (data: DataOf<Q>) => R,
): QueryState<R> {
  const failed = queries.filter((q) => q.isError);
  const allLoaded = queries.every((q) => q.data !== undefined);
  return {
    // Array#map loses the tuple type; every element is defined here (allLoaded).
    data: allLoaded ? select(queries.map((q) => q.data) as DataOf<Q>) : undefined,
    isPending: !allLoaded && failed.length === 0,
    isError: !allLoaded && failed.length > 0,
    error: failed[0]?.error ?? null,
    isRefetching: queries.some((q) => q.isRefetching),
    refetch: () => Promise.all(failed.map((q) => q.refetch())),
  };
}
