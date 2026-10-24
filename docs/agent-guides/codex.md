# Codex / Agent Instructions for AIDIFF

## Mandatory workflow

- Treat Git as the source of truth.
- If AIDIFF is not initialized, run `ai init` before continuing.
- At the start of each task, start a session:

```bash
ai session start --provider codex --model local
ai session prompt "<short task summary>"
```

- Validate actual behavior before saying the task is complete.
- Close with evidence-based completion notes:

```bash
ai session finish "<what changed, why it changed, and how it was validated>"
ai status
ai context "<task summary>"
```

## Hard constraints

- No fabricated commit IDs or session records.
- No hidden or unverified chain-of-thought claims.
- No external sync unless explicitly requested.
- Keep metadata local-first.

## Response template

```yaml
objective: "<task objective>"
files_changed:
  - "<file 1>"
  - "<file 2>"
key_decisions:
  - "<decision>"
validation:
  - "<command and outcome>"
remaining_risks:
  - "<risk or follow-up>"
```
