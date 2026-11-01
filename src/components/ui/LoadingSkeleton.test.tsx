import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';

import { LoadingSkeleton } from './LoadingSkeleton';

const HIDDEN = { includeHiddenElements: true };

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(() => jest.restoreAllMocks());

describe('LoadingSkeleton', () => {
  it('tells screen readers that content is loading', async () => {
    await render(<LoadingSkeleton />);
    const skeleton = screen.getByLabelText('Cargando');
    expect(skeleton).toBeBusy();
    expect(skeleton.props.accessibilityRole).toBe('progressbar');
  });

  it('accepts a more specific label', async () => {
    await render(<LoadingSkeleton accessibilityLabel="Cargando clases" />);
    expect(screen.getByLabelText('Cargando clases')).toBeOnTheScreen();
  });

  it('renders 3 placeholder rows by default', async () => {
    await render(<LoadingSkeleton />);
    expect(screen.getAllByTestId('skeleton-row', HIDDEN)).toHaveLength(3);
  });

  it('renders the requested number of rows', async () => {
    await render(<LoadingSkeleton rows={5} />);
    expect(screen.getAllByTestId('skeleton-row', HIDDEN)).toHaveLength(5);
  });

  it('hides the placeholder rows from screen readers', async () => {
    await render(<LoadingSkeleton />);
    expect(screen.queryAllByTestId('skeleton-row', { includeHiddenElements: false })).toHaveLength(
      0,
    );
  });

  // The pulse runs on the native driver, so its opacity is not observable in Jest:
  // these tests check whether the animation is started instead.
  describe('animation', () => {
    const spyOnPulse = () => {
      const start = jest.fn();
      jest.spyOn(Animated, 'loop').mockReturnValue({ start, stop: jest.fn(), reset: jest.fn() });
      return start;
    };

    const renderAndSettle = async () => {
      await render(<LoadingSkeleton rows={1} />);
      await act(async () => {});
    };

    it('pulses when motion is allowed', async () => {
      const start = spyOnPulse();
      await renderAndSettle();
      expect(start).toHaveBeenCalled();
    });

    it('never pulses when the user prefers reduced motion (not even for a moment)', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const start = spyOnPulse();
      await renderAndSettle();
      expect(start).not.toHaveBeenCalled();
      screen
        .getAllByTestId('skeleton-row', HIDDEN)
        .forEach((row) => expect(StyleSheet.flatten(row.props.style).opacity).toBe(1));
    });
  });

  it.each([0, -1, 1.5])('throws on an invalid rows value (%p)', async (rows) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<LoadingSkeleton rows={rows} />)).rejects.toThrow();
  });
});
