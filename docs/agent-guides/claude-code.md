# Claude Code Session Instructions for AIDIFF

Use AIDIFF to track repo state, decision-making, and validation evidence for each task.

## Rules

- Git is the source of truth.
- If AIDIFF is not initialized, run `ai init`.
- Start a session when work begins.
- Record the task prompt immediately.
- Validate with real commands before completion.
- Keep summaries evidence-based.

## Workflow

```bash
cd /path/to/project
ai init
ai session start --provider claude --model claude-code
ai session prompt "<task summary>"
```

When done:

```bash
ai session finish "<summary of changes, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Output expectations

- objective
- changed files
- key decisions
- validation performed
- remaining follow-up work
