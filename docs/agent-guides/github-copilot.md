# GitHub Copilot Instructions for AIDIFF

Use AIDIFF whenever a user begins a coding task in this repo or another Git repo that should be tracked locally.

## Required behavior

- Treat Git as the source of truth.
- If the repo is not initialized for AIDIFF, run `ai init`.
- Start a new session at the start of the task.
- Capture the user request as the first session prompt.
- Validate the result with real commands before claiming completion.
- Keep metadata local-first and vendor-neutral.

## Session workflow

```bash
ai init
ai session start --provider github-copilot --model copilot
ai session prompt "<task summary>"
```

When complete:

```bash
ai session finish "<what changed, why it changed, and how it was validated>"
ai status
ai context "<task summary>"
```

## Final response rules

- summarize the work
- list key files changed
- explain the reasoning
- include validation performed
- note remaining risk or follow-up items

Do not invent Git metadata or validation output.
