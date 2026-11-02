import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen, within } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';

import { mockApi } from '../../src/api/testing';
import { sessionStore } from '../../src/store/appSession';
import { fakeNow } from '../../src/testing/clock';
import { SOFIA } from '../../src/testing/fixtures';
import { routeHomeApi } from '../../src/testing/homeApi';

// Tuesday 2026-11-03, 10:00 in Buenos Aires.
const NOW = '2026-11-03T10:00:00-03:00';

let api: ReturnType<typeof mockApi>;

beforeAll(() => {
  jest.mocked(SecureStore.getItemAsync).mockReturnValue(new Promise(() => undefined));
});
beforeEach(() => {
  fakeNow(NOW);
  api = mockApi();
  routeHomeApi(api);
  sessionStore.setState({ status: 'signedIn', userId: SOFIA.id });
});
afterEach(() => {
  api.restore();
  jest.useRealTimers();
});

const openClasses = () => renderRouter('./app', { initialUrl: '/classes' });
const day = (label: string) => screen.getByRole('button', { name: label });

describe('Clases · week and day selector (T5.10)', () => {
  it('opens on this week with today selected (criterion 1)', async () => {
    await openClasses();
    expect(await screen.findByRole('header', { name: 'Esta semana' })).toBeOnTheScreen();
    expect(screen.getByText('2 al 8 de noviembre')).toBeOnTheScreen();
    expect(day('Martes 3 de noviembre, hoy')).toBeSelected();
    expect(day('Lunes 2 de noviembre')).not.toBeSelected();
    expect(within(day('Martes 3 de noviembre, hoy')).getByText('Hoy')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeDisabled();
  });

  it('shows the seven days with short name and number', async () => {
    await openClasses();
    await screen.findByText('2 al 8 de noviembre');
    for (const text of ['Lun', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
    expect(screen.getByText('8')).toBeOnTheScreen();
  });

  it('goes to next week with its Monday selected (criterion 2)', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Semana siguiente' }));
    expect(screen.getByRole('header', { name: 'Semana que viene' })).toBeOnTheScreen();
    expect(screen.getByText('9 al 15 de noviembre')).toBeOnTheScreen();
    expect(day('Lunes 9 de noviembre')).toBeSelected();
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toBeEnabled();
  });

  it('comes back to this week with today selected (criterion 3)', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Semana siguiente' }));
    await user.press(day('Jueves 12 de noviembre'));
    await user.press(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(screen.getByRole('header', { name: 'Esta semana' })).toBeOnTheScreen();
    expect(day('Martes 3 de noviembre, hoy')).toBeSelected();
  });

  it('selects another day, including a past one', async () => {
    await openClasses();
    const user = userEvent.setup();
    await user.press(await screen.findByRole('button', { name: 'Lunes 2 de noviembre' }));
    expect(day('Lunes 2 de noviembre')).toBeSelected();
    expect(day('Martes 3 de noviembre, hoy')).not.toBeSelected();
  });
});
