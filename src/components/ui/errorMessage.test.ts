import { ApiError } from '../../api/client';
import { getErrorMessage } from './errorMessage';

const apiError = (kind: ApiError['kind'], status: number | null = null) =>
  new ApiError({ kind, url: 'http://api.test/x', status });

describe('getErrorMessage', () => {
  it.each(['network', 'timeout'] as const)('asks to check the connection on %s errors', (kind) => {
    expect(getErrorMessage(apiError(kind))).toEqual({
      title: 'Sin conexión',
      message: 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
    });
  });

  it.each([500, 502, 503])('blames the server on HTTP %s', (status) => {
    expect(getErrorMessage(apiError('http', status))).toEqual({
      title: 'Algo salió mal',
      message: 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.',
    });
  });

  it('says it was not found on HTTP 404', () => {
    expect(getErrorMessage(apiError('http', 404))).toEqual({
      title: 'No encontrado',
      message: 'No encontramos lo que buscabas.',
    });
  });

  it.each([
    ['http', 400],
    ['invalid_response', null],
    ['aborted', null],
  ] as const)('uses the generic message for %s', (kind, status) => {
    expect(getErrorMessage(apiError(kind, status))).toEqual({
      title: 'Algo salió mal',
      message: 'No pudimos cargar la información. Intentá de nuevo.',
    });
  });

  it.each([new Error('boom'), 'texto', null, undefined])(
    'uses the generic message for non-API errors (%p)',
    (error) => {
      expect(getErrorMessage(error).title).toBe('Algo salió mal');
    },
  );
});
