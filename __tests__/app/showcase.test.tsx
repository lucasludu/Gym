import { render, screen, userEvent } from '@testing-library/react-native';

import ShowcaseScreen from '../../app/showcase';

// Temporary design-system showcase, reachable from Perfil while in development.
describe('showcase screen', () => {
  it('shows every section of the design system', async () => {
    await render(<ShowcaseScreen />);
    for (const title of [
      'Componentes',
      'Texto',
      'Botones',
      'Badges',
      'Tarjetas',
      'Campos',
      'Imagen de ejercicio',
      'Estados',
    ]) {
      expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    }
  });

  it('shows the 6 class accents', async () => {
    await render(<ShowcaseScreen />);
    for (const name of ['Funcional', 'Spinning', 'Yoga', 'Pilates', 'Zumba', 'HIIT']) {
      expect(screen.getByText(name)).toBeOnTheScreen();
    }
  });

  it('puts a button in loading when pressed', async () => {
    await render(<ShowcaseScreen />);
    const button = screen.getByRole('button', { name: 'Probar loading' });
    await userEvent.setup().press(button);
    expect(button).toBeBusy();
  });

  it('validates the sample email field', async () => {
    await render(<ShowcaseScreen />);
    await userEvent.setup().type(screen.getByLabelText('Email'), 'no-es-email');
    expect(screen.getByText('Ingresá un email válido')).toBeOnTheScreen();
  });

  it('shows an exercise with image and one with the placeholder', async () => {
    await render(<ShowcaseScreen />);
    expect(
      screen.getByRole('image', { name: 'Imagen de Aducción de Cadera en Máquina' }),
    ).toBeOnTheScreen();
    // Medium and small placeholders.
    expect(
      screen.getAllByRole('image', { name: 'Caminata del Oso, sin imagen (Pecho)' }),
    ).toHaveLength(2);
    expect(screen.getByText('Imagen: Comunidad de wger · CC-BY-SA 4')).toBeOnTheScreen();
  });
});
