import { isApiError } from '../../api/client';

export interface ErrorMessage {
  title: string;
  message: string;
}

const OFFLINE: ErrorMessage = {
  title: 'Sin conexión',
  message: 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.',
};

const SERVER: ErrorMessage = {
  title: 'Algo salió mal',
  message: 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.',
};

const NOT_FOUND: ErrorMessage = {
  title: 'No encontrado',
  message: 'No encontramos lo que buscabas.',
};

const GENERIC: ErrorMessage = {
  title: 'Algo salió mal',
  message: 'No pudimos cargar la información. Intentá de nuevo.',
};

/** A user-facing message for any error. Never exposes technical details (URLs, codes). */
export function getErrorMessage(error: unknown): ErrorMessage {
  if (!isApiError(error)) return GENERIC;
  switch (error.kind) {
    case 'network':
    case 'timeout':
      return OFFLINE;
    case 'http':
      if (error.status === 404) return NOT_FOUND;
      if (error.status !== null && error.status >= 500) return SERVER;
      return GENERIC;
    case 'aborted':
    case 'invalid_response':
      return GENERIC;
  }
}
