import { focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

import { ApiError, type ApiErrorKind } from '../api/client';
import { MAX_RETRIES, createQueryClient, setupAppFocus, shouldRetry } from './queryClient';

const apiError = (kind: ApiErrorKind, status: number | null = null) =>
  new ApiError({ kind, url: 'http://api.test/x', status });

describe('shouldRetry', () => {
  it.each([
    ['network', apiError('network')],
    ['timeout', apiError('timeout')],
    ['http 500', apiError('http', 500)],
    ['http 503', apiError('http', 503)],
  ])('retries a %s error', (_label, error) => {
    expect(shouldRetry(0, error)).toBe(true);
  });

  it(`stops after ${MAX_RETRIES} retries`, () => {
    expect(MAX_RETRIES).toBe(2);
    expect(shouldRetry(MAX_RETRIES - 1, apiError('network'))).toBe(true);
    expect(shouldRetry(MAX_RETRIES, apiError('network'))).toBe(false);
  });

  it.each([
    ['http 400', apiError('http', 400)],
    ['http 404', apiError('http', 404)],
    ['http 409', apiError('http', 409)],
    ['invalid_response', apiError('invalid_response', 200)],
    ['aborted', apiError('aborted')],
    ['a non-API error', new Error('bug')],
  ])('does not retry %s (retrying cannot fix it)', (_label, error) => {
    expect(shouldRetry(0, error)).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('uses the retry policy for queries and never retries mutations', () => {
    const defaults = createQueryClient().getDefaultOptions();
    expect(defaults.queries?.retry).toBe(shouldRetry);
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('keeps data fresh for 30 seconds by default', () => {
    expect(createQueryClient().getDefaultOptions().queries?.staleTime).toBe(30_000);
  });

  it('creates a new client each time (no shared cache between users)', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe('setupAppFocus', () => {
  it('marks the app focused when it becomes active and unfocused otherwise', () => {
    let listener: ((state: AppStateStatus) => void) | undefined;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      listener = handler;
      return { remove };
    });
    const setFocused = jest.spyOn(focusManager, 'setFocused');

    const cleanup = setupAppFocus();
    listener?.('background');
    expect(setFocused).toHaveBeenLastCalledWith(false);
    listener?.('active');
    expect(setFocused).toHaveBeenLastCalledWith(true);

    cleanup();
    expect(remove).toHaveBeenCalled();
  });
});
