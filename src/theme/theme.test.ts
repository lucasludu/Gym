import { darkColors, lightColors } from './colors';
import { MIN_TOUCH_TARGET, createTheme, radii, shadows, spacing, typography } from './theme';

describe('createTheme', () => {
  it('uses the light palette for the light scheme', () => {
    const theme = createTheme('light');
    expect(theme.scheme).toBe('light');
    expect(theme.colors).toBe(lightColors);
    expect(theme.shadows).toBe(shadows.light);
  });

  it('uses the dark palette for the dark scheme', () => {
    const theme = createTheme('dark');
    expect(theme.scheme).toBe('dark');
    expect(theme.colors).toBe(darkColors);
    expect(theme.shadows).toBe(shadows.dark);
  });

  it('shares spacing, typography and radii between schemes', () => {
    const light = createTheme('light');
    const dark = createTheme('dark');
    expect(dark.spacing).toBe(light.spacing);
    expect(dark.typography).toBe(light.typography);
    expect(dark.radii).toBe(light.radii);
  });

  it('returns the same object for the same scheme (stable for memoized components)', () => {
    expect(createTheme('dark')).toBe(createTheme('dark'));
  });
});

describe('spacing', () => {
  it('grows strictly from the smallest to the largest step', () => {
    const values = Object.values(spacing);
    values.slice(1).forEach((value, i) => expect(value).toBeGreaterThan(values[i] ?? 0));
  });

  it('uses a 4 px grid', () => {
    Object.values(spacing).forEach((value) => expect(value % 4 === 0 || value === 2).toBe(true));
  });
});

describe('typography', () => {
  it.each(Object.entries(typography))(
    '%s is readable (≥ 12 px) with room between lines',
    (_name, style) => {
      expect(style.fontSize).toBeGreaterThanOrEqual(12);
      expect(style.lineHeight).toBeGreaterThan(style.fontSize);
    },
  );

  it('uses the system font (no custom fontFamily)', () => {
    Object.values(typography).forEach((style) => expect(style).not.toHaveProperty('fontFamily'));
  });

  it('has body text of at least 16 px', () => {
    expect(typography.body.fontSize).toBeGreaterThanOrEqual(16);
  });
});

describe('radii', () => {
  it('grows from small to large and has a pill radius', () => {
    expect(radii.sm).toBeLessThan(radii.md);
    expect(radii.md).toBeLessThan(radii.lg);
    expect(radii.pill).toBeGreaterThanOrEqual(999);
  });
});

describe('shadows', () => {
  it.each(['light', 'dark'] as const)('defines card and raised shadows for %s', (scheme) => {
    expect(shadows[scheme].card.boxShadow).toEqual(expect.any(String));
    expect(shadows[scheme].raised.boxShadow).toEqual(expect.any(String));
  });
});

describe('MIN_TOUCH_TARGET', () => {
  it('is 44 px, as required for every interactive element', () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });
});
