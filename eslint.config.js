import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'eqeqeq': 'error',
      'comma-dangle': ['error', 'never'],
      'consistent-return': 'error',
      'no-unused-vars': 'warn',
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-console': 'warn'
    }
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'webpack.*.js']
  }
];
