/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // With a cold transform cache, the first render of a file can take over the default 5 s.
  testTimeout: 15_000,
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
};
