import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const config = [
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      'no-console': ['warn'],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', '.turbo/**'],
  },
  prettier,
];

export default config;