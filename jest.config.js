module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/'],
  moduleNameMapper: {
    '^cheap/(.*)$': '<rootDir>/$1',
    '^@libmedia/common$': '<rootDir>/../common'
  },
  testMatch: ['<rootDir>/transformer/__test__/**/*.test.ts'],
  globalTeardown: '<rootDir>/transformer/__test__/clear.js'
};
