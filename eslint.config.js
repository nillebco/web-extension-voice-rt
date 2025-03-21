import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        ignores: ['dist/**']
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.webextensions
            }
        },
        rules: {
            'no-undef': 'error', // catch unresolved functions/variables
            'no-unused-vars': 'warn',
        },
    },
];