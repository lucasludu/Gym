import { act, renderHook } from '@testing-library/react-native';

import { useNow } from './useNow';

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-03T13:00:30Z') });
});
afterEach(() => jest.useRealTimers());

describe('useNow', () => {
  it('returns the current time', async () => {
    const { result } = await renderHook(() => useNow());
    expect(result.current.toISOString()).toBe('2026-11-03T13:00:30.000Z');
  });

  it('updates every minute', async () => {
    const { result } = await renderHook(() => useNow());
    await act(() => jest.advanceTimersByTime(60_000));
    expect(result.current.toISOString()).toBe('2026-11-03T13:01:30.000Z');
  });

  it('accepts another interval', async () => {
    const { result } = await renderHook(() => useNow(1_000));
    await act(() => jest.advanceTimersByTime(1_000));
    expect(result.current.toISOString()).toBe('2026-11-03T13:00:31.000Z');
  });

  it('stops updating after unmount', async () => {
    const setInterval = jest.spyOn(globalThis, 'setInterval');
    const clearInterval = jest.spyOn(globalThis, 'clearInterval');
    const { unmount } = await renderHook(() => useNow());
    const id = setInterval.mock.results[0]?.value;
    await unmount();
    expect(clearInterval).toHaveBeenCalledWith(id);
  });
});
