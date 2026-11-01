import { classColorSchema } from '../domain/classType';
import { darkColors, lightColors, type ColorTokens } from './colors';
import { WCAG_AA_LARGE, WCAG_AA_TEXT, getContrastRatio } from './contrast';

const palettes = [
  ['light', lightColors],
  ['dark', darkColors],
] as const;

describe('palettes', () => {
  it('have exactly the same tokens in light and dark', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  it.each(palettes)('%s has a color for every ClassType accent token', (_scheme, colors) => {
    classColorSchema.options.forEach((token) => {
      expect(colors[token]).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  it.each(palettes)('%s uses uppercase #RRGGBB values only', (_scheme, colors) => {
    Object.values(colors).forEach((value) => expect(value).toMatch(/^#[0-9A-F]{6}$/));
  });

  it('has a different background in light and dark', () => {
    expect(lightColors.background).not.toBe(darkColors.background);
  });

  it('uses the brand colors chosen for the app (lime green)', () => {
    expect(lightColors.primary).toBe('#3F7D0A');
    expect(darkColors.primary).toBe('#A3E635');
  });
});

/** [foreground, background, minimum ratio] */
type Pair = readonly [keyof ColorTokens, keyof ColorTokens, number];

const TEXT_ON_SURFACES: Pair[] = (['background', 'surface', 'surfaceAlt'] as const).flatMap((bg) =>
  (
    [
      'text',
      'textMuted',
      'primary',
      'success',
      'warning',
      'danger',
      ...classColorSchema.options,
    ] as const
  ).map((fg) => [fg, bg, WCAG_AA_TEXT] as const),
);

const PAIRS: Pair[] = [
  ...TEXT_ON_SURFACES,
  ['onPrimary', 'primary', WCAG_AA_TEXT],
  ['onDanger', 'danger', WCAG_AA_TEXT],
  ['primary', 'primarySoft', WCAG_AA_TEXT],
  ['text', 'primarySoft', WCAG_AA_TEXT],
  ['border', 'background', 1.2],
  ['borderStrong', 'surface', WCAG_AA_LARGE],
];

describe.each(palettes)('contrast in %s mode (WCAG AA)', (_scheme, colors) => {
  it.each(PAIRS)('%s on %s ≥ %s:1', (fg, bg, min) => {
    expect(getContrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });
});
