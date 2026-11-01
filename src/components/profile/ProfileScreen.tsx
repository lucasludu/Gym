import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { useUser } from '../../hooks/useUser';
import { useSession } from '../../store/appSession';
import { useTheme } from '../../theme';
import { Button, Card, LoadingSkeleton, Text } from '../ui';

/** Profile tab. For now: who is signed in (the full profile arrives in T5.31). */
export function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const userId = useSession((s) => s.userId);
  const user = useUser(userId);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
    >
      <Card>
        {user.data === undefined ? (
          <LoadingSkeleton rows={1} accessibilityLabel="Cargando perfil" />
        ) : (
          <>
            <Text variant="title">
              {user.data.firstName} {user.data.lastName}
            </Text>
            <Text color="textMuted">{user.data.email}</Text>
          </>
        )}
      </Card>
      {__DEV__ && (
        <Button
          label="Ver componentes"
          variant="secondary"
          accessibilityHint="Abre la pantalla de muestra del design system"
          onPress={() => router.push('/showcase')}
        />
      )}
    </ScrollView>
  );
}
