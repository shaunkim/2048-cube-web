const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { __dirname: 'readonly' } },
  },
  {
    files: ['**/__tests__/**', 'jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', it: 'readonly', expect: 'readonly', test: 'readonly' },
    },
  },
]);
