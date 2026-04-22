module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  globals: {
    AudioManager: 'readonly'
  },
  rules: {
    'no-var': 'error',
    'prefer-const': 'error',
    'semi': ['error', 'always'],
    'eqeqeq': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'max-len': ['error', { code: 100 }]
  },
  overrides: [
    {
      files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
      env: {
        jest: true
      }
    }
  ]
};