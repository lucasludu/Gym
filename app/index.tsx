import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export default function HomeScreen() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.md, backgroundColor: colors.background }]}>
      <Text style={[typography.title, { color: colors.text }]}>Gym</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
