import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

// Outside every tsconfig include, so type-aware rules have no program to run against.
const filesWithoutTsProgram = ["**/*.mjs", "**/*.cjs", "**/*.config.ts"];

export default tseslint.config(
  {
    ignores: ["build/**"],
  },
  eslint.configs.all,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "capitalized-comments": "off",
      "linebreak-style": "off",
      "no-magic-numbers": "off",
      "no-nested-ternary": "off",
      "no-ternary": "off",
      "id-length": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-params": "off",
      "max-statements": "off",
      "sort-imports": "off",
      "sort-keys": "off",
      "prefer-destructuring": "off",
      "one-var": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-param-reassign": "error",
      "no-loop-func": "error",
    },
  },
  // Node-side code: build scripts, config files, and the engine lab tooling.
  {
    files: [...filesWithoutTsProgram, "tools/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-bitwise": "off",
      "no-console": "off",
      "no-continue": "off",
      "no-undefined": "off",
      "prefer-named-capture-group": "off",
      "require-unicode-regexp": "off",
    },
  },
  // Of those, only tools/ is type-checked.
  {
    files: filesWithoutTsProgram,
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["src/chess/__tests__/**/*.ts"],
    rules: {
      "init-declarations": "off",
      "no-duplicate-imports": "off",
      "no-inline-comments": "off",
      "no-plusplus": "off",
    },
  },
);
