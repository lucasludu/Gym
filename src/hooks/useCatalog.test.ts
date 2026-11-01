import { waitFor } from '@testing-library/react-native';

import { getClassTypes, getTrainers } from '../api/classes';
import { getExercises } from '../api/exercises';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useClassTypes } from './useClassTypes';
import { useExercises } from './useExercises';
import { useTrainers } from './useTrainers';

jest.mock('../api/classes');
jest.mock('../api/exercises');

const classType = {
  id: 'class-type-yoga',
  name: 'Yoga',
  description: '',
  durationMinutes: 60,
  intensity: 'low' as const,
  color: 'accentGreen' as const,
};
const trainer = { id: 'trainer-1', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };

beforeEach(() => jest.resetAllMocks());

describe('useClassTypes', () => {
  it('loads the class types', async () => {
    jest.mocked(getClassTypes).mockResolvedValue([classType]);
    const { result } = await renderQueryHook(() => useClassTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([classType]);
  });

  it('passes the abort signal to the API', async () => {
    jest.mocked(getClassTypes).mockResolvedValue([]);
    const { result } = await renderQueryHook(() => useClassTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(jest.mocked(getClassTypes).mock.calls[0]?.[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('exposes the error when the request fails', async () => {
    jest.mocked(getClassTypes).mockRejectedValue(new Error('boom'));
    const { result } = await renderQueryHook(() => useClassTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('boom');
  });
});

describe('useTrainers', () => {
  it('loads the trainers under their key', async () => {
    jest.mocked(getTrainers).mockResolvedValue([trainer]);
    const { result, client } = await renderQueryHook(() => useTrainers());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(queryKeys.trainers())).toEqual([trainer]);
  });
});

describe('useExercises', () => {
  it('loads the catalog and keeps it fresh (it rarely changes)', async () => {
    jest.mocked(getExercises).mockResolvedValue([]);
    const { result, client } = await renderQueryHook(() => useExercises());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(queryKeys.exercises())?.isInvalidated).toBe(false);
    expect(result.current.isStale).toBe(false);
  });
});
