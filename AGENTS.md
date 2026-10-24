# AIDIFF Agent Session Instructions

Use this file as the default operating guide for agent-style coding tools such as Codex, open agent workflows, and generic AI assistants working in a Git repository that uses AIDIFF.

## Purpose

AIDIFF is a local-first traceability layer for AI-assisted software work. It preserves:

- the Git source of truth
- the AI session context
- the intent behind a feature or change
- validation evidence
- the history of work across prompts and commits

The goal is not to replace Git. The goal is to make AI work explainable, reviewable, and traceable.

## Core rules

1. Treat Git as the single source of truth for code state.
2. Record AI session activity with AIDIFF when the user begins work.
3. Do not fabricate commit or diff history.
4. Keep evidence grounded in actual repository state, tests, and commands.
5. Prefer local storage and local metadata. Do not upload private project context unless the user explicitly asks for it.
6. Distinguish observed evidence from AI interpretation.

## When a user starts an AI session

When the user begins a coding task, do the following:

1. Check whether the current directory is a Git repository.
2. If not, tell the user to run:

   ```bash
   git init
   ai init
   ```

3. If the repo is not yet initialized for AIDIFF, run:

   ```bash
   ai init
   ```

4. Start a session using the local CLI:

   ```bash
   ai session start --provider generic --model local
   ```

   If your platform provides a direct adapter, use the equivalent provider/model metadata instead.

5. Record the user request as the initial session prompt:

   ```bash
   ai session prompt "<brief description of the user request>"
   ```

6. Keep working in the repo and record major milestones and decisions as the session progresses.

## During the session

- Keep the session grounded in the actual repo state.
- Before claiming a change is complete, validate it with real commands such as tests, build steps, or lint checks.
- If the task is significant, summarize the work in a structured way:
  - goal
  - files changed
  - key decisions
  - validation performed
  - remaining risks
- When the task relates to a feature or multi-step change, treat the session as a traceable unit of work and avoid mixing unrelated work into the same summary.

## Before finishing

When the user asks for a final summary or completion, do this:

```bash
ai status
ai context "<short summary of the task>"
```

Then summarize the result using:

- what changed
- why it changed
- which files were involved
- what was validated
- what remains open

## Finalize the session

When the work is complete, close the session with:

```bash
ai session finish "<clear completion summary>"
```

This should capture:

- session outcome
- user intent
- relevant repository state
- validation evidence
- follow-up tasks if any

## Example workflow

```bash
cd /path/to/project
ai init
ai status
ai session start --provider generic --model local
ai session prompt "Add support for organization-scoped auth in the billing module"
ai session finish "Organization-scoped auth support added and validation completed"
ai context "add organization-scoped auth support"
```

## Guidance for AI agents

- Never claim to have stored evidence if no command or repo state was actually checked.
- Do not invent Git diffs, session IDs, or validation results.
- If AIDIFF is unavailable, explain that the repo has not been initialized and ask the user whether to initialize it first.
- Prefer concise, factual, evidence-based summaries.

## Local-first design note

AIDIFF stores project metadata locally and is designed to keep the source of truth in the repository, not in an external service. Respect the user's privacy and avoid external syncing unless explicitly requested.
