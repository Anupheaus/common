'use strict';

const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
// eslint-plugin-mocha v11 is ESM — CJS require() returns the module wrapper.
const mochaPlugin = require('eslint-plugin-mocha').default;
const globals = require('globals');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Disable ESLint core rules that TypeScript handles better (single object).
  tsPlugin.configs['flat/eslint-recommended'],
  // TypeScript recommended — sets up parser, plugin, and recommended rules (array).
  ...tsPlugin.configs['flat/recommended'],

  // Globals and custom rules for all TypeScript source files.
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
        ...globals.commonjs,
      },
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2, { SwitchCase: 1 }],
      'max-len': ['warn', { code: 210 }],
      'arrow-parens': ['error', 'as-needed'],
      'prefer-const': ['error', { destructuring: 'all' }],
      'max-classes-per-file': 'error',
      'no-console': 'warn',
      'no-alert': 'warn',
      'no-unused-labels': 'error',
      'sort-imports': 'off',
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      'no-unused-expressions': 'off',
      'no-inner-declarations': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-namespace': 'off',
      // no-var-requires was renamed to no-require-imports in @typescript-eslint v6+
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-shadow': 'warn',
      // v8 replacements for the removed ban-types rule
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      // v8 replacement for the removed no-empty-interface rule
      '@typescript-eslint/no-empty-object-type': 'off',
      // chai's property-based assertions (e.g. .to.be.true) are unused expressions
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: [
            'constructor',
            'private-static-field',
            'protected-static-field',
            'public-static-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'private-instance-field',
            'protected-instance-field',
            'public-instance-field',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
    },
  },

  // Mocha globals and no-exclusive-tests for test files.
  {
    files: ['**/*.tests.ts', '**/*.tests.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { mocha: mochaPlugin },
    languageOptions: {
      globals: globals.mocha,
    },
    rules: {
      'mocha/no-exclusive-tests': 'error',
    },
  },

  // Config files use require() — suppress the import rule for them.
  {
    files: ['*.config.js', '*.config.ts', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
