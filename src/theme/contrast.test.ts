import { WCAG_AA_LARGE, WCAG_AA_TEXT, getContrastRatio } from './contrast';

describe('getContrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('is 1 for the same color', () => {
    expect(getContrastRatio('#3F7D0A', '#3F7D0A')).toBeCloseTo(1, 5);
  });

  it('does not depend on the order', () => {
    expect(getContrastRatio('#FFFFFF', '#1D4ED8')).toBeCloseTo(
      getContrastRatio('#1D4ED8', '#FFFFFF'),
      10,
    );
  });

  it('matches known WCAG values', () => {
    // #767676 on white is the classic "just passes AA" gray (4.54:1).
    expect(getContrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    // #777777 on white just fails (4.48:1).
    expect(getContrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('accepts lowercase hex', () => {
    expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it.each(['#FFF', 'FFFFFF', '#GGGGGG', 'red', '#FFFFFF80'])('throws on %p', (color) => {
    expect(() => getContrastRatio(color, '#000000')).toThrow();
  });

  it('exposes the WCAG AA thresholds', () => {
    expect(WCAG_AA_TEXT).toBe(4.5);
    expect(WCAG_AA_LARGE).toBe(3);
  });
});
