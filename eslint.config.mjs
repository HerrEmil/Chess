import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["build/**"],
  },
  eslint.configs.all,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        $: "readonly",
        jQuery: "readonly",
        AI: "writable",
        game: "writable",
        inHand: "writable",
        mousePos: "writable",
        turn: "writable",
      },
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
      "one-var": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-param-reassign": "warn",
      "no-loop-func": "error",
    },
  },
);
