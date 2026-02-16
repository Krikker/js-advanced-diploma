import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import jest from 'eslint-plugin-jest';

export default defineConfig([
  // 🔥 что игнорить
  {
    ignores: [
      'node_modules',
      'dist',
      'eslint.config.mjs',
    ],
  },

  // База от ESLint для JS
  js.configs.recommended,

  // Твои JS файлы
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
      },
    },
    plugins: {
      jest,
    },
  },

  // Тесты
  {
    files: ['**/*.test.js'],
    rules: {
      'jest/expect-expect': 'off',
    },
  },
]);
