export default {
  transform: {
    '\\.ts$': '<rootDir>/node_modules/babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
};
