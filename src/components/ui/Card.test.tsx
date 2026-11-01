import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET, lightColors } from '../../theme';
import { Card } from './Card';
import { Text } from './Text';

describe('Card', () => {
  it('renders its content on a surface', async () => {
    await render(
      <Card testID="card">
        <Text>Contenido</Text>
      </Card>,
    );
    expect(screen.getByText('Contenido')).toBeOnTheScreen();
    expect(screen.getByTestId('card')).toHaveStyle({ backgroundColor: lightColors.surface });
  });

  it('is not a button when it has no onPress', async () => {
    await render(
      <Card>
        <Text>Info</Text>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  describe('pressable', () => {
    it('is a button named by its accessibilityLabel', async () => {
      await render(
        <Card onPress={jest.fn()} accessibilityLabel="Yoga, martes 18:00">
          <Text>Yoga</Text>
        </Card>,
      );
      expect(screen.getByRole('button', { name: 'Yoga, martes 18:00' })).toBeOnTheScreen();
    });

    it('calls onPress when pressed', async () => {
      const onPress = jest.fn();
      await render(
        <Card onPress={onPress} accessibilityLabel="Ver clase">
          <Text>Yoga</Text>
        </Card>,
      );
      await userEvent.setup().press(screen.getByRole('button', { name: 'Ver clase' }));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('has a touch area of at least 44 px', async () => {
      await render(
        <Card onPress={jest.fn()} accessibilityLabel="Ver clase">
          <Text>Yoga</Text>
        </Card>,
      );
      expect(screen.getByRole('button', { name: 'Ver clase' })).toHaveStyle({
        minHeight: MIN_TOUCH_TARGET,
      });
    });
  });
});
