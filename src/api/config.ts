const ENV_VAR = 'EXPO_PUBLIC_API_URL';

/**
 * Validates and normalizes the API base URL (no trailing slash).
 * Throws a descriptive error when the value is missing or invalid.
 */
export function resolveApiUrl(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${ENV_VAR} is not set. Copy .env.example to .env and set the API URL.`);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${ENV_VAR} is not a valid URL: "${trimmed}".`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${ENV_VAR} must use http or https: "${trimmed}".`);
  }

  return trimmed.replace(/\/+$/, '');
}

/**
 * Returns the API base URL from the environment.
 * `process.env.EXPO_PUBLIC_API_URL` must be written literally so Expo can inline it at build time.
 */
export function getApiUrl(): string {
  return resolveApiUrl(process.env.EXPO_PUBLIC_API_URL);
}
