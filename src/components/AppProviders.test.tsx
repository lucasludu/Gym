import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import { AppProviders } from './AppProviders';

function UsesQueryClient() {
  const client = useQueryClient();
  return <Text>{client.getDefaultOptions().queries?.staleTime === 30_000 ? 'ok' : 'wrong'}</Text>;
}

describe('AppProviders', () => {
  it('renders its children', async () => {
    await render(
      <AppProviders>
        <Text>Contenido</Text>
      </AppProviders>,
    );
    expect(screen.getByText('Contenido')).toBeOnTheScreen();
  });

  it('provides the app query client to the tree', async () => {
    await render(
      <AppProviders>
        <UsesQueryClient />
      </AppProviders>,
    );
    expect(screen.getByText('ok')).toBeOnTheScreen();
  });

  it('listens to the app state and stops when unmounted', async () => {
    const remove = jest.fn();
    const addListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove } as ReturnType<typeof AppState.addEventListener>);

    const { unmount } = await render(
      <AppProviders>
        <Text>x</Text>
      </AppProviders>,
    );
    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function));

    await unmount();
    expect(remove).toHaveBeenCalled();
    addListener.mockRestore();
  });
});
