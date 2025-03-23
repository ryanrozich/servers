export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\./.*|\.\./.*)\.js$': '$1',
  },
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
};
