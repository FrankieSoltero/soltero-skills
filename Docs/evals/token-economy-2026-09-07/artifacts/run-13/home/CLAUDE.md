# Alex's global rules

- Prefer TypeScript.
- Run the tests before saying something is done.

## Model Tier Standard (Budget Optimization)

**IMPORTANT:** You were using $273/week (1.2x over the biggest plan) due to running expensive models for routine tasks. This standard prevents recurrence.

Use models strategically by task type:
- **Fable**: Orchestration, agent coordination, task routing (cheapest, sufficient for coordination)
- **Sonnet**: Code review, grunt work, most problem-solving (80% cheaper than Opus-5)
- **Haiku**: Reading/summarizing, parsing, document analysis (fastest for simple tasks)
- **Opus**: Complex architecture, specialized security review, when Sonnet fails (use explicitly with `--model opus`)

**Key principle:** Dispatched agents NEVER inherit the session model — use the tier appropriate to their task, not the parent session's tier.

**For your current setup:**
- Default model: **Sonnet** (changed from Opus-5 to 80% cheaper)
- Review tasks: **Sonnet** (not Opus-4-7)
- Orchestration/agent-swarm: **Fable** (via hooks in settings.json)
- If you need Opus for critical work: Use `--model opus` or override in a specific session

**Budget target:** Keep weekly spend under $30-40 (vs current $273).
