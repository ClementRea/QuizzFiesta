const js = require('@eslint/js')
const pluginImport = require('eslint-plugin-import')
const pluginN = require('eslint-plugin-n')
const pluginPromise = require('eslint-plugin-promise')
const pluginSecurity = require('eslint-plugin-security')
const prettier = require('eslint-config-prettier')

module.exports = [
  {
    ignores: ['node_modules', 'coverage', 'public', 'package-lock.json']
  },
  js.configs.recommended,
  {
    plugins: {
      import: pluginImport,
      n: pluginN,
      promise: pluginPromise,
      security: pluginSecurity
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error'] }],
      'import/order': ['warn', { 'newlines-between': 'always' }],
      'promise/always-return': 'off',
      'promise/catch-or-return': 'warn',
  'security/detect-object-injection': 'off',
  'no-case-declarations': 'off'
    }
  },
  {
    files: ['tests/**/*.test.js', 'tests/**/setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly'
      }
    },
    rules: {
      'import/order': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  },
  prettier
]
