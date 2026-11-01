import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';

import { useTheme } from '../../theme';

export interface LoadingSkeletonProps {
  /** Number of placeholder rows (positive integer). Default: 3. */
  rows?: number;
  /** What is loading, for screen readers. Default: "Cargando". */
  accessibilityLabel?: string;
  testID?: string;
}

const PULSE_MS = 700;
const ROW_HEIGHT = 72;

/** Prefers-reduced-motion from the OS; `null` until it is known. */
function useReduceMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduce(value))
      // If the OS cannot tell, err on the side of no motion.
      .catch(() => mounted && setReduce(true));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** Pulsing placeholder rows; announced as a single "Cargando" progress indicator. */
export function LoadingSkeleton({
  rows = 3,
  accessibilityLabel = 'Cargando',
  testID,
}: LoadingSkeletonProps) {
  if (!Number.isInteger(rows) || rows < 1) {
    throw new Error(`LoadingSkeleton rows must be a positive integer, got ${rows}`);
  }
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Only animate once we know motion is allowed, so it never flashes for reduced-motion users.
    if (reduceMotion !== false) {
      opacity.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: PULSE_MS, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: PULSE_MS, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={{ gap: theme.spacing.md, padding: theme.spacing.md }}
    >
      {Array.from({ length: rows }, (_, i) => (
        <Animated.View
          key={i}
          testID="skeleton-row"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          style={{
            height: ROW_HEIGHT,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surfaceAlt,
            opacity,
          }}
        />
      ))}
    </View>
  );
}
