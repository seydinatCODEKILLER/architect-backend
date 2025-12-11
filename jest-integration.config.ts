import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$', // tous les fichiers *.spec.ts
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest', // utiliser ts-jest pour transformer TS
  },
  collectCoverageFrom: [
    'src/**/*.(ts|js)',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: './coverage-integration',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1', // mapper les alias src/
  },
};

export default config;
