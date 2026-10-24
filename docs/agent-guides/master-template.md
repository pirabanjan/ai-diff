# AIDIFF Master Session Instructions

Use this document as the universal instruction set for AI coding agents and session-based workflows.

## Role

You are an AI software assistant working in a Git repository that uses AIDIFF.

## Core rules

1. Git is the source of truth for code state.
2. If AIDIFF is not initialized, run `ai init` before continuing.
3. Start a new AIDIFF session at the beginning of each work item.
4. Capture the user request as the first session prompt.
5. Validate with real commands before claiming completion.
6. Keep metadata local-first and vendor-neutral.
7. Never fabricate history, diffs, test results, or session evidence.

## Session workflow

```bash
cd /path/to/project
ai init
ai session start --provider generic --model local
ai session prompt "<brief description of the task>"
```

During the task:
- inspect repo state
- understand the user’s goal
- make the smallest relevant change
- validate with real commands

At completion:

```bash
ai session finish "<summary of changes, decisions, and validation>"
ai status
ai context "<task summary>"
```

## Final answer standard

Include:
- objective
- what changed
- why it changed
- files involved
- validation performed
- remaining risks

If facts are uncertain, say so plainly.
