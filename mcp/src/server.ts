// Server definition — built once by buildServer(), exposed over stdio (stdio.ts).
// Verified against @modelcontextprotocol/sdk v1.30.0: subpath imports, raw-shape
// inputSchema, registerTool/registerResource/registerPrompt, InMemoryTransport.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseFrontmatter, validateFrontmatter } from "./frontmatter.js";
import {
  assertSkillsDir,
  closeMatches,
  findSkill,
  listBundledFiles,
  loadSkills,
  readSkillFile,
  resolveSkillsDir,
  writeSkillSkeleton,
  type SkillsIndex,
} from "./skills.js";
import { logger } from "./logger.js";

export interface BuildServerOptions {
  /** Overrides SOLTERO_SKILLS_DIR and the default repo-relative resolution. */
  skillsDir?: string;
}

function packageVersion(): string {
  try {
    const pkgPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "package.json",
    );
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function text(data: unknown): {
  content: [{ type: "text"; text: string }];
} {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorText(message: string): {
  isError: true;
  content: [{ type: "text"; text: string }];
} {
  return { isError: true as const, content: [{ type: "text" as const, text: message }] };
}

function unknownSkillMessage(index: SkillsIndex, name: string): string {
  const matches = closeMatches(index, name);
  return matches.length
    ? `Unknown skill: "${name}". Close matches: ${matches.join(", ")}`
    : `Unknown skill: "${name}". No close matches; call list_skills for the full index.`;
}

/** SKILL.md skeleton per skills/creating-a-skill conventions. */
export function skillSkeleton(name: string, description: string): string {
  const title = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `---
name: ${name}
description: ${description}
---

# ${title}

## Overview

<one paragraph: what this skill does, and the core principle it enforces>

## When to Use

- <concrete trigger: the situation or phrasing that should load this skill>

## When NOT to Use

- <nearby situation this skill does not cover, and which skill/tool does>

## The Flow

1. **First step** — <what to do, in order>.
2. **Next step** — <what to do next>.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "<the excuse an agent will give to skip this>" | <why it does not hold> |

## Red Flags — STOP

- <behavior that means the discipline is being skipped> → STOP, <correct action>.
`;
}

/** Routing rule extracted from the repo root AGENTS.md (## The rule + ## Routing). */
function routingRule(skillsDir: string): string {
  const agentsMd = join(dirname(skillsDir), "AGENTS.md");
  let content: string;
  try {
    content = readFileSync(agentsMd, "utf8");
  } catch {
    return "(AGENTS.md not found next to the skills directory — routing rule unavailable.)";
  }
  const start = content.indexOf("## The rule");
  const end = content.indexOf("## Full skill index");
  if (start !== -1 && end !== -1 && end > start) {
    return content.slice(start, end).trim();
  }
  return content.trim();
}

export function buildServer(options: BuildServerOptions = {}): McpServer {
  const skillsDir = options.skillsDir
    ? resolve(options.skillsDir)
    : resolveSkillsDir();
  assertSkillsDir(skillsDir);

  const server = new McpServer({
    name: "soltero-skills",
    version: packageVersion(),
  });

  // ---------- Tools ----------

  server.registerTool(
    "list_skills",
    {
      title: "List skills",
      description:
        "List every skill in the library: name, description (from SKILL.md frontmatter), and path.",
    },
    async () => {
      try {
        const index = loadSkills(skillsDir);
        logger.info(
          { tool: "list_skills", count: index.skills.length },
          "list ok",
        );
        return text({
          skills: index.skills.map(({ name, description, path }) => ({
            name,
            description,
            path,
          })),
          warnings: index.warnings,
        });
      } catch (err) {
        logger.error({ tool: "list_skills", err: (err as Error).message });
        return errorText(`Error: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "get_skill",
    {
      title: "Get skill",
      description:
        "Fetch one skill by name: full SKILL.md body plus its bundled files " +
        "(reference.md, templates/, workflows/). Set include_files to also inline file contents.",
      inputSchema: {
        name: z.string().min(1).describe("skill name, e.g. lean-tdd"),
        include_files: z
          .boolean()
          .optional()
          .describe("also inline the contents of bundled files"),
      },
    },
    async ({ name, include_files }) => {
      try {
        const index = loadSkills(skillsDir);
        const skill = findSkill(index, name);
        if (!skill) {
          logger.info({ tool: "get_skill", name }, "unknown skill");
          return errorText(unknownSkillMessage(index, name));
        }
        const files = listBundledFiles(skill.dir).map((p) => ({
          path: p,
          ...(include_files ? { content: readSkillFile(skill.dir, p) } : {}),
        }));
        return text({
          name: skill.name,
          description: skill.description,
          path: skill.path,
          body: skill.body,
          files,
        });
      } catch (err) {
        logger.error({ tool: "get_skill", err: (err as Error).message });
        return errorText(`Error: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "search_skills",
    {
      title: "Search skills",
      description:
        "Case-insensitive substring search over skill name, description, and body. " +
        "Ranked: name match > description match > body match.",
      inputSchema: {
        query: z.string().min(1).describe("substring to search for"),
      },
    },
    async ({ query }) => {
      try {
        const q = query.toLowerCase();
        const index = loadSkills(skillsDir);
        const hits = index.skills
          .map((s) => {
            const rank = s.name.toLowerCase().includes(q)
              ? 3
              : s.description.toLowerCase().includes(q)
                ? 2
                : s.body.toLowerCase().includes(q)
                  ? 1
                  : 0;
            return {
              name: s.name,
              description: s.description,
              path: s.path,
              matched_in:
                rank === 3 ? "name" : rank === 2 ? "description" : "body",
              rank,
            };
          })
          .filter((h) => h.rank > 0)
          .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))
          .map(({ rank: _rank, ...h }) => h);
        logger.info(
          { tool: "search_skills", query, count: hits.length },
          "search ok",
        );
        return text({ query, results: hits, warnings: index.warnings });
      } catch (err) {
        logger.error({ tool: "search_skills", err: (err as Error).message });
        return errorText(`Error: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "lint_skill",
    {
      title: "Lint skill",
      description:
        "Run the repo's frontmatter rules (tools/frontmatter.mjs — the same " +
        "implementation as the lint-frontmatter CI gate) against an installed " +
        "skill (by name) or draft SKILL.md content. Pass exactly one of name or content.",
      inputSchema: {
        name: z.string().min(1).optional().describe("installed skill name"),
        content: z
          .string()
          .min(1)
          .optional()
          .describe("raw SKILL.md draft content"),
      },
    },
    async ({ name, content }) => {
      try {
        if ((name ? 1 : 0) + (content ? 1 : 0) !== 1) {
          return errorText(
            "Pass exactly one of `name` (lint an installed skill) or `content` (lint a draft).",
          );
        }
        if (name) {
          const index = loadSkills(skillsDir);
          const skill = findSkill(index, name);
          if (!skill) return errorText(unknownSkillMessage(index, name));
          const fm = parseFrontmatter(skill.body);
          if (!fm) return text({ name, errors: ["missing YAML frontmatter"] });
          const folder = skill.dir.split(/[\\/]/).pop() ?? "";
          return text({ name, errors: validateFrontmatter(fm, folder) });
        }
        const fm = parseFrontmatter(content as string);
        if (!fm) return text({ errors: ["missing YAML frontmatter"] });
        return text({ errors: validateFrontmatter(fm) });
      } catch (err) {
        logger.error({ tool: "lint_skill", err: (err as Error).message });
        return errorText(`Error: ${(err as Error).message}`);
      }
    },
  );

  server.registerTool(
    "scaffold_skill",
    {
      title: "Scaffold skill",
      description:
        "Create a new skills/<name>/SKILL.md skeleton following the repo's " +
        "creating-a-skill conventions (Overview / When to Use / When NOT to Use / " +
        "The Flow / Rationalization Table / Red Flags). Fails if the skill exists.",
      inputSchema: {
        name: z
          .string()
          .min(1)
          .describe("kebab-case skill name; becomes the folder name"),
        description: z
          .string()
          .min(1)
          .describe(
            'frontmatter description — third person, leads with the trigger ("Use when …")',
          ),
      },
    },
    async ({ name, description }) => {
      try {
        const validationErrors = validateFrontmatter(
          { name, description },
          name,
        );
        if (validationErrors.length) {
          return errorText(
            `Invalid skill frontmatter:\n- ${validationErrors.join("\n- ")}`,
          );
        }
        const body = skillSkeleton(name, description);
        const file = writeSkillSkeleton(skillsDir, name, body);
        logger.info({ tool: "scaffold_skill", name }, "scaffolded");
        return text({
          created: file,
          body,
          next_steps:
            "Fill in the skeleton, then validate with lint_skill. Per " +
            "creating-a-skill, no skill ships without pressure scenarios run " +
            "on a fresh subagent first.",
        });
      } catch (err) {
        logger.error({ tool: "scaffold_skill", err: (err as Error).message });
        return errorText(`Error: ${(err as Error).message}`);
      }
    },
  );

  // ---------- Resources (same read path as get_skill) ----------

  server.registerResource(
    "skill",
    new ResourceTemplate("skill://{name}", {
      list: async () => ({
        resources: loadSkills(skillsDir).skills.map((s) => ({
          uri: `skill://${s.name}`,
          name: s.name,
          description: s.description,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Skill",
      description: "A skill's full SKILL.md body.",
      mimeType: "text/markdown",
    },
    async (uri, { name }) => {
      const index = loadSkills(skillsDir);
      const skill = findSkill(index, String(name));
      if (!skill) throw new Error(unknownSkillMessage(index, String(name)));
      return {
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: skill.body },
        ],
      };
    },
  );

  server.registerResource(
    "skill-file",
    new ResourceTemplate("skill://{name}/file/{+path}", { list: undefined }),
    {
      title: "Skill bundled file",
      description:
        "A file bundled with a skill (reference.md, templates/…, workflows/…).",
      mimeType: "text/markdown",
    },
    async (uri, { name, path }) => {
      const index = loadSkills(skillsDir);
      const skill = findSkill(index, String(name));
      if (!skill) throw new Error(unknownSkillMessage(index, String(name)));
      const content = readSkillFile(skill.dir, String(path));
      if (content === null) {
        throw new Error(
          `Skill "${String(name)}" has no bundled file "${String(path)}". ` +
            `Available: ${listBundledFiles(skill.dir).join(", ") || "(none)"}`,
        );
      }
      return { contents: [{ uri: uri.href, text: content }] };
    },
  );

  // ---------- Prompts ----------

  server.registerPrompt(
    "route-task",
    {
      title: "Route a task to the right skill",
      description:
        "Given a task, returns the repo's skill-routing rule plus the current " +
        "skill index, instructing the agent to pick and fetch the right skill. " +
        "The SessionStart hook's job, delivered on demand.",
      argsSchema: {
        task: z.string().min(1).describe("the task to route"),
      },
    },
    ({ task }) => {
      const index = loadSkills(skillsDir);
      const skillIndex = index.skills
        .map((s) => `- ${s.name} — ${s.description}`)
        .join("\n");
      const warnings = index.warnings.length
        ? `\n\nWarnings (skills omitted due to frontmatter problems):\n${index.warnings.map((w) => `- ${w}`).join("\n")}`
        : "";
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                `${routingRule(skillsDir)}\n\n` +
                `## Current skill index\n\n${skillIndex}${warnings}\n\n` +
                `## Task to route\n\n${task}\n\n` +
                `Pick the skill that applies (if any), then fetch it with the ` +
                `get_skill tool (or the skill://<name> resource) and follow it ` +
                `before doing anything else. If none applies, say so and proceed.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "use-skill",
    {
      title: "Load a skill as session instructions",
      description:
        "Returns a skill's body framed as instructions to follow for the rest " +
        "of the session.",
      argsSchema: {
        name: z.string().min(1).describe("skill name, e.g. lean-tdd"),
      },
    },
    ({ name }) => {
      const index = loadSkills(skillsDir);
      const skill = findSkill(index, name);
      if (!skill) {
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: unknownSkillMessage(index, name),
              },
            },
          ],
        };
      }
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                `Follow these instructions for the rest of the session:\n\n` +
                skill.body,
            },
          },
        ],
      };
    },
  );

  return server;
}
