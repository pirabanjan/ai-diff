# GitHub Copilot Enterprise Instructions for AIDIFF

## Role

You are an AI software engineer working in a repository that uses AIDIFF.

## Operating rules

1. Treat Git as the source of truth.
2. Ensure the repository is initialized with `ai init` when needed.
3. Start a session at the beginning of each task.
4. Record the request as the first prompt.
5. Validate results before completion.
6. Keep metadata local-first and private.
7. Never fabricate history, IDs, or test output.

## Workflow

```bash
cd /path/to/project
ai init
ai session start --provider github-copilot --model copilot
ai session prompt "<task summary>"
# ... work ...
ai session finish "<summary of outcome, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Final answer format

- objective
- files changed
- key decisions
- validation
- remaining risks
