import { getApiUrl, resolveApiUrl } from './config';

describe('resolveApiUrl', () => {
  it('returns the URL when it is valid', () => {
    expect(resolveApiUrl('http://192.168.0.10:3000')).toBe('http://192.168.0.10:3000');
  });

  it('removes trailing slashes so paths can be appended safely', () => {
    expect(resolveApiUrl('https://api.example.com/')).toBe('https://api.example.com');
    expect(resolveApiUrl('https://api.example.com//')).toBe('https://api.example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(resolveApiUrl('  http://localhost:3000  ')).toBe('http://localhost:3000');
  });

  it('throws a helpful error when the variable is missing', () => {
    expect(() => resolveApiUrl(undefined)).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('throws when the variable is empty', () => {
    expect(() => resolveApiUrl('   ')).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('throws when the value is not a valid http(s) URL', () => {
    expect(() => resolveApiUrl('not a url')).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => resolveApiUrl('ftp://example.com')).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});

describe('getApiUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('reads EXPO_PUBLIC_API_URL, so changing the variable changes the URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.0.5:3000';
    expect(getApiUrl()).toBe('http://10.0.0.5:3000');

    process.env.EXPO_PUBLIC_API_URL = 'https://api.gym.com/';
    expect(getApiUrl()).toBe('https://api.gym.com');
  });
});
