import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import type { MuscleGroup } from '../../domain/exercise';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const MUSCLE_GROUP_LABELS: Readonly<Record<MuscleGroup, string>> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
  full_body: 'Cuerpo completo',
};

export const MUSCLE_GROUP_ICONS: Readonly<Record<MuscleGroup, IconName>> = {
  chest: 'weight-lifter',
  back: 'rowing',
  legs: 'run',
  shoulders: 'human-handsup',
  arms: 'arm-flex',
  core: 'stomach',
  full_body: 'human',
};
