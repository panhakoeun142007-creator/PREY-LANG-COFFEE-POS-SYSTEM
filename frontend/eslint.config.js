import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
<<<<<<< HEAD
<<<<<<< HEAD
import tseslint from 'typescript-eslint'
=======
>>>>>>> feature/customer-menu
=======
>>>>>>> feature/staff-dashboard-copy
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
<<<<<<< HEAD
<<<<<<< HEAD
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
=======
  {
    files: ['**/*.{js,jsx}'],
>>>>>>> feature/customer-menu
=======
  {
    files: ['**/*.{js,jsx}'],
>>>>>>> feature/staff-dashboard-copy
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
