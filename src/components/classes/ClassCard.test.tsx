import { render, screen, userEvent } from '@testing-library/react-native';

import type { ClassSession } from '../../domain/classSession';
import type { ClassType } from '../../domain/classType';
import type { Trainer } from '../../domain/trainer';
import { ClassCard } from './ClassCard';

const NOW = new Date('2026-11-03T10:00:00-03:00');

const spinning: ClassType = {
  id: 'ct-spinning',
  name: 'Spinning',
  description: 'Bici indoor.',
  durationMinutes: 45,
  intensity: 'high',
  color: 'accentOrange',
};
const camila: Trainer = { id: 't1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };
const session: ClassSession = {
  id: 's1',
  classTypeId: spinning.id,
  trainerId: camila.id,
  startsAt: '2026-11-03T19:00:00-03:00',
  capacity: 12,
  bookedCount: 8,
};

const renderCard = async (patch: Partial<Parameters<typeof ClassCard>[0]> = {}) => {
  const onPress = jest.fn();
  await render(
    <ClassCard
      session={session}
      classType={spinning}
      trainer={camila}
      booked={false}
      now={NOW}
      onPress={onPress}
      {...patch}
    />,
  );
  return { onPress };
};

describe('ClassCard', () => {
  it('shows time range, class, trainer, intensity and spots', async () => {
    await renderCard();
    expect(screen.getByText('19:00 – 19:45')).toBeOnTheScreen();
    expect(screen.getByText('Spinning')).toBeOnTheScreen();
    expect(screen.getByText('con Camila Rodríguez')).toBeOnTheScreen();
    expect(screen.getByText('Intensidad alta')).toBeOnTheScreen();
    expect(screen.getByText('4 lugares')).toBeOnTheScreen();
  });

  it('is one button with the whole information', async () => {
    await renderCard();
    expect(
      screen.getByRole('button', {
        name: 'Spinning, 19:00 a 19:45, con Camila Rodríguez, 4 lugares',
      }),
    ).toBeOnTheScreen();
  });

  it('opens the detail when tapped (criterion 12)', async () => {
    const { onPress } = await renderCard();
    await userEvent.setup().press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('says "Reservada" when booked (criterion 10)', async () => {
    await renderCard({ booked: true, session: { ...session, bookedCount: 12 } });
    expect(screen.getByText('Reservada')).toBeOnTheScreen();
    expect(screen.queryByText('Llena')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName(/, reservada$/);
  });

  it('says "Llena" without spots (criterion 9)', async () => {
    await renderCard({ session: { ...session, bookedCount: 12 } });
    expect(screen.getByText('Llena')).toBeOnTheScreen();
  });

  it('says "Empezada" and is dimmed once started (criterion 11)', async () => {
    await renderCard({ now: new Date('2026-11-03T19:10:00-03:00') });
    expect(screen.getByText('Empezada')).toBeOnTheScreen();
    expect(screen.getByRole('button')).toHaveStyle({ opacity: 0.6 });
  });

  it.each([
    ['low', 'Intensidad baja'],
    ['medium', 'Intensidad media'],
  ] as const)('names the %s intensity', async (intensity, text) => {
    await renderCard({ classType: { ...spinning, intensity } });
    expect(screen.getByText(text)).toBeOnTheScreen();
  });
});
