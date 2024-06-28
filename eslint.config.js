import cspell from '@cspell/eslint-plugin';
import eslint from '@eslint/js';
// @ts-ignore - no types available
import cypress from 'eslint-plugin-cypress';
import jsdoc from 'eslint-plugin-jsdoc';
// @ts-ignore - no types available
import json from 'eslint-plugin-json';
// @ts-ignore - no types available
import lodash from 'eslint-plugin-lodash';
// @ts-ignore - no types available
import noOnlyTests from 'eslint-plugin-no-only-tests';
import tsdoc from 'eslint-plugin-tsdoc';
// @ts-ignore - no types available
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/dist/', '**/node_modules/', '.git/', '**/generated/', '**/coverage/'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './packages/*/tsconfig.json',
          './packages/*/tsconfig.eslint.json',
          './packages/mermaid/src/docs/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
        ...globals.jest,
        cy: 'readonly',
      },
    },
  },
  {
    plugins: {
      json,
      '@cspell': cspell,
      'no-only-tests': noOnlyTests,
      lodash,
      unicorn,
      cypress,
      tsdoc,
      jsdoc,
    },
    rules: {
      curly: 'error',
      'no-console': 'error',
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'off',
      'cypress/no-async-tests': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
          'ts-check': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
      ],
      'json/*': ['error', 'allowComments'],
      '@cspell/spellchecker': [
        'error',
        {
          checkIdentifiers: true,
          checkStrings: true,
          checkStringTemplates: true,
        },
      ],
      'no-empty': [
        'error',
        {
          allowEmptyCatch: true,
        },
      ],
      'no-only-tests/no-only-tests': 'error',
      'lodash/import-scope': ['error', 'method'],
      'unicorn/better-regex': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-unsafe-regex': 'warn',
      'unicorn/no-useless-promise-resolve-reject': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-object-from-entries': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/string-content': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/no-lonely-if': 'error',
    },
  },
  {
    files: ['cypress/**', 'demos/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-alignment': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/multiline-blocks': 'off',
      'jsdoc/newline-after-description': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'Prefer using TypeScript union types over TypeScript enum, since TypeScript enums have a bunch of issues, see https://dev.to/dvddpl/whats-the-problem-with-typescript-enums-2okj',
        },
      ],
      'tsdoc/syntax': 'error',
    },
  },
  {
    files: ['**/*.spec.{ts,js}', 'cypress/**', 'demos/**', '**/docs/**'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.spec.{ts,js}', 'tests/**', 'cypress/**/*.js'],
    rules: {
      '@cspell/spellchecker': [
        'error',
        {
          checkIdentifiers: false,
          checkStrings: false,
          checkStringTemplates: false,
        },
      ],
    },
  },
  {
    files: ['*.html', '*.md', '**/*.md/*'],
    rules: {
      'no-var': 'error',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  }
);
