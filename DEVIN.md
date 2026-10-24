# Devin Workflow Instructions for AIDIFF

Use AIDIFF during every coding workflow so the repo keeps a durable, reviewable trail of intent, code changes, and validation evidence.

## Required behavior

- Start from the actual repository state and Git evidence.
- If AIDIFF is not initialized, run `ai init` before doing meaningful work.
- Use a session lifecycle at the start of each task:

```bash
ai init
ai session start --provider devin --model devin
ai session prompt "<clear task summary>"
```

- Keep a running record of major decisions, constraints, and changes.
- Validate with real commands before claiming success.
- End each task with a completion summary that includes what changed, why it changed, and how it was validated.

## Devin-specific guidance

When working in Devin-style flows:

1. Treat the repo as the ground truth.
2. Record the user's goal and expected outcome at the beginning of the session.
3. Capture key milestones when the task changes direction or adds new constraints.
4. When the task is large, break it into logical checkpoints.
5. At the end, produce a compact handoff summary:

```bash
ai session finish "<final summary of outcome, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Example

```bash
cd /path/to/repo
ai init
ai session start --provider devin --model devin
ai session prompt "Fix the failing auth redirect and confirm the relevant tests pass"
# ... perform work ...
ai session finish "Auth redirect fixed and the targeted validation suite passed"
ai context "fix auth redirect"
```

## Guardrails

- Do not invent Git history, prompt logs, or validation results.
- Keep the work local-first unless the user explicitly asks for external sharing.
- If output is uncertain, state the uncertainty and point to the exact evidence source.
