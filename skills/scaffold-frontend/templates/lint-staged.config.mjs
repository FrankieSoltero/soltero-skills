// Runs on staged files via the pre-commit hook (see templates/pre-commit).
// Setup: npm i -D husky lint-staged && npx husky init
// then put `npx lint-staged` in .husky/pre-commit (templates/pre-commit).
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};
