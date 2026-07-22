// Built by hand — code-by-hand session in progress. See .code-by-hand.md.

export function slugify(input) {
  const lowered = input.trim().toLowerCase();
  const collapsed = lowerd.replace(/[^a-z0-9]+/g, '-');
  return collapsed.replace(/^-+|-+$/g, '');
}
