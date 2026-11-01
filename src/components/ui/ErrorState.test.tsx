import { render, screen, userEvent } from '@testing-library/react-native';

import { ApiError } from '../../api/client';
import { ErrorState } from './ErrorState';

const networkError = new ApiError({ kind: 'network', url: 'http://api.test/x', status: null });

describe('ErrorState', () => {
  it('explains the error in a user-friendly way', async () => {
    await render(<ErrorState error={networkError} onRetry={jest.fn()} />);
    expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeOnTheScreen();
    expect(
      screen.getByText('No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.'),
    ).toBeOnTheScreen();
  });

  it('never shows technical details', async () => {
    await render(<ErrorState error={networkError} onRetry={jest.fn()} />);
    expect(screen.queryByText(/api\.test|network/i)).toBeNull();
  });

  it('accepts a custom title and message', async () => {
    await render(
      <ErrorState
        error={networkError}
        title="No pudimos cargar las clases"
        message="Probá de nuevo."
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText('No pudimos cargar las clases')).toBeOnTheScreen();
    expect(screen.getByText('Probá de nuevo.')).toBeOnTheScreen();
  });

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState error={networkError} onRetry={onRetry} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the retry button as busy while retrying', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState error={networkError} onRetry={onRetry} retrying />);
    const button = screen.getByRole('button', { name: 'Reintentar' });
    expect(button).toBeBusy();
    await userEvent.setup().press(button);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('is announced to screen readers', async () => {
    await render(<ErrorState error={networkError} onRetry={jest.fn()} testID="error" />);
    expect(screen.getByTestId('error').props.accessibilityLiveRegion).toBe('polite');
  });
});
