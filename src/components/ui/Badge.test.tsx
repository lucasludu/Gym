import { render, screen } from '@testing-library/react-native';

import { lightColors } from '../../theme';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its label', async () => {
    await render(<Badge label="Lleno" />);
    expect(screen.getByText('Lleno')).toBeOnTheScreen();
  });

  it('is neutral by default', async () => {
    await render(<Badge label="Info" />);
    expect(screen.getByText('Info')).toHaveStyle({ color: lightColors.textMuted });
  });

  it.each([
    ['success', lightColors.success],
    ['warning', lightColors.warning],
    ['danger', lightColors.danger],
    ['primary', lightColors.primary],
    ['accentOrange', lightColors.accentOrange],
    ['accentTeal', lightColors.accentTeal],
  ] as const)('uses the %s tone color for the text', async (tone, color) => {
    await render(<Badge label="Estado" tone={tone} />);
    expect(screen.getByText('Estado')).toHaveStyle({ color });
  });

  it('uses the soft primary background for the primary tone', async () => {
    await render(<Badge label="Reservada" tone="primary" testID="badge" />);
    expect(screen.getByTestId('badge')).toHaveStyle({ backgroundColor: lightColors.primarySoft });
  });

  it('is not interactive', async () => {
    await render(<Badge label="Lleno" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
