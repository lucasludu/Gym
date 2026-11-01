import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { Text } from '../ui';

interface AuthScreenLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Scrollable form screen that keeps the focused field and the button above the keyboard. */
export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: spacing.lg, gap: spacing.lg }}
        >
          <View style={{ gap: spacing.xs, marginTop: spacing.xl }}>
            <Text variant="display">{title}</Text>
            {subtitle !== undefined && <Text color="textMuted">{subtitle}</Text>}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
