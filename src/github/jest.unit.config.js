import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  testMatch: ['**/tests/unit/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov'],
};
