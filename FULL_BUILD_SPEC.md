# AI Commit / AI Diff — Full Build Specification

## 1. Project Overview

This repository implements an AI-native traceability and feature-history layer for software development.

The product is not a replacement for Git.

Git remains the source of truth for exact code state.

This project adds a higher-level history that connects:

- human intent,
- AI coding sessions,
- feature-level work,
- Git states,
- validation evidence,
- architectural decisions,
- feature dependencies,
- and semantic comparison between development states.

The core concepts are:

- **AI Session** — what happened during one coding-agent session.
- **AI Commit** — the durable feature/intention-level record of meaningful work.
- **AI Diff** — a semantic comparison between two sessions, AI commits, Git states, features, or releases.
- **AI Log** — the chronological feature history of a repository.
- **Checkpoint** — a deterministic repository state tied to a session or feature event.

The guiding principle is:

> Git remembers what changed. AI Commit preserves what the work meant. AI Diff explains how that meaning changed over time.

---

# 2. Problem Statement

Modern AI coding tools can modify dozens of files and thousands of lines in response to one user request.

Existing developer tooling can show:

- line changes,
- commits,
- branches,
- pull requests,
- build output,
- tests.

But it often does not preserve the full relationship between:

- the user's original request,
- the AI agent session that acted on it,
- the exact repository state before and after,
- important implementation decisions,
- what validation occurred,
- what remained incomplete,
- and which later features depend on the work.

The goal of this application is to create a vendor-neutral, project-level development history that works across AI coding tools.

---

# 3. Core Product Goals

The application must help answer:

1. What did this AI session change?
2. Which feature did this session contribute to?
3. What did the user ask the AI to do?
4. What exact Git state existed before and after?
5. What meaningful behavior changed?
6. What architectural decisions were introduced?
7. What tests or validation ran?
8. What remains incomplete?
9. What later features depend on this work?
10. What context should a new AI agent understand before continuing?
11. How did Feature A differ from Feature B?
12. How did the repository evolve between two releases?
13. What did multiple AI agents collectively do to deliver one feature?
14. What did multiple users contribute to the same feature?

---

# 4. Non-Goals for the MVP

Do not build the following in the first version:

- a replacement for Git,
- a new coding agent,
- a full IDE,
- a complex cloud control plane,
- semantic rollback,
- autonomous production deployment,
- a large vector database,
- enterprise SSO,
- team billing,
- advanced compliance dashboards,
- automatic architectural correctness guarantees,
- hidden chain-of-thought capture.

The MVP should be local-first and useful from the terminal.

---

# 5. Product Vocabulary

## 5.1 AI Session

An AI Session represents one coding-agent session.

Examples:

- one Claude Code session,
- one GitHub Copilot CLI session,
- one Devin task session,
- one Codex session,
- one generic custom-agent run.

An AI Session answers:

> What did this coding-agent session do?

### AI Session fields

- session ID
- repository ID
- agent provider
- agent model
- external session ID
- developer/user
- branch
- started time
- ended time
- base Git SHA
- final Git SHA
- base Git tree
- final Git tree
- user prompts
- changed files
- diff statistics
- tool-event metadata
- commands
- test/build evidence
- session summary
- status
- related checkpoints
- related AI Commits

### Suggested session statuses

- `active`
- `completed`
- `partial`
- `failed`
- `abandoned`
- `unknown`

---

## 5.2 AI Commit

An AI Commit is a durable feature-level development record.

It is NOT a Git commit.

One AI Commit may include:

- multiple prompts,
- multiple AI sessions,
- multiple Git commits,
- multiple developers,
- multiple AI agents,
- multiple days of work.

An AI Commit answers:

> What happened while delivering this feature or development intention?

### AI Commit fields

- AI Commit ID
- repository ID
- title
- description
- original intent
- normalized intent
- status
- created time
- completed time
- base Git state
- resulting Git state
- contributors
- linked sessions
- linked Git commits/ranges
- implemented behavior
- architectural decisions
- assumptions
- validation evidence
- known issues
- remaining work
- dependency relationships
- superseded decisions
- human approval status
- semantic summary
- supporting evidence references

### Suggested AI Commit statuses

- `proposed`
- `in_progress`
- `ready_for_review`
- `completed`
- `blocked`
- `superseded`
- `abandoned`

---

## 5.3 AI Diff

AI Diff is a semantic comparison between two recorded development states.

Supported comparisons:

- AI Session -> AI Session
- AI Commit -> AI Commit
- Git state -> Git state
- release -> release
- AI Commit -> current repository
- feature version -> feature version

An AI Diff answers:

> What meaningfully changed between these two development states?

### AI Diff categories

- Intent
- Behavior
- Implementation
- Architecture
- Data model
- Interfaces/API
- Dependencies
- Validation
- Risk/impact
- Remaining work
- Evidence

AI Diff should never be only an LLM summary of raw `git diff`.

It should combine deterministic evidence with semantic interpretation.

---

## 5.4 Checkpoint

A checkpoint records deterministic development state.

A checkpoint may be created:

- at session start,
- at session end,
- before a meaningful AI task,
- after a meaningful AI task,
- at AI Commit completion,
- at manual request.

A checkpoint should reference Git state instead of copying the full repository.

---

# 6. Product Mental Model

```text
Human request
    |
    v
AI Session
    |
    | edits / tools / tests
    v
Checkpoint(s)
    |
    v
AI Commit
    |
    | one or more sessions
    | one or more Git states
    v
AI Log
    |
    +--> AI Diff
    |
    +--> Context retrieval
    |
    +--> Dependency graph
```

---

# 7. Relationship Model

The application must support:

```text
Repository
  |-- AI Sessions
  |-- AI Commits
  |-- Checkpoints
  |-- Git states
  |-- Validation records
```

### Required many-to-many relationships

```text
AI Session <many-to-many> AI Commit

AI Commit <many-to-many> Git commit/range

AI Commit <many-to-many> AI Commit

AI Session <many-to-many> Checkpoint
```

### AI Commit relationship types

Support at least:

- `depends_on`
- `extends`
- `supersedes`
- `contradicts`
- `caused_by`
- `affects`
- `related_to`

Do not force this graph into a simple parent-child tree.

---

# 8. Evidence vs Interpretation

This distinction is mandatory.

## 8.1 Deterministic Evidence

Examples:

- Git SHA
- Git tree SHA
- branch
- changed files
- line stats
- Git diff
- commands executed
- test output
- build output
- timestamps
- external agent session ID
- user prompts if retention is enabled

## 8.2 AI Interpretation

Examples:

- intent summary
- architecture decision summary
- dependency inference
- impact summary
- remaining-work summary
- feature relationship suggestions
- risk explanation

AI interpretation must never silently replace factual evidence.

Every semantic record should link back to evidence where practical.

---

# 9. Local-First Requirements

The MVP must be local-first.

Default behavior:

- source code stays local,
- SQLite stays local,
- prompts stay local,
- Git history stays local,
- diffs stay local,
- no cloud synchronization unless explicitly configured.

No hidden uploads.

External LLM use must be opt-in and clearly configurable.

---

# 10. Suggested Technology Stack

Use a conservative stack.

## Runtime

- Node.js
- TypeScript

## Package management

- npm or pnpm

## Storage

- SQLite

## ORM / database layer

Choose one:

- Drizzle ORM
- Prisma

Prefer Drizzle if simplicity and local-first footprint are priorities.

## Git integration

Prefer either:

- direct Git subprocess calls,
- simple-git.

Do not reimplement Git.

## CLI

Use one:

- Commander
- oclif
- yargs

## Validation

Use:

- Zod

## Testing

Use one:

- Vitest
- Jest

Prefer Vitest for a lightweight TypeScript setup.

## MCP

Implement an MCP server after the core data layer and CLI are working.

---

# 11. Monorepo Structure

Recommended structure:

```text
packages/
  core/
    src/
      sessions/
      ai-commits/
      checkpoints/
      ai-diff/
      dependencies/
      context/

  git/
    src/
      repository/
      refs/
      diff/
      status/
      commits/

  storage/
    src/
      db/
      schema/
      repositories/
      migrations/

  cli/
    src/
      commands/
      output/

  integrations/
    src/
      github-copilot/
      claude-code/
      generic/

  mcp/
    src/
      server/
      tools/
      resources/

  shared/
    src/
      types/
      schemas/
      errors/
      utils/
```

The MVP may be implemented as one package first if that improves speed.

Do not create unnecessary microservices.

---

# 12. Database Schema

At minimum, implement these tables.

## 12.1 repositories

Fields:

- `id`
- `name`
- `root_path`
- `remote_url`
- `default_branch`
- `created_at`
- `updated_at`

---

## 12.2 sessions

Fields:

- `id`
- `repository_id`
- `provider`
- `model`
- `external_session_id`
- `developer`
- `branch`
- `base_sha`
- `final_sha`
- `base_tree_sha`
- `final_tree_sha`
- `status`
- `summary`
- `started_at`
- `ended_at`
- `created_at`
- `updated_at`

---

## 12.3 prompts

Fields:

- `id`
- `session_id`
- `sequence`
- `raw_text`
- `summary`
- `retention_mode`
- `created_at`

Prompt retention must be configurable.

---

## 12.4 checkpoints

Fields:

- `id`
- `repository_id`
- `session_id`
- `ai_commit_id`
- `type`
- `branch`
- `git_sha`
- `tree_sha`
- `working_tree_hash`
- `created_at`

Suggested checkpoint types:

- `session_start`
- `session_end`
- `feature_start`
- `feature_end`
- `manual`
- `intermediate`

---

## 12.5 changed_files

Fields:

- `id`
- `session_id`
- `path`
- `change_type`
- `insertions`
- `deletions`
- `old_path`
- `new_path`

Suggested change types:

- `added`
- `modified`
- `deleted`
- `renamed`
- `copied`
- `unknown`

---

## 12.6 ai_commits

Fields:

- `id`
- `repository_id`
- `title`
- `description`
- `original_intent`
- `normalized_intent`
- `status`
- `base_sha`
- `result_sha`
- `semantic_summary`
- `human_approval_status`
- `created_at`
- `completed_at`
- `updated_at`

---

## 12.7 ai_commit_sessions

Many-to-many table.

Fields:

- `ai_commit_id`
- `session_id`
- `contribution_summary`
- `created_at`

---

## 12.8 ai_commit_git_ranges

Fields:

- `id`
- `ai_commit_id`
- `from_sha`
- `to_sha`
- `branch`
- `created_at`

---

## 12.9 decisions

Fields:

- `id`
- `ai_commit_id`
- `session_id`
- `title`
- `description`
- `status`
- `evidence_ref`
- `created_at`

Suggested decision status:

- `active`
- `superseded`
- `rejected`

---

## 12.10 assumptions

Fields:

- `id`
- `ai_commit_id`
- `session_id`
- `description`
- `evidence_ref`
- `created_at`

---

## 12.11 validations

Fields:

- `id`
- `repository_id`
- `session_id`
- `ai_commit_id`
- `type`
- `command`
- `status`
- `summary`
- `raw_output_path`
- `started_at`
- `ended_at`

Suggested validation types:

- `test`
- `build`
- `lint`
- `typecheck`
- `security`
- `review`
- `manual`

Suggested validation statuses:

- `passed`
- `failed`
- `partial`
- `not_run`
- `unknown`

---

## 12.12 remaining_work

Fields:

- `id`
- `ai_commit_id`
- `description`
- `status`
- `created_at`
- `resolved_at`

---

## 12.13 known_issues

Fields:

- `id`
- `ai_commit_id`
- `description`
- `severity`
- `status`
- `created_at`

---

## 12.14 ai_commit_relations

Fields:

- `id`
- `source_ai_commit_id`
- `target_ai_commit_id`
- `relation_type`
- `confidence`
- `evidence_ref`
- `created_at`

---

## 12.15 session_events

Fields:

- `id`
- `session_id`
- `event_type`
- `sequence`
- `payload_json`
- `created_at`

Use this for generic agent lifecycle events.

---

# 13. Core TypeScript Interfaces

Implement strongly typed domain models.

Example:

```ts
export interface AiSession {
  id: string;
  repositoryId: string;
  provider: string;
  model?: string;
  externalSessionId?: string;
  developer?: string;
  branch: string;
  baseSha: string;
  finalSha?: string;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  summary?: string;
}
```

```ts
export interface AiCommit {
  id: string;
  repositoryId: string;
  title: string;
  description?: string;
  originalIntent?: string;
  normalizedIntent?: string;
  status: AiCommitStatus;
  baseSha?: string;
  resultSha?: string;
  semanticSummary?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

```ts
export interface AiDiffResult {
  from: DiffTarget;
  to: DiffTarget;

  intent: DiffSection;
  implementation: DiffSection;
  architecture: DiffSection;
  behavior: DiffSection;
  dependencies: DiffSection;
  validation: DiffSection;
  remainingWork: DiffSection;
  evidence: EvidenceReference[];
}
```

---

# 14. Git Layer Requirements

Implement the following Git capabilities.

## Required Git operations

- detect Git repository root
- get current branch
- get current HEAD SHA
- get tree SHA
- get working-tree status
- get changed-file list
- get diff stats
- get full diff
- compare two Git states
- list commits between two SHAs
- get commit metadata
- detect uncommitted changes
- optionally create hidden refs
- resolve tags/releases to SHAs

### Hidden refs

If checkpoints need stable internal references, use a namespace such as:

```text
refs/ai-history/<checkpoint-id>
```

Do not pollute normal commit history by default.

---

# 15. Working Tree Handling

The system must handle:

- clean repository
- staged changes
- unstaged changes
- untracked files

For the MVP, do not silently modify developer state.

When capturing a checkpoint:

- record HEAD SHA,
- record current status,
- optionally compute a working-tree hash,
- store changed-file evidence,
- do not auto-commit unless explicitly configured.

---

# 16. AI Session Lifecycle

Implement these actions:

## 16.1 Start session

On session start:

1. detect repository
2. detect branch
3. capture HEAD SHA
4. capture Git tree
5. capture working-tree state
6. create session record
7. create `session_start` checkpoint

---

## 16.2 Record prompt

When a user prompt arrives:

1. attach to session
2. preserve sequence
3. obey prompt-retention setting
4. optionally create semantic summary

---

## 16.3 Record tool events

Capture lightweight observable metadata.

Examples:

- file modified
- command executed
- test command executed
- build command executed
- external tool call

Do not perform heavy semantic analysis on each event.

---

## 16.4 Finish session

On session end:

1. capture final Git SHA
2. capture working-tree state
3. calculate changed files
4. calculate diff stats
5. capture validation evidence
6. generate session summary
7. create `session_end` checkpoint
8. update session status

---

# 17. AI Commit Lifecycle

## 17.1 Create AI Commit

Support:

```bash
ai commit create
```

Prompt user for:

- title
- intent
- optional description

Allow linking one or more existing sessions.

---

## 17.2 Attach session to AI Commit

Support:

```bash
ai commit add-session <ai-commit-id> <session-id>
```

One session may belong to multiple AI Commits.

---

## 17.3 Complete AI Commit

Support:

```bash
ai commit complete <id>
```

Before completion:

- summarize linked sessions
- calculate aggregate Git range
- aggregate changed files
- aggregate validation
- show remaining work
- show known issues
- show decisions
- ask for explicit confirmation

---

## 17.4 AI Commit preview

Before completion show:

```text
AI Commit Preview

Feature:
Add MFA

Linked sessions:
3

Git range:
abc123 -> def456

Files affected:
18

Implemented:
- TOTP enrollment
- verification flow
- recovery codes

Validation:
- 418 tests passed

Remaining:
- admin reset flow

Known issues:
- none
```

---

# 18. AI Log

Implement:

```bash
ai log
```

Output:

```text
AI-104  Authentication
AI-112  MFA
AI-121  Organization RBAC
AI-128  Enterprise Billing
```

Support filters:

```bash
ai log --status completed
ai log --agent claude
ai log --developer alice
ai log --since 30d
```

---

# 19. AI Show

Implement:

```bash
ai show <id>
```

For an AI Commit, show:

- title
- intent
- status
- contributors
- AI agents
- linked sessions
- Git range
- changed files
- decisions
- assumptions
- validation
- dependencies
- remaining work
- known issues
- semantic summary

For a session:

```bash
ai session show <id>
```

Show:

- provider
- model
- prompts
- base/final Git state
- changed files
- commands
- validation
- summary
- linked AI Commits

---

# 20. AI Diff

Implement:

```bash
ai diff <from> <to>
```

Targets may be:

- AI Commit ID
- Session ID
- Git SHA
- Git tag

Examples:

```bash
ai diff AI-104 AI-121
ai diff SESSION-10 SESSION-18
ai diff git:v1.2 git:v1.3
```

## AI Diff flow

1. resolve both targets
2. retrieve deterministic evidence
3. calculate Git differences
4. retrieve session/feature metadata
5. produce structured semantic comparison
6. include confidence and evidence references

## AI Diff output

```text
AI Diff
AI-104 -> AI-121

Intent
- Added organization-scoped authorization

Behavior
- Introduced organization roles
- Restricted admin APIs by organization

Architecture
- Added permission service
- Moved authorization checks server-side

Dependencies
- Organization membership introduced

Validation
- 34 new tests
- Integration suite passed

Remaining work
- Admin role-management UI

Evidence
- Git abc123..def456
- Sessions S-44, S-45
- Tests auth-rbac.integration.test.ts
```

---

# 21. Context Retrieval

Implement:

```bash
ai context "<task>"
```

Example:

```bash
ai context "modify authentication to support organizations"
```

Return:

- relevant AI Commits
- relevant sessions
- important decisions
- dependencies
- known issues
- unresolved work
- relevant files
- current Git state

The MVP may use:

- keyword search,
- file overlap,
- path overlap,
- recent-history ranking.

Do not require embeddings in the first version.

---

# 22. MCP Server

After CLI/core works, implement:

```bash
ai mcp
```

Expose tools:

- `get_ai_commit`
- `list_ai_commits`
- `get_session`
- `search_history`
- `get_relevant_context`
- `get_ai_diff`
- `get_dependencies`
- `get_validation`
- `get_current_status`

MCP should make the project history accessible to supported AI coding agents.

---

# 23. Integration Architecture

Agent-specific integrations must be thin adapters.

Core logic must not depend directly on:

- GitHub Copilot
- Claude Code
- Devin
- Cursor
- Codex

Define a generic integration interface.

Example:

```ts
export interface AgentAdapter {
  onSessionStart(event: AgentSessionStartEvent): Promise<void>;
  onPrompt(event: AgentPromptEvent): Promise<void>;
  onToolEvent(event: AgentToolEvent): Promise<void>;
  onSessionEnd(event: AgentSessionEndEvent): Promise<void>;
}
```

---

# 24. GitHub Copilot Integration

Use lifecycle hooks where available.

Typical mapping:

```text
sessionStart
  -> start AI Session

userPromptSubmitted
  -> record prompt

postToolUse
  -> record lightweight activity

agentStop
  -> calculate current state

sessionEnd
  -> finalize AI Session
```

Keep hook execution fast.

Heavy semantic summarization should occur after session completion.

---

# 25. Claude Code Integration

Use lifecycle hooks where available.

Typical mapping:

```text
SessionStart
  -> start AI Session

UserPromptSubmit
  -> record prompt

PostToolUse
  -> record lightweight event

Stop
  -> capture state

SessionEnd
  -> finalize session

PreCompact
  -> optionally persist summary checkpoint
```

Claude's internal checkpoint/rewind system is separate from this product.

This application records project-level history.

---

# 26. Generic Integration

Support manual or generic event ingestion.

Provide:

```bash
ai session start --provider generic
ai session prompt "<text>"
ai session event ...
ai session finish
```

This allows integration with unsupported tools.

---

# 27. Privacy Controls

Add configuration file:

```text
.ai-history/config.json
```

Suggested settings:

```json
{
  "promptRetention": "summary",
  "storeRawDiffs": false,
  "externalLlmEnabled": false,
  "redactSecrets": true,
  "localOnly": true
}
```

### Prompt retention modes

- `none`
- `summary`
- `full`

Default: `summary`

---

# 28. Secrets Redaction

Implement basic secret detection before storing prompt or output text.

At minimum detect common patterns:

- API keys
- bearer tokens
- private keys
- AWS keys
- GitHub tokens
- common credential env vars

Do not claim perfect secret detection.

---

# 29. Semantic Summarization

Provide a provider-agnostic summarization interface.

```ts
export interface SemanticAnalyzer {
  summarizeSession(input: SessionEvidence): Promise<SessionSummary>;
  summarizeAiCommit(input: AiCommitEvidence): Promise<AiCommitSummary>;
  compare(input: DiffEvidence): Promise<AiDiffResult>;
}
```

The core application must work even if no external LLM is configured.

Fallback behavior:

- deterministic summaries,
- diff statistics,
- file-level grouping,
- validation summaries.

---

# 30. Human Review

Semantic metadata must be editable.

Support commands such as:

```bash
ai commit edit <id>
ai decision edit <id>
ai relation add ...
ai relation remove ...
```

Human correction must override automatic inference.

---

# 31. Validation Collection

Collect validation from:

- explicit commands,
- integration hooks,
- user-provided evidence.

For known package ecosystems, detect common commands:

- `npm test`
- `npm run build`
- `npm run lint`
- `pnpm test`
- `pytest`
- `cargo test`
- `go test`
- `mvn test`
- `gradle test`

Do not run arbitrary commands automatically without user configuration.

---

# 32. CLI Commands

Implement the following MVP command set.

## Repository

```bash
ai init
ai status
```

## Session

```bash
ai session start
ai session finish
ai session list
ai session show <id>
```

## AI Commit

```bash
ai commit create
ai commit list
ai commit show <id>
ai commit add-session <commit-id> <session-id>
ai commit complete <id>
ai commit edit <id>
```

## History

```bash
ai log
ai show <id>
```

## Diff

```bash
ai diff <from> <to>
```

## Context

```bash
ai context "<task>"
```

## MCP

```bash
ai mcp
```

---

# 33. `ai init`

`ai init` should:

1. verify Git repository
2. create local application directory
3. create SQLite DB
4. create config file
5. save repository metadata
6. run migrations
7. print next steps

Suggested local directory:

```text
.ai-history/
  config.json
  history.db
  cache/
  logs/
```

Add `.ai-history/` to `.gitignore` by default unless user chooses shared metadata mode later.

---

# 34. `ai status`

Output example:

```text
Repository:
payments-platform

Branch:
feature/mfa

Git:
abc123

Working tree:
7 modified files

Active AI Session:
S-104

Active AI Commit:
AI-42 Add MFA

Sessions linked:
3

Validation:
Tests last passed 12 minutes ago
```

---

# 35. Error Handling

Use typed errors.

Examples:

- repository not found
- Git command failed
- invalid target
- session already active
- AI Commit not found
- database migration failed
- conflicting relationship
- invalid state transition

CLI errors should be actionable and concise.

---

# 36. State Transitions

## Session

```text
active
  -> completed
  -> partial
  -> failed
  -> abandoned
```

## AI Commit

```text
proposed
  -> in_progress
  -> ready_for_review
  -> completed

proposed/in_progress
  -> blocked

any non-completed
  -> abandoned

completed
  -> superseded
```

Enforce valid transitions.

---

# 37. Search

Implement basic search across:

- AI Commit title
- intent
- summary
- decisions
- remaining work
- known issues
- session summaries
- prompts if retention allows

Command:

```bash
ai search "authentication"
```

---

# 38. Dependency Graph

Implement storage and CLI support first.

Commands:

```bash
ai relation add AI-10 depends_on AI-4
ai relation list AI-10
```

Visualization is not required in the MVP.

---

# 39. Release-Level AI Diff

Optional after MVP core.

Allow:

```bash
ai diff git:v1.2 git:v1.3
```

Aggregate all AI Commits and sessions whose Git ranges intersect the release interval.

Produce:

- features added
- behavior removed
- architecture changes
- validation changes
- unresolved issues
- high-impact areas

---

# 40. Acceptance Criteria for MVP

The MVP is successful if a developer can:

1. initialize the tool in a Git repo,
2. start a session,
3. record one or more prompts,
4. finish the session,
5. see exact Git before/after state,
6. see changed files and diff stats,
7. create an AI Commit,
8. attach multiple sessions to one AI Commit,
9. list AI Commits,
10. inspect one AI Commit,
11. compare two AI Commits with `ai diff`,
12. retrieve relevant project history with `ai context`,
13. use the app without any external cloud service,
14. access history through MCP.

---

# 41. Test Plan

## Unit tests

Test:

- session state transitions
- AI Commit state transitions
- many-to-many relationships
- Git SHA resolution
- diff stats parsing
- relation validation
- privacy config
- secret redaction
- prompt retention
- AI Diff target resolution

## Integration tests

Use temporary Git repositories.

Test:

- repository initialization
- session start/end
- dirty working tree
- changed-file detection
- multiple sessions attached to one AI Commit
- one session attached to multiple AI Commits
- Git range resolution
- release diff resolution
- SQLite migrations

## CLI tests

Test command output for:

- `ai init`
- `ai status`
- `ai log`
- `ai show`
- `ai diff`
- `ai context`

## MCP tests

Test:

- list AI Commits
- get session
- search history
- get relevant context
- AI Diff retrieval

---

# 42. Sample End-to-End Scenario

## Step 1

Developer runs:

```bash
ai init
```

---

## Step 2

Copilot or Claude adapter starts session:

```text
Session S-100
Provider: Claude Code
Base SHA: abc123
```

---

## Step 3

User asks:

```text
Add MFA using authenticator apps.
```

Prompt recorded.

---

## Step 4

Agent edits 18 files and runs tests.

Session evidence records:

```text
18 files changed
+1432
-281
418 tests passed
```

---

## Step 5

Session ends.

The application creates:

```text
Session S-100 completed
Final SHA: def456
```

---

## Step 6

Developer creates:

```bash
ai commit create
```

Title:

```text
Add MFA
```

Then:

```bash
ai commit add-session AI-42 S-100
```

---

## Step 7

Next day another developer uses Copilot.

Session S-108 adds recovery codes.

Attach it:

```bash
ai commit add-session AI-42 S-108
```

---

## Step 8

Complete feature:

```bash
ai commit complete AI-42
```

Result:

```text
AI-42 Add MFA

Sessions:
S-100
S-108

Git:
abc123 -> xyz789

Implemented:
- TOTP enrollment
- MFA challenge
- recovery codes

Validation:
418 tests passed

Remaining:
admin reset flow
```

---

## Step 9

Later:

```bash
ai diff AI-17 AI-42
```

Output explains:

```text
Authentication -> MFA

Intent:
Added second-factor authentication.

Behavior:
Added enrollment and verification.

Architecture:
Extended existing auth service.

Dependencies:
MFA depends on Authentication.

Validation:
34 new tests.
```

---

# 43. Implementation Phases

## Phase 1 — Foundation

Build:

- repository detection
- config
- SQLite
- migrations
- types
- core errors
- `ai init`
- `ai status`

Acceptance:

Tool initializes cleanly in a Git repo.

---

## Phase 2 — Git Evidence Layer

Build:

- current SHA
- branch
- tree SHA
- working-tree status
- changed files
- diff stats
- commit range resolver

Acceptance:

Tool can compare two repository states deterministically.

---

## Phase 3 — AI Sessions

Build:

- session schema
- start
- prompt recording
- finish
- list/show

Acceptance:

A session records repo-before and repo-after evidence.

---

## Phase 4 — AI Commits

Build:

- AI Commit schema
- create/edit/complete
- session linking
- Git range aggregation
- show/log

Acceptance:

Multiple sessions can contribute to one AI Commit.

---

## Phase 5 — AI Diff

Build:

- target resolver
- deterministic diff
- structured comparison
- fallback no-LLM mode

Acceptance:

Two AI Commits can be compared meaningfully.

---

## Phase 6 — Context Retrieval

Build:

- search
- relevance scoring
- task-based context generation

Acceptance:

A fresh agent can retrieve relevant history for a task.

---

## Phase 7 — MCP

Build:

- MCP server
- core tools
- history access

Acceptance:

An MCP-compatible agent can query project history.

---

## Phase 8 — Agent Adapters

Build first:

- GitHub Copilot adapter
- Claude Code adapter

Then:

- generic adapter
- additional tools later

Acceptance:

Sessions can be recorded automatically from agent lifecycle events.

---

# 44. Coding Standards

- Use TypeScript strict mode.
- Avoid `any` unless justified.
- Use domain-specific types.
- Use Zod at external boundaries.
- Keep business logic out of CLI handlers.
- Keep database logic behind repositories/services.
- Keep Git logic isolated in the Git package.
- Keep vendor-specific code isolated in adapters.
- Write tests for every state transition.
- Keep functions small and explicit.
- Prefer composition over deep inheritance.
- Avoid unnecessary abstractions before use cases exist.

---

# 45. Documentation Requirements

Create:

- `README.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/data-model.md`
- `docs/cli.md`
- `docs/integrations.md`
- `docs/privacy.md`

README should include:

- what problem this solves
- key concepts
- quick start
- example AI Session
- example AI Commit
- example AI Diff
- local-first/privacy explanation

---

# 46. README Positioning

Do not describe the product as:

- Git replacement
- AI chat logger
- Copilot plugin only
- generic AI memory

Preferred positioning:

> A vendor-neutral traceability and feature-history layer for AI-driven software development.

Short version:

> Git remembers what changed. AI Commit preserves what the work meant. AI Diff explains how that meaning changed over time.

---

# 47. Product UX Principles

The developer should not have to manually document everything.

Prefer:

- automatic capture,
- reviewable summaries,
- editable metadata,
- clear evidence,
- low latency,
- local storage,
- no surprise background behavior.

The app should feel like infrastructure, not bureaucracy.

---

# 48. Critical Design Constraints

1. Do not assume one session equals one feature.
2. Do not assume one prompt equals one feature.
3. Do not assume one Git commit equals one AI Commit.
4. Do not force features into a tree.
5. Do not treat LLM summaries as factual truth.
6. Do not upload source code by default.
7. Do not block coding-agent workflows with expensive hook processing.
8. Do not capture hidden model reasoning.
9. Do not silently rewrite Git history.
10. Do not make cloud services mandatory.

---

# 49. Future Features

After the MVP is reliable, consider:

- web UI
- VS Code extension
- team synchronization
- PR integration
- release dashboards
- architecture dependency visualization
- risk scoring
- human approval workflows
- policy enforcement
- enterprise audit export
- CI/CD integration
- semantic rollback
- intent-aware repair
- feature impact analysis
- historical architecture queries
- cross-repository AI Commits

---

# 50. Suggested First Copilot Build Prompt

Use this prompt after adding this specification to the repository:

```text
Build the MVP foundation described in FULL_BUILD_SPEC.md.

Start with Phase 1 only.

Requirements:
- TypeScript
- Node.js
- strict mode
- SQLite
- Zod
- Vitest
- CLI named `ai`
- repository detection
- config file
- database initialization
- migrations
- `ai init`
- `ai status`

Do not implement later phases yet.

Create tests for all Phase 1 behavior.

At the end:
1. run tests,
2. run typecheck,
3. summarize files created,
4. list any assumptions,
5. list the exact next Phase 2 tasks.
```

---

# 51. Suggested Phase 2 Prompt

```text
Implement Phase 2 from FULL_BUILD_SPEC.md.

Add the Git evidence layer:
- current branch
- HEAD SHA
- tree SHA
- working-tree status
- changed-file list
- diff statistics
- compare two SHAs
- resolve commit ranges

Keep Git logic isolated from CLI code.

Add unit and integration tests using temporary Git repositories.

At the end:
1. run tests,
2. run typecheck,
3. summarize implementation,
4. list any limitations.
```

---

# 52. Suggested Phase 3 Prompt

```text
Implement Phase 3 from FULL_BUILD_SPEC.md.

Add AI Sessions:
- database schema
- domain model
- session start
- prompt recording
- session finish
- changed-file aggregation
- repo before/after evidence
- `ai session start`
- `ai session finish`
- `ai session list`
- `ai session show`

Support prompt-retention modes:
- none
- summary
- full

Add tests for lifecycle and state transitions.
```

---

# 53. Suggested Phase 4 Prompt

```text
Implement Phase 4 from FULL_BUILD_SPEC.md.

Add AI Commits:
- create
- edit
- list
- show
- complete
- link sessions
- many-to-many session relationship
- aggregate Git ranges
- decisions
- assumptions
- remaining work
- known issues

Commands:
- ai commit create
- ai commit list
- ai commit show
- ai commit add-session
- ai commit complete

Add tests for:
- multiple sessions per AI Commit
- one session in multiple AI Commits
- valid/invalid state transitions
```

---

# 54. Suggested Phase 5 Prompt

```text
Implement Phase 5 from FULL_BUILD_SPEC.md.

Add AI Diff.

Requirements:
- compare AI Commit to AI Commit
- compare Session to Session
- compare Git SHA to Git SHA
- deterministic evidence first
- no external LLM required
- structured output sections:
  intent
  implementation
  architecture
  behavior
  dependencies
  validation
  remaining work
  evidence

Command:
ai diff <from> <to>

Add comprehensive tests.
```

---

# 55. Suggested Phase 6 Prompt

```text
Implement Phase 6 from FULL_BUILD_SPEC.md.

Add project-history search and task-based context retrieval.

Commands:
- ai search "<query>"
- ai context "<task>"

MVP relevance ranking should use:
- text matches
- changed-file overlap
- path overlap
- dependency relationships
- recency

Do not add embeddings yet.
```

---

# 56. Suggested Phase 7 Prompt

```text
Implement Phase 7 from FULL_BUILD_SPEC.md.

Add an MCP server.

Expose:
- get_ai_commit
- list_ai_commits
- get_session
- search_history
- get_relevant_context
- get_ai_diff
- get_dependencies
- get_validation
- get_current_status

Add tests for MCP tool behavior.
```

---

# 57. Suggested Phase 8 Prompt

```text
Implement Phase 8 from FULL_BUILD_SPEC.md.

Create agent adapters using the existing generic adapter interface.

Start with:
1. GitHub Copilot
2. Claude Code

Map lifecycle events to:
- session start
- prompt capture
- lightweight tool events
- session finish

Keep hooks fast.
Do not perform heavy semantic analysis synchronously.
```

---

# 58. Definition of Done

The MVP is complete when:

- all Phase 1–8 tests pass,
- CLI is usable locally,
- sessions are captured,
- AI Commits work,
- AI Diff works,
- project context retrieval works,
- MCP works,
- at least Copilot and Claude integrations exist,
- no cloud dependency is required,
- README and architecture docs are complete.

---

# 59. Final Product Principle

Every implementation decision should support this core idea:

> The project should preserve the relationship between human intent, AI activity, repository state, validation, and feature evolution in a way that is independent of any single coding agent.
