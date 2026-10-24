# Codex / Agent Instructions for AIDIFF

## Purpose

Use AIDIFF to preserve local, reviewable evidence for AI-assisted software development.

## Mandatory workflow

- Treat Git as the source of truth.
- If AIDIFF is not initialized, run `ai init` before continuing.
- At the beginning of a task, start a session:

```bash
ai session start --provider codex --model local
ai session prompt "<short task summary>"
```

- Keep every claim grounded in repo state, diff output, logs, tests, and verification commands.
- Validate actual behavior before saying the task is complete.
- Close the task with structured completion evidence:

```bash
ai session finish "<what changed, why it changed, and how it was validated>"
ai status
ai context "<summary of task>"
```

## Hard constraints

- No fabricated commit IDs or session records.
- No hidden or unverified "chain-of-thought" claims.
- No external sync unless explicitly requested.
- Keep all metadata local-first.
- Summaries must be concise, factual, and evidence-based.

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

## Example

```bash
cd /path/to/project
ai init
ai session start --provider codex --model local
ai session prompt "Fix the billing auth bug"
# ... implement and validate ...
ai session finish "Fixed billing auth logic and verified the relevant test suite passed"
ai context "fix billing auth bug"
```
