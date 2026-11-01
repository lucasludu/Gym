import { render, screen } from '@testing-library/react-native';

import { lightColors, typography } from '../../theme';
import { Text } from './Text';

describe('Text', () => {
  it('renders its content', async () => {
    await render(<Text>Hola</Text>);
    expect(screen.getByText('Hola')).toBeOnTheScreen();
  });

  it('uses the body style and the text color by default', async () => {
    await render(<Text>Hola</Text>);
    expect(screen.getByText('Hola')).toHaveStyle({
      fontSize: typography.body.fontSize,
      color: lightColors.text,
    });
  });

  it('applies the typography variant', async () => {
    await render(<Text variant="caption">Chico</Text>);
    expect(screen.getByText('Chico')).toHaveStyle({ fontSize: typography.caption.fontSize });
  });

  it('applies a color token', async () => {
    await render(<Text color="textMuted">Gris</Text>);
    expect(screen.getByText('Gris')).toHaveStyle({ color: lightColors.textMuted });
  });

  it.each(['display', 'title'] as const)('marks the %s variant as a header', async (variant) => {
    await render(<Text variant={variant}>Clases</Text>);
    expect(screen.getByRole('header', { name: 'Clases' })).toBeOnTheScreen();
  });

  it('does not mark body text as a header', async () => {
    await render(<Text>Texto</Text>);
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('respects the system font size (font scaling stays on)', async () => {
    await render(<Text>Escala</Text>);
    expect(screen.getByText('Escala').props.allowFontScaling).not.toBe(false);
  });
});
