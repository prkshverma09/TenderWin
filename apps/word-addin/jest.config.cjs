/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.cjs'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['tsx', 'ts', 'js', 'jsx', 'json'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { module: 'CommonJS', jsx: 'react-jsx' } }] },
};
