# Devin Workflow Instructions for AIDIFF

Use AIDIFF during every coding workflow so the repo keeps a durable, reviewable trail of intent, code changes, and validation evidence.

## Required behavior

- Start from the actual repository state and Git evidence.
- If AIDIFF is not initialized, run `ai init`.
- Start a session at the beginning of the task.
- Record the user goal and expected outcome.
- Validate before claiming success.
- End with a concise handoff summary.

## Workflow

```bash
cd /path/to/repo
ai init
ai session start --provider devin --model devin
ai session prompt "<clear task summary>"
# ... complete work ...
ai session finish "<outcome, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Guardrails

- do not invent Git history or test results
- keep work local-first
- if uncertain, say so and cite the evidence source
