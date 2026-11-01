import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET, lightColors } from '../../theme';
import { Button } from './Button';

describe('Button', () => {
  it('renders a button with its label as accessible name', async () => {
    await render(<Button label="Reservar" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Reservar" onPress={onPress} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Reservar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('accepts a more descriptive accessibilityLabel', async () => {
    await render(
      <Button label="Reservar" accessibilityLabel="Reservar Yoga del martes" onPress={jest.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Reservar Yoga del martes' })).toBeOnTheScreen();
  });

  it('does not call onPress when disabled and says so to screen readers', async () => {
    const onPress = jest.fn();
    await render(<Button label="Reservar" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Reservar' });
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  describe('loading', () => {
    it('shows a spinner, keeps the label for screen readers and marks itself busy', async () => {
      await render(<Button label="Reservar" loading onPress={jest.fn()} />);
      const button = screen.getByRole('button', { name: 'Reservar' });
      expect(button).toBeBusy();
      expect(screen.getByTestId('button-spinner')).toBeOnTheScreen();
    });

    it('does not call onPress while loading (no double submit)', async () => {
      const onPress = jest.fn();
      await render(<Button label="Reservar" loading onPress={onPress} />);
      await userEvent.setup().press(screen.getByRole('button', { name: 'Reservar' }));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  it('has a touch area of at least 44 px', async () => {
    await render(<Button label="Ok" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Ok' })).toHaveStyle({
      minHeight: MIN_TOUCH_TARGET,
      minWidth: MIN_TOUCH_TARGET,
    });
  });

  it.each([
    ['primary', lightColors.primary, lightColors.onPrimary],
    ['danger', lightColors.danger, lightColors.onDanger],
    ['secondary', lightColors.surface, lightColors.text],
    ['ghost', 'transparent', lightColors.primary],
  ] as const)('uses the %s variant colors', async (variant, background, text) => {
    await render(<Button label="Acción" variant={variant} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Acción' })).toHaveStyle({
      backgroundColor: background,
    });
    expect(screen.getByText('Acción')).toHaveStyle({ color: text });
  });

  it('is primary by default', async () => {
    await render(<Button label="Acción" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Acción' })).toHaveStyle({
      backgroundColor: lightColors.primary,
    });
  });

  it('passes an accessibility hint', async () => {
    await render(
      <Button
        label="Cancelar"
        accessibilityHint="Libera tu lugar en la clase"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Cancelar' }).props.accessibilityHint).toBe(
      'Libera tu lugar en la clase',
    );
  });
});
