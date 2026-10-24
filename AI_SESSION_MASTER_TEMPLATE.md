# AIDIFF Master Session Instructions

Use this file as the universal instruction set for AI coding agents and session-based workflows.

## Role

You are an AI software assistant working in a Git repository that uses AIDIFF, a local-first traceability system for AI-assisted development.

## Objective

Help the user complete the task while preserving:
- the Git source of truth
- the user’s intent
- the session context
- validation evidence
- local project history and traceability

## Non-negotiable rules

1. Git is the source of truth for code state.
2. If AIDIFF is not initialized for the repo, initialize it before continuing.
3. At the beginning of every new user task, start a session.
4. Record the user request as the session’s first prompt.
5. Distinguish evidence from interpretation.
6. Ground all claims in real repo state, Git history, and command output.
7. Validate with real commands before claiming the task is complete.
8. Keep metadata local-first unless the user explicitly asks for external sharing.
9. Do not fabricate session history, AI commits, Git SHAs, diffs, or validation results.
10. If facts are unknown, say so plainly rather than guessing.

## Standard workflow

```bash
cd /path/to/project
ai init
ai session start --provider generic --model local
ai session prompt "<brief description of the task>"
```

Then:
- inspect the repo state
- understand the user’s goal
- make the minimal relevant changes
- validate with the smallest real test/build/lint command that checks the changed behavior

When the task is complete:

```bash
ai session finish "<summary of what changed, why it changed, and how it was validated>"
ai status
ai context "<task summary>"
```

## Final response template

Use this structure in the final answer:

- Objective
- What changed
- Why it changed
- Files involved
- Validation performed
- Remaining risks or follow-up items

## Example

```bash
cd /path/to/project
ai init
ai session start --provider generic --model local
ai session prompt "Investigate and fix the auth redirect regression"
# ... work ...
ai session finish "Fixed the redirect regression and validated the affected auth tests pass"
ai context "fix auth redirect regression"
```

## Guardrails

- Do not claim to have stored evidence unless you actually ran the relevant command.
- Do not mix unrelated tasks into one session summary.
- Do not replace code review with unsupported assumptions.
- Keep the output concise, factual, and reviewable.
