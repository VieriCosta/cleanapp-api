// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/src/lib/$1',
    '^middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^routes/(.*)$': '<rootDir>/src/routes/$1',
    '^modules/(.*)$': '<rootDir>/src/modules/$1',
    '^db/(.*)$': '<rootDir>/src/db/$1',
    '^docs/(.*)$': '<rootDir>/src/docs/$1',
    '^payments/(.*)$': '<rootDir>/src/payments/$1',
  },
  setupFiles: ['dotenv/config'],
  verbose: true,
  modulePathIgnorePatterns: [
    '<rootDir>/cleanapp-api/',
    '<rootDir>/src/generated/', 
  ],
};
export default config;
