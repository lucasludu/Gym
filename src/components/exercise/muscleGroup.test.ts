import { muscleGroupSchema } from '../../domain/exercise';
import { MUSCLE_GROUP_ICONS, MUSCLE_GROUP_LABELS } from './muscleGroup';

describe('muscle group presentation', () => {
  it.each(muscleGroupSchema.options)('%s has a Spanish label and an icon', (group) => {
    expect(MUSCLE_GROUP_LABELS[group]).toMatch(/\S/);
    expect(MUSCLE_GROUP_ICONS[group]).toMatch(/\S/);
  });

  it('has a different label for each group', () => {
    const labels = Object.values(MUSCLE_GROUP_LABELS);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('has a different icon for each group', () => {
    const icons = Object.values(MUSCLE_GROUP_ICONS);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('uses the expected Spanish labels', () => {
    expect(MUSCLE_GROUP_LABELS).toEqual({
      chest: 'Pecho',
      back: 'Espalda',
      legs: 'Piernas',
      shoulders: 'Hombros',
      arms: 'Brazos',
      core: 'Core',
      full_body: 'Cuerpo completo',
    });
  });
});
