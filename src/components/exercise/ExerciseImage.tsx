import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import type { Exercise } from '../../domain/exercise';
import { useTheme } from '../../theme';
import { Text } from '../ui/Text';
import { MUSCLE_GROUP_ICONS, MUSCLE_GROUP_LABELS } from './muscleGroup';

export type ExerciseImageSize = 'small' | 'medium' | 'large';

export interface ExerciseImageProps {
  exercise: Pick<Exercise, 'name' | 'muscleGroup' | 'imageUrl'>;
  /** small: thumbnail in lists (icon only); medium: card; large: full width, for the detail. */
  size?: ExerciseImageSize;
  accessibilityLabel?: string;
}

const SQUARE: Record<Exclude<ExerciseImageSize, 'large'>, number> = { small: 56, medium: 96 };
const ICON_SIZE: Record<ExerciseImageSize, number> = { small: 28, medium: 40, large: 64 };

/** Only properties shared by View and Image styles, so the same frame fits both. */
interface FrameSize {
  width: DimensionValue;
  height?: number;
  aspectRatio?: number;
}

const frameStyle = (size: ExerciseImageSize): FrameSize =>
  size === 'large'
    ? { width: '100%', aspectRatio: 4 / 3 }
    : { width: SQUARE[size], height: SQUARE[size] };

/**
 * The exercise image with expo-image (disk cache, fade-in, GIF support).
 * Without imageUrl, or when it fails to load, shows a placeholder with the muscle group.
 */
export function ExerciseImage({
  exercise,
  size = 'medium',
  accessibilityLabel,
}: ExerciseImageProps) {
  const theme = useTheme();
  // Remembering *which* URL failed resets the fallback automatically when the URL changes.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { name, muscleGroup, imageUrl } = exercise;
  const frame = [
    frameStyle(size),
    { borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceAlt },
    styles.frame,
  ];

  if (imageUrl !== null && imageUrl !== failedUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? `Imagen de ${name}`}
        contentFit="contain"
        transition={200}
        cachePolicy="disk"
        onError={() => setFailedUrl(imageUrl)}
        style={frame}
      />
    );
  }

  const groupLabel = MUSCLE_GROUP_LABELS[muscleGroup];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${name}, sin imagen (${groupLabel})`}
      style={[frame, styles.placeholder, { gap: theme.spacing.xs }]}
    >
      <MaterialCommunityIcons
        name={MUSCLE_GROUP_ICONS[muscleGroup]}
        size={ICON_SIZE[size]}
        color={theme.colors.textMuted}
      />
      {size !== 'small' && (
        <Text variant="caption" color="textMuted">
          {groupLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
