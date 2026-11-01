import { waitFor } from '@testing-library/react-native';

import { getClassSessions } from '../api/classes';
import { queryKeys } from './queryKeys';
import { renderQueryHook } from './testing';
import { useClassSessions } from './useClassSessions';

jest.mock('../api/classes');

const session = {
  id: 'class-1',
  classTypeId: 'class-type-yoga',
  trainerId: 'trainer-1',
  startsAt: '2026-11-04T18:00:00-03:00',
  capacity: 12,
  bookedCount: 5,
};
const range = { from: '2026-11-04', to: '2026-11-10' };

beforeEach(() => jest.resetAllMocks());

describe('useClassSessions', () => {
  it('loads the sessions of the range', async () => {
    jest.mocked(getClassSessions).mockResolvedValue([session]);
    const { result, client } = await renderQueryHook(() => useClassSessions(range));
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([session]);
    expect(jest.mocked(getClassSessions).mock.calls[0]?.[0]).toEqual(range);
    expect(client.getQueryData(queryKeys.classSessions(range))).toEqual([session]);
  });

  it('returns an empty list when there are no classes', async () => {
    jest.mocked(getClassSessions).mockResolvedValue([]);
    const { result } = await renderQueryHook(() => useClassSessions(range));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('exposes the error when the request fails', async () => {
    jest.mocked(getClassSessions).mockRejectedValue(new Error('offline'));
    const { result } = await renderQueryHook(() => useClassSessions(range));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
