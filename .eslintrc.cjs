/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: ['dist/**/*.ts', 'dist/**/*.js', 'test/**/*.ts', 'test/**/*.js'],
  rules: {
    'semi': ['error', 'always'],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types'      : 'off',
    '@typescript-eslint/no-unused-vars' : 'warn'
  }
};