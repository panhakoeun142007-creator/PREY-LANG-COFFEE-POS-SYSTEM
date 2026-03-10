import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
<<<<<<< HEAD
=======
<<<<<<< HEAD
import tseslint from 'typescript-eslint'
=======
>>>>>>> feature/customer-menu
>>>>>>> feature/merge-staff-dashboard
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
<<<<<<< HEAD
  {
    files: ['**/*.{js,jsx}'],
=======
<<<<<<< HEAD
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
=======
  {
    files: ['**/*.{js,jsx}'],
>>>>>>> feature/customer-menu
>>>>>>> feature/merge-staff-dashboard
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
