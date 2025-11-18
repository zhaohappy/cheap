export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [1343]
        },
        astTransformers: {
          before: [
            {
              path: 'node_modules/ts-jest-mock-import-meta',
              options: { metaObjectReplacement: { url: './' } }
            }
          ]
        }
      }
    ]
  },
  moduleNameMapper: {
    '^cheap/(.*)$': '<rootDir>/src/$1',
    '^@libmedia/common$': '<rootDir>/../common/src'
  },
  testMatch: ['<rootDir>/src/transformer/__test__/**/*.test.ts'],
  globalTeardown: '<rootDir>/src/transformer/__test__/clear.js'
}
