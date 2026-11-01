import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows a title as header and a message', async () => {
    await render(
      <EmptyState title="No tenés reservas" message="Reservá una clase desde la agenda." />,
    );
    expect(screen.getByRole('header', { name: 'No tenés reservas' })).toBeOnTheScreen();
    expect(screen.getByText('Reservá una clase desde la agenda.')).toBeOnTheScreen();
  });

  it('works without a message', async () => {
    await render(<EmptyState title="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeOnTheScreen();
  });

  it('has no button when there is no action', async () => {
    await render(<EmptyState title="Sin resultados" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows an action that the user can press', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState title="No tenés reservas" action={{ label: 'Ver clases', onPress }} />,
    );
    await userEvent.setup().press(screen.getByRole('button', { name: 'Ver clases' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders an optional illustration', async () => {
    await render(<EmptyState title="Vacío" icon={<Text>🏋️</Text>} />);
    expect(screen.getByText('🏋️')).toBeOnTheScreen();
  });
});
