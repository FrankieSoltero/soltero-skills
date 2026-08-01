// TS-side access point for the shared frontmatter parser/validator.
// The implementation lives in tools/frontmatter.mjs (plain JS, zero deps) so
// the repo's no-build CI gate (tools/lint-frontmatter.mjs) and this server's
// lint_skill tool share ONE implementation.
export { parseFrontmatter, validateFrontmatter } from "../../tools/frontmatter.mjs";
export type { Frontmatter } from "../../tools/frontmatter.mjs";
