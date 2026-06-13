# Soltero Skills

A public [Claude Code](https://code.claude.com) skills library — reusable `SKILL.md` modules
for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture.

## Install

```
/plugin marketplace add FrankieSoltero/soltero-skills
/plugin install soltero-skills@soltero-skills-marketplace
```

Then invoke skills as `soltero-skills:<skill-name>`.

## Skills (v0.1)

| Skill | What it does |
|-------|--------------|
| `creating-a-skill` | The repo's own dev process: test-first, subagent-validated skill authoring. |
| `capture-lesson` | Records a structured lesson in `Docs/mistakes-and-fixes.md` after a fix. |

Roadmap (see `docs/specs/`): `prisma-safety-review`, `scaffold-ts-service`,
`security-compliance-review`, `claude-integration-patterns`, `build-mcp-server`,
`financial-correctness-review`, `author-claude-md`.

## Develop

Every skill is built with `creating-a-skill`. See `CONTRIBUTING.md`.

```
npm test            # tooling unit tests
npm run lint:fm     # SKILL.md frontmatter lint
npm run validate:plugin
```

## License

MIT — see `LICENSE`.
