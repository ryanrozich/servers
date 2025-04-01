export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(.+).js$': '$1',
  },
  transform: {
    '^.+.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!universal-user-agent)/',
  ],
  testTimeout: 10000,
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ['**/*.test.ts'],
  resolver: 'jest-ts-webcompat-resolver',
  setupFiles: ['<rootDir>/jest.setup.js'],
};
