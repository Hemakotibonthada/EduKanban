module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 60,
      statements: 60
    }
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Transform files
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Timeout for tests (10 seconds)
  testTimeout: 10000,

  // Global setup/teardown
  globalSetup: '<rootDir>/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.js'
};
