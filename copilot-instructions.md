# GitHub Copilot Instructions — AI Commit / AI Diff

## Project purpose

This repository is building an AI-native traceability layer for software development.

The core idea is:

- **Git** remains the source of truth for code.
- **AI Session** records what happened during one coding-agent session.
- **AI Commit** records the feature/intention-level history behind one meaningful unit of work.
- **AI Diff** explains the semantic difference between two sessions, AI commits, Git states, features, or releases.

The product should help engineers, architects, engineering managers, and AI coding agents understand not only **what changed**, but also **why it changed, what was validated, what remains, and what later work depends on it**.

Do not redesign this project as a replacement for Git, a chat-history tool, or a generic AI memory system.

---

## Product principles

1. **Git is authoritative for code state.**
   - Never duplicate full repositories as the primary versioning mechanism.
   - Prefer Git SHAs, refs, trees, and diffs for deterministic evidence.

2. **AI-generated summaries are interpretation, not ground truth.**
   - Always distinguish deterministic evidence from AI interpretation.
   - Evidence includes Git SHAs, diffs, files changed, commands, test results, timestamps, and build results.
   - Interpretation includes summaries, intent, decisions, assumptions, semantic impact, feature relationships, and remaining work.

3. **History belongs to the project, not to one AI vendor.**
   - Do not couple the core model to GitHub Copilot, Claude Code, Devin, Cursor, Codex, or another agent.
   - Agent-specific behavior belongs in adapters/integrations.

4. **The feature is a durable unit of history.**
   - A feature can span multiple prompts, sessions, Git commits, developers, and AI agents.
   - One session may contribute to multiple features.
   - Use a many-to-many relationship between sessions and feature-level AI commits.

5. **Capture should be low-friction and mostly automatic.**
   - Prefer lifecycle hooks, Git metadata, CI/test output, and structured agent events.
   - Avoid requiring developers to manually document every action.

6. **Local-first by default.**
   - Source code, prompts, diffs, and checkpoint metadata should remain local unless the user explicitly enables synchronization.
   - Do not assume data may be sent to an external service.

7. **Do not capture hidden chain-of-thought.**
   - Store observable actions, user requests, explicit decisions, structured summaries, and validation evidence.
   - Do not design features around collecting private model reasoning.

---

## Core terminology

### AI Session

Represents one coding-agent session.

An AI Session may contain:

- agent/provider
- model
- developer/user
- start/end timestamps
- session ID
- repository
- branch
- base Git state
- final Git state
- user prompts
- tool activity metadata
- changed files
- test/build evidence
- session summary

An AI Session answers:

> What did this agent session change?

---

### AI Commit

Represents one meaningful feature or development intention.

An AI Commit may include:

- title
- original user/business intent
- status
- contributors
- one or more AI Sessions
- one or more Git commits/ranges
- base and resulting Git states
- implemented behavior
- important decisions
- assumptions
- validations
- known issues
- remaining work
- dependencies on other AI Commits
- superseded or corrected decisions

An AI Commit answers:

> What happened while delivering this feature, and why?

Do not assume one prompt, one session, or one Git commit equals one AI Commit.

---

### AI Diff

AI Diff is generated from stored evidence and semantic metadata.

It may compare:

- session → session
- AI Commit → AI Commit
- feature → feature
- Git state → Git state
- release → release
- historical AI Commit → current repository

AI Diff should explain:

- intent changes
- behavior added/removed/modified
- architecture impact
- important decisions
- dependencies introduced or removed
- validation differences
- unresolved work
- risk/impact areas
- exact supporting Git evidence

AI Diff answers:

> What meaningfully changed between these two development states?

---

## Suggested architecture

Prefer a modular design similar to:

```text
packages/
  core/
    checkpoints/
    sessions/
    ai-commits/
    ai-diff/
    dependencies/

  git/
    refs/
    diff/
    repository-state/

  storage/
    sqlite/
    migrations/

  integrations/
    github-copilot/
    claude-code/
    generic/

  mcp/
    server/
    tools/

  cli/
    commands/

  shared/
    schemas/
    types/
```

Avoid unnecessary microservices for the initial implementation.

For the MVP, prefer:

- TypeScript
- Node.js
- Git CLI or a thin Git library
- SQLite
- schema validation
- MCP for agent interoperability

---

## Data-model requirements

Design for these relationships:

```text
Repository
  ├── AI Sessions
  ├── AI Commits
  └── Git states

AI Session <many-to-many> AI Commit

AI Commit <many-to-many> Git commits/ranges

AI Commit <many-to-many> AI Commit
  relation types may include:
  - depends_on
  - extends
  - supersedes
  - contradicts
  - caused_by
  - affects
```

Do not force a tree structure where a graph is required.

Every important semantic record should retain links back to deterministic evidence where possible.

---

## Checkpoint behavior

A checkpoint should preserve enough information to reconstruct what happened without copying the whole repository.

Prefer storing:

- checkpoint ID
- repository ID
- branch
- Git SHA/tree before
- Git SHA/tree after
- working-tree status when relevant
- changed-file list
- diff statistics
- relevant Git diff references
- related session
- related AI Commit
- validation evidence
- semantic summary

Hidden Git refs may be used for temporary/internal repository states if needed.

Do not pollute normal Git history with a commit for every small AI edit unless the user explicitly chooses that mode.

---

## Session capture

When integrating with an AI coding tool, capture lifecycle events where available.

Typical mapping:

```text
session start
  -> create AI Session
  -> capture base repository state

user prompt
  -> store or summarize user intent according to privacy settings

tool/file activity
  -> record lightweight observable metadata

agent stop/session end
  -> capture resulting repository state
  -> collect diff/test/build evidence
  -> generate semantic session summary
```

Heavy LLM analysis should not run after every file edit.

Keep synchronous hooks fast.

Perform expensive summarization at meaningful boundaries such as:

- session end
- feature completion
- explicit AI Commit creation
- requested AI Diff generation

---

## Privacy and security

Treat prompts, source code, diffs, architectural information, environment data, and test output as potentially sensitive.

Requirements:

- local-first storage
- configurable prompt retention
- redaction support
- secrets filtering
- no silent cloud upload
- explicit configuration for external LLM use
- clear separation between local evidence and remote analysis

Never store credentials or secrets intentionally.

---

## Validation

When Copilot makes code changes:

1. Understand the existing architecture before changing it.
2. Make the smallest coherent change that satisfies the current task.
3. Preserve existing APIs unless the task explicitly requires changing them.
4. Run relevant tests when practical.
5. Report failures instead of hiding them.
6. Do not mark work complete if validation is incomplete.
7. Distinguish:
   - implemented
   - validated
   - partially implemented
   - remaining
   - unknown

Do not claim a feature is complete solely because code was generated.

---

## MVP priorities

Prioritize in this order:

1. Repository detection and Git-state capture
2. AI Session recording
3. Feature-level AI Commit model
4. Session-to-feature association
5. Deterministic Git diff/evidence capture
6. Structured semantic summaries
7. `ai log`
8. `ai show`
9. `ai diff`
10. MCP retrieval for relevant project history

Later features may include:

- dependency graph
- cross-user/team synchronization
- IDE visualization
- CI/CD integration
- human approval records
- release-level AI Diff
- intent-aware rollback

Do not implement semantic rollback before the history/evidence model is reliable.

---

## CLI mental model

The product may expose commands inspired by Git, but it must not replace Git.

Potential commands:

```bash
ai status
ai log
ai show <id>
ai session show <id>
ai commit
ai diff <from> <to>
ai context "<task>"
```

Treat these as product concepts; do not introduce commands without corresponding stable domain behavior.

---

## AI Diff output quality

An AI Diff should not merely summarize `git diff`.

A useful AI Diff should separate:

### Intent
What requirement or requested behavior changed?

### Implementation
What meaningful components changed?

### Architecture
What structural decisions changed?

### Behavior
What user-visible or system behavior changed?

### Validation
What evidence verifies the change?

### Dependencies
What existing or future features are affected?

### Remaining work
What is incomplete or unresolved?

### Evidence
Which Git states, files, tests, sessions, or AI Commits support the explanation?

Avoid vague language such as "various improvements were made."

---

## Copilot behavior in this repository

When implementing a task:

- First inspect existing types, schemas, storage patterns, and tests.
- Reuse existing abstractions when appropriate.
- Do not invent a parallel architecture without a clear need.
- Keep core domain logic independent from agent-specific integrations.
- Place Copilot-, Claude-, or other vendor-specific code behind adapters.
- Prefer typed interfaces for integration boundaries.
- Keep Git operations deterministic and testable.
- Add tests for checkpoint identity, session/feature relationships, Git-state mapping, and AI Diff evidence.
- Avoid storing large raw blobs when a Git reference is sufficient.
- Preserve backwards compatibility in persisted schemas through migrations.
- Document important architectural decisions in code comments or project docs when the reason is not obvious.

When uncertain about a feature boundary, preserve the raw session evidence and avoid permanently assigning it to the wrong AI Commit automatically.

Human correction must always be possible.

---

## Key product question

Every feature should help answer at least one of these:

- What did this AI session change?
- Which feature did this work contribute to?
- Why does this code exist?
- What human request led to this change?
- What evidence shows the work was validated?
- What later work depends on this decision?
- What changed between these two feature states?
- What context does a new AI agent need before continuing this work?

If a proposed feature does not improve one of these capabilities, question whether it belongs in the core product.

---

## Product positioning

Do not describe this as:

- a Git replacement
- a generic AI memory tool
- a chat logger
- a Copilot-only plugin

The intended positioning is closer to:

> A vendor-neutral traceability and feature-history layer for AI-driven software development.

A useful shorthand is:

> Git remembers what changed. AI Commit preserves what the work meant. AI Diff explains how that meaning changed over time.
