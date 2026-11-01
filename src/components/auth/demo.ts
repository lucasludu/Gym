/** Demo member of the seed (user-1), who has every test case. */
export const DEMO_EMAIL = 'sofia.martinez@example.com';
/** Any valid password works in the mock. */
export const DEMO_PASSWORD = 'demo1234';

/** The demo button is shown only when EXPO_PUBLIC_DEMO_LOGIN is "true". */
export const isDemoLoginEnabled = (): boolean => process.env.EXPO_PUBLIC_DEMO_LOGIN === 'true';
