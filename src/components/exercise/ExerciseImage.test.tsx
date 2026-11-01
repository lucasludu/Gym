import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExerciseImage } from './ExerciseImage';

const withImage = {
  name: 'Sentadilla con barra',
  muscleGroup: 'legs',
  imageUrl: 'https://wger.de/media/exercise-images/sentadilla.png',
} as const;

const withoutImage = { ...withImage, imageUrl: null };

// Shape of the native event expo-image sends when an image fails to load.
// A fresh object each time: expo-image redefines properties on the event it receives.
const loadError = () => ({ nativeEvent: { error: 'not found' } });

describe('ExerciseImage', () => {
  describe('with imageUrl', () => {
    it('shows the image, described for screen readers', async () => {
      await render(<ExerciseImage exercise={withImage} />);
      const image = screen.getByRole('image', { name: 'Imagen de Sentadilla con barra' });
      expect(image).toBeOnTheScreen();
    });

    it('loads the image from imageUrl', async () => {
      await render(<ExerciseImage exercise={withImage} />);
      const image = screen.getByRole('image', { name: 'Imagen de Sentadilla con barra' });
      expect(JSON.stringify(image.props.source)).toContain(withImage.imageUrl);
    });

    it('does not show the placeholder', async () => {
      await render(<ExerciseImage exercise={withImage} />);
      expect(screen.queryByText('Piernas')).toBeNull();
    });

    it('falls back to the placeholder when the image fails to load', async () => {
      await render(<ExerciseImage exercise={withImage} />);
      fireEvent(
        screen.getByRole('image', { name: 'Imagen de Sentadilla con barra' }),
        'error',
        loadError(),
      );
      expect(await screen.findByText('Piernas')).toBeOnTheScreen();
      expect(
        screen.getByRole('image', { name: 'Sentadilla con barra, sin imagen (Piernas)' }),
      ).toBeOnTheScreen();
    });
  });

  describe('without imageUrl', () => {
    it('shows a placeholder with the muscle group', async () => {
      await render(<ExerciseImage exercise={withoutImage} />);
      expect(screen.getByText('Piernas')).toBeOnTheScreen();
    });

    it('describes the placeholder for screen readers', async () => {
      await render(<ExerciseImage exercise={withoutImage} />);
      expect(
        screen.getByRole('image', { name: 'Sentadilla con barra, sin imagen (Piernas)' }),
      ).toBeOnTheScreen();
    });

    it.each([
      ['chest', 'Pecho'],
      ['full_body', 'Cuerpo completo'],
    ] as const)('uses the label of %s', async (muscleGroup, label) => {
      await render(<ExerciseImage exercise={{ ...withoutImage, muscleGroup }} />);
      expect(screen.getByText(label)).toBeOnTheScreen();
    });

    it('can hide the group label in small sizes (icon only)', async () => {
      await render(<ExerciseImage exercise={withoutImage} size="small" />);
      expect(screen.queryByText('Piernas')).toBeNull();
      expect(
        screen.getByRole('image', { name: 'Sentadilla con barra, sin imagen (Piernas)' }),
      ).toBeOnTheScreen();
    });
  });

  it('accepts a custom accessibilityLabel', async () => {
    await render(<ExerciseImage exercise={withImage} accessibilityLabel="Demostración" />);
    expect(screen.getByRole('image', { name: 'Demostración' })).toBeOnTheScreen();
  });

  it('shows the placeholder again when the exercise changes to one without image', async () => {
    const { rerender } = await render(<ExerciseImage exercise={withImage} />);
    await rerender(<ExerciseImage exercise={withoutImage} />);
    expect(screen.getByText('Piernas')).toBeOnTheScreen();
  });

  it('retries loading when the imageUrl changes after an error', async () => {
    const { rerender } = await render(<ExerciseImage exercise={withImage} />);
    fireEvent(
      screen.getByRole('image', { name: 'Imagen de Sentadilla con barra' }),
      'error',
      loadError(),
    );
    await screen.findByText('Piernas');
    await rerender(
      <ExerciseImage exercise={{ ...withImage, imageUrl: 'https://wger.de/media/otra.png' }} />,
    );
    expect(screen.getByRole('image', { name: 'Imagen de Sentadilla con barra' })).toBeOnTheScreen();
  });
});
