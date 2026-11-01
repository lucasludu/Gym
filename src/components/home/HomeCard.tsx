import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { QueryState } from '../../hooks/combineQueries';
import { useTheme } from '../../theme';
import { Card, ErrorState, LoadingSkeleton, Text } from '../ui';

interface HomeCardProps<T> {
  /** Card heading, announced as a header. */
  title: string;
  query: QueryState<T>;
  children: (data: T) => ReactNode;
}

/**
 * A card of Inicio that loads and fails on its own: skeleton while loading, a compact
 * error whose "Reintentar" only refetches this card, and its content once loaded.
 * Data already shown stays visible while refreshing (pull to refresh).
 */
export function HomeCard<T>({ title, query, children }: HomeCardProps<T>) {
  const { spacing } = useTheme();
  let body: ReactNode;
  if (query.data !== undefined) {
    body = children(query.data);
  } else if (query.isError) {
    body = (
      <ErrorState
        compact
        error={query.error}
        retrying={query.isRefetching}
        onRetry={() => void query.refetch()}
      />
    );
  } else {
    body = <LoadingSkeleton rows={1} accessibilityLabel={`Cargando ${title.toLowerCase()}`} />;
  }

  return (
    <Card testID={`home-card-${title}`}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="textMuted" accessibilityRole="header">
          {title}
        </Text>
        {body}
      </View>
    </Card>
  );
}
