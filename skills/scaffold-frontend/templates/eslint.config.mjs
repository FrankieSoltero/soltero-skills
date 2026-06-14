// @ts-check
// ESLint v9 flat config — React + TS, type-aware.
// Install: npm i -D eslint @eslint/js typescript typescript-eslint eslint-plugin-react \
//   eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-config-prettier globals
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "build", ".next", "coverage", "node_modules"] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.es2023 },
      parserOptions: {
        // Type-aware linting without hand-listing tsconfigs:
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules, // new JSX transform: no React import needed
      ...reactHooks.configs["recommended-latest"].rules, // react-hooks v6 flat config
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },

  // Plain JS / config files: drop type-aware rules.
  { files: ["**/*.{js,cjs,mjs}"], ...tseslint.configs.disableTypeChecked },

  prettier, // MUST be last — turns off stylistic rules that conflict with Prettier
);
