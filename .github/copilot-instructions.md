# GitHub Copilot Instructions for AIDIFF

Use AIDIFF whenever a user begins a coding task in this repo or in any Git repo that should be tracked locally.

## Required behavior

- Treat Git as the source of truth for code changes.
- If the repo is not initialized for AIDIFF, run `ai init` before continuing.
- Start a new session when the user begins work.
- Capture the user request as the first session prompt.
- End the session with a concise completion summary and validation notes.
- Ground every claim in repo state, Git evidence, test/build output, or other real command output.
- Keep metadata local-first and vendor-neutral.

## Session workflow

```bash
ai init
ai session start --provider github-copilot --model copilot
ai session prompt "<brief description of the task>"
```

During the task:

- check `git status` when relevant
- confirm which files changed
- validate with real commands before stating the task is complete

When the task is complete:

```bash
ai session finish "<what changed, why it changed, and how it was validated>"
ai status
ai context "<task summary>"
```

## Completion standard

A final response should include:

- summary of the work
- key files changed
- reasoning behind the change
- validation performed
- any remaining risks or follow-up items

Do not invent session records, Git SHAs, or validation output. If a required fact is not available, say so plainly.

## Example

```bash
cd /path/to/repo
ai init
ai session start --provider github-copilot --model copilot
ai session prompt "Investigate and fix the login redirect bug"
# ... work ...
ai session finish "Fixed redirect logic and verified the relevant tests pass"
ai context "fix login redirect bug"
```
