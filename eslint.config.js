const tsPlugin = require('@typescript-eslint/eslint-plugin');
const react = require('eslint-plugin-react');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  { ignores: ['dist/', 'coverage/', 'storybook-static/', 'node_modules/', '__mocks__/', '*.config.*'] },
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    ...react.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    // The write methods (createStream, withdrawFromStream, cancelStream,
    // createRecurringPayment, cancelSchedule) are stubs until issue #5 is
    // implemented. Remove this override once every method uses its parameters.
    files: ['src/client/VeloxClient.ts'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }] },
  },
];
