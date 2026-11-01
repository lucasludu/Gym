import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';

import { isApiError } from '../../src/api/client';
import { useUser } from '../../src/hooks/useUser';
import { useSignOut } from '../../src/hooks/useSignOut';
import { useSession } from '../../src/store/appSession';
import { useTheme } from '../../src/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TABS: readonly { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home-outline' },
  { name: 'classes', title: 'Clases', icon: 'calendar-month-outline' },
  { name: 'routine', title: 'Rutina', icon: 'clipboard-list-outline' },
  { name: 'progress', title: 'Progreso', icon: 'chart-line' },
  { name: 'profile', title: 'Perfil', icon: 'account-circle-outline' },
];

export default function TabsLayout() {
  const userId = useSession((s) => s.userId);
  const user = useUser(userId);
  const signOut = useSignOut();
  const { colors } = useTheme();

  // The saved account no longer exists: sign out. Network errors keep the session.
  const accountGone = isApiError(user.error) && user.error.status === 404;
  useEffect(() => {
    if (accountGone) void signOut();
  }, [accountGone, signOut]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, size }) => (
              <MaterialCommunityIcons
                name={icon}
                size={size}
                color={focused ? colors.primary : colors.textMuted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
