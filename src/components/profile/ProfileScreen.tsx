import { router } from 'expo-router';
import { Alert, ScrollView } from 'react-native';

import { useSignOut } from '../../hooks/useSignOut';
import { useUser } from '../../hooks/useUser';
import { useSession } from '../../store/appSession';
import { useTheme } from '../../theme';
import { Button, Card, LoadingSkeleton, Text } from '../ui';
import { getSignOutConfirmation } from './signOutConfirmation';

/** Profile tab. For now: who is signed in and sign out (the full profile arrives in T5.31). */
export function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const userId = useSession((s) => s.userId);
  const user = useUser(userId);
  const signOut = useSignOut();

  const confirmSignOut = () => {
    // The in-progress workout store arrives in T5.25; until then there is none.
    const { title, message } = getSignOutConfirmation(false);
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

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
      <Button label="Cerrar sesión" variant="danger" onPress={confirmSignOut} />
    </ScrollView>
  );
}
