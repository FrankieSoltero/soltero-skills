# Soltero Skills

A public [Claude Code](https://code.claude.com) skills library — reusable `SKILL.md` modules
for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture.

## Install

```
/plugin marketplace add FrankieSoltero/soltero-skills
/plugin install soltero-skills@soltero-skills-marketplace
```

Then invoke skills as `soltero-skills:<skill-name>`.

## Skills

| Skill | What it does |
|-------|--------------|
| `creating-a-skill` | The repo's own dev process: test-first, subagent-validated skill authoring. |
| `capture-lesson` | Records a structured lesson in `Docs/mistakes-and-fixes.md` after a fix. |
| `prisma-safety-review` | Systematic safety pass before a Prisma/DB change merges (atomicity, indexes, pagination, version drift). |
| `scaffold-frontend` | Scaffolds a new front-end via its official CLI, then wires in the standards layer a default scaffold skips. |
| `agent-handoff` | Writes and refreshes a living `HANDOFF.md` so a fresh session resumes long work with zero further questions. |
| `build-mcp-server` | Builds, hardens, and deploys a production-grade MCP server in TypeScript on the official SDK. |
| `audit-swarm` | Whole-repo security + legal audit via an agent swarm: scout → adaptive finders → 3-skeptic verification → severity-ranked report in `Docs/`. |
| `code-optimizer` | Whole-repo cleanup behind a test gate: tool-grounded dead-code removal, de-dup/shortening, live-file splitting, and project-guideline enforcement — every change verified and revertible. |
| `walkthrough-tutor` | Interactive, level-calibrated walkthrough of a branch/PR's changes — mental model first, then one layer per turn with comprehension checks, teaching the concepts behind the code. |
| `agent-playbook` | Living, tiered playbook of coding-agent best practices: advisor mode serves source-linked, tier-labeled guidance; update mode runs a research-sweep Workflow (arXiv + lab blogs + OSS → dedupe → deep-read → skeptic tiering). |

Roadmap (see `docs/specs/`): `claude-integration-patterns`, `financial-correctness-review`,
`author-claude-md`.

## Develop

Every skill is built with `creating-a-skill`. See `CONTRIBUTING.md`.

```
npm test            # tooling unit tests
npm run lint:fm     # SKILL.md frontmatter lint
npm run validate:plugin
```

## License

MIT — see `LICENSE`.
