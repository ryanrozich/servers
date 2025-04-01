import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  testMatch: ['**/tests/integration/**/*.integration.ts'],
  testTimeout: 30000, // Longer timeout for API calls
  collectCoverage: true,
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov'],
};
