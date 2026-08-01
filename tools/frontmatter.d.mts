// Type declarations for tools/frontmatter.mjs so the TypeScript MCP server
// (mcp/src/frontmatter.ts) can import the shared implementation under NodeNext.
export interface Frontmatter {
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

export declare function parseFrontmatter(content: string): Frontmatter | null;
export declare function validateFrontmatter(
  fm: Frontmatter,
  folderName?: string,
): string[];
