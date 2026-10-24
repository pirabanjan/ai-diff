# Claude Code Session Instructions for AIDIFF

Use AIDIFF to track the repo state, the session context, and the evidence behind work in this project.

## Operating rules

- Git is the source of truth for code changes.
- AIDIFF is local-first and should keep all metadata on disk unless the user explicitly asks otherwise.
- When the user starts a coding task, initialize AIDIFF if needed.
- Record the task as a session prompt immediately.
- Keep the final summary tied to observable evidence, not assumptions.

## Session lifecycle

```bash
cd /path/to/project
ai init
ai session start --provider claude --model claude-code
ai session prompt "<task summary>"
```

During the task:

- inspect repo state before making changes
- note the most relevant files and decisions
- validate changes with real commands

At completion:

```bash
ai session finish "<summary of actual changes, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Output expectations

Summaries should include:

- objective
- files changed
- key architectural or logic decisions
- validation performed
- remaining issues or follow-up work

Do not claim results that were not directly verified from the repository or command output.
