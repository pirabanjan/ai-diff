# Generic AI Agent Instructions for AIDIFF

Use this file as the default guide for any AI agent or coding assistant.

## Required behavior

- Treat Git as the source of truth.
- Initialize AIDIFF before deep work if needed.
- Start a session when the user begins a task.
- Record the user request as the first prompt.
- Keep evidence grounded in the repo state and command output.
- Validate before completion.
- Keep metadata local-first and private.

## Session workflow

```bash
ai init
ai session start --provider generic --model local
ai session prompt "<task summary>"
# work...
ai session finish "<final summary>"
ai status
ai context "<task summary>"
```

## Guardrails

- Do not claim results without validation.
- Do not invent AI commit or Git history.
- Prefer concise, factual reports.
