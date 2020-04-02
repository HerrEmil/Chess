module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true
  },
  extends: [
    'eslint:all',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:functional/all'
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
    project: ['./tsconfig.json'],
    sourceType: 'module',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'functional'],
  root: true,
  rules: {
    'capitalized-comments': 'off',
    'linebreak-style': 'off',
    'no-magic-numbers': 'off',
    'no-nested-ternary': 'off',
    'no-ternary': 'off',
    'one-var': 'off',
    'functional/prefer-readonly-type': 'off',
    'functional/no-conditional-statement': 'off',
    'functional/no-let': 'off',
    'functional/no-loop-statement': 'off',
    'functional/no-expression-statement': 'off',
    'functional/no-return-void': 'off',
    'functional/immutable-data': 'off',
    'functional/functional-parameters': 'off'
  }
};
