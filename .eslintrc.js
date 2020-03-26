module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true
  },
  extends: [
    'eslint:all',
    'plugin:@typescript-eslint/eslint-recommended',
    'prettier'
  ],
  globals: {
    AI: 'writable',
    game: 'writable',
    inHand: 'writable',
    mousePos: 'writable',
    turn: 'writable'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'capitalized-comments': 'off',
    'no-magic-numbers': 'off',
    'no-ternary': 'off',
    'one-var': 'off'
  }
};
