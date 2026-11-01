import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { MIN_TOUCH_TARGET } from '../../theme';
import { IconButton } from './IconButton';

const icon = <Text>×</Text>;

describe('IconButton', () => {
  it('is a button named by its accessibilityLabel (icons have no text)', async () => {
    await render(<IconButton icon={icon} accessibilityLabel="Cerrar" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeOnTheScreen();
  });

  it('renders the icon', async () => {
    await render(<IconButton icon={icon} accessibilityLabel="Cerrar" onPress={jest.fn()} />);
    expect(screen.getByText('×')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon={icon} accessibilityLabel="Cerrar" onPress={onPress} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon={icon} accessibilityLabel="Cerrar" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Cerrar' });
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('has a touch area of at least 44 × 44 px', async () => {
    await render(<IconButton icon={icon} accessibilityLabel="Cerrar" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveStyle({
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
    });
  });
});
