# Cursor / Codex-Style Rules for AIDIFF

Use AIDIFF for any coding task in this repo or in a related Git repository.

## Required workflow

1. Confirm the project is a Git repo.
2. Run `ai init` if not already initialized.
3. Start a session:

```bash
ai session start --provider cursor --model local
ai session prompt "<task summary>"
```

4. Validate before finishing.
5. Close with a concise session summary.

```bash
ai session finish "<what changed, why it changed, and how it was validated>"
ai status
ai context "<short summary>"
```

## Guardrails

- Git is the source of truth.
- Do not invent session or diff history.
- Keep metadata local-first.
- Summaries must be factual and concise.
