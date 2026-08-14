// Chess-specific stylelint config. Extends the shared
// stylelint-config-standard baseline (same as perf-config's
// .stylelintrc.json), but softens four rules whose violations are
// architectural and not worth refactoring:
//
//   - selector-max-id / selector-max-specificity:
//       The chess game wires DOM via getElementById('startMenu'),
//       getElementById('board'), getElementById('restartBtn'), etc.
//       Refactoring to class-only selectors would require touching
//       both src/default.css and src/chess/*.ts — high risk for zero
//       runtime benefit on a single-page app with no shared CSS.
//
//   - selector-id-pattern / selector-class-pattern:
//       Existing IDs/classes are camelCase (#whiteTurn2, #startMenu,
//       #restartBtn, .lastMove, .notYourTurn) and are referenced from
//       TS source. Renaming to kebab-case is a coordinated rename
//       across HTML, CSS, and JS with no functional payoff.
//
// All other rules in stylelint-config-standard remain on. Stylistic
// fixes (color-function-notation, alpha-value-notation, empty lines,
// etc.) were aligned with the shared config in this same change.

module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-disallowed-list': [
      ['import'],
      {
        message:
          'Use <link rel="stylesheet"> or bundler imports — @import in CSS blocks rendering.',
      },
    ],
    'declaration-property-value-disallowed-list': {
      '/^transition/': ['/all/'],
      '/^animation/': ['/all/'],
    },
    'function-disallowed-list': ['expression'],
    'unit-disallowed-list': [
      ['pt', 'cm', 'mm', 'in', 'pc'],
      {
        message:
          'Use px, rem, em, %, vw, or vh — print units harm responsive layout.',
      },
    ],
    'color-no-invalid-hex': true,
    'comment-no-empty': true,
    'media-feature-name-no-unknown': true,
    'property-no-vendor-prefix': [
      true,
      {
        ignoreProperties: ['appearance', 'user-select', 'tap-highlight-color'],
      },
    ],
    'value-no-vendor-prefix': [true, { ignoreValues: ['sticky'] }],

    // Softened: chess game DOM is wired via getElementById on
    // camelCase IDs (#startMenu, #board, #restartBtn, #whiteTurn2,
    // etc.). Refactoring to classes/kebab-case requires coordinated
    // changes in HTML + CSS + TS for no runtime benefit.
    'selector-max-id': null,
    'selector-max-specificity': null,
    'selector-id-pattern': null,
    'selector-class-pattern': null,

    // Off in the shared perf-config baseline too — ID-heavy selectors
    // produce false positives that aren't worth chasing.
    'no-descending-specificity': null,
  },
};
