module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // General code quality
    'no-console': 'off', // Allow console in backend
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-return-await': 'error',
    'require-await': 'warn',
    'no-throw-literal': 'error',
    
    // Async/Await
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Security
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    
    // Style (handled by prettier, but good defaults)
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'only-multiline'],
    
    // Import/Export
    'no-duplicate-imports': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        mocha: true,
      },
    },
  ],
};
