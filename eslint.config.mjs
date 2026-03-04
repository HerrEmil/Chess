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
  {
    files: ["src/chess/__tests__/**/*.ts"],
    rules: {
      "init-declarations": "off",
      "no-duplicate-imports": "off",
      "no-inline-comments": "off",
      "no-plusplus": "off",
      "prefer-destructuring": "off",
      "sort-keys": "off",
    },
  },
  {
    files: ["src/chess/__tests__/setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "func-names": "off",
      "no-empty-function": "off",
      "no-undefined": "off",
      "no-use-before-define": "off",
      "prefer-arrow-callback": "off",
    },
  },
);
