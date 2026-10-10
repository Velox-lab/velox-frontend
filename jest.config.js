/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  // @stellar/stellar-sdk depends on ESM-only packages. Node loads them natively,
  // but Jest's module system needs them transpiled to CommonJS.
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': ['ts-jest', { tsconfig: { allowJs: true }, isolatedModules: true }],
  },
  transformIgnorePatterns: ['node_modules/(?!(uint8array-extras|@exodus/bytes|@noble)/)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.{ts,tsx}', '!src/setupTests.ts'],
  coverageThreshold: {
    global: {
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
