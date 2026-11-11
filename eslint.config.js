// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const reactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  // React Compiler is enabled (app.json → experiments.reactCompiler); these rules flag code it
  // can't optimize or that breaks the Rules of React.
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // Guardrails that keep the app consistent with the design system.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: "Use `Text` from '@/components/ui' (themed, typed variants).",
            },
            {
              name: 'react-native',
              importNames: ['SafeAreaView'],
              message: "Use 'react-native-safe-area-context' (or the `Screen` component).",
            },
            {
              name: 'react-native',
              importNames: ['Image'],
              message: "Use `Image` from 'expo-image' (caching, performance, more formats).",
            },
          ],
        },
      ],
    },
  },
  {
    // The design-system primitives are the one place allowed to wrap the raw components.
    files: ['src/components/ui/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ['scripts/**', '.claude/**', '*.config.js', '*.config.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  // Turns off formatting rules that would fight Prettier. Keep last.
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'ios/*', 'android/*', 'coverage/*', '.artifacts/*'],
  },
]);
