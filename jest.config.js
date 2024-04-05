module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/'],
  moduleNameMapper: {
    '^cheap/(.*)$': '<rootDir>/$1',
    '^common/(.*)$': '<rootDir>/../common/$1'
  },
  testMatch: ['<rootDir>/transformer/__test__/**/*.test.ts'],
  globalTeardown: '<rootDir>/transformer/__test__/clear.js'
};
