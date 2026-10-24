# AIDIFF

AIDIFF is a local-first traceability layer for AI-assisted software development.

It connects Git history, AI session activity, feature intent, validation evidence, and repository context in one place so engineering teams can understand not just what changed, but why it changed and how it was validated.

## Why teams use AIDIFF

AI coding tools are fast, but they often leave behind fragmented context:

- code changed without a durable explanation
- validation evidence is lost
- feature intent is not tied to repository state
- sessions are hard to review or hand off
- future work cannot easily understand prior decisions

AIDIFF fixes that by keeping the history local, reviewable, and grounded in the repo itself.

## What AIDIFF captures

AIDIFF preserves:

- repository metadata and Git state
- AI session records and prompts
- feature-level AI commit summaries
- change context and diff evidence
- validation and follow-up work
- relevant history for future tasks

This makes it easier to review, trace, and continue work without losing context.

## Core principles

- Git remains the source of truth for code.
- AI-generated summaries are treated as interpretation, not ground truth.
- Metadata stays local by default.
- History remains vendor-neutral and portable.
- The workflow is designed for real engineering teams, not just experimentation.

## Quick start

### Install

From the repo root:

```bash
chmod +x install.sh
./install.sh --global
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Global
```

Alternative package install:

```bash
npm install
npm pack
npm install -g ./aidiff-0.1.0.tgz
```

### Use it in any Git repository

```bash
cd /path/to/your/project
ai init
ai status
```

This creates a local metadata directory under the repository, typically:

```bash
.git/ai-history/
```

### Session workflow

```bash
ai session start --provider generic --model local
ai session prompt "Investigate and fix the checkout flow"
# work on the repo
ai session finish "Fixed the checkout flow and validated the relevant checks pass"
ai context "fix checkout flow"
```

### Common commands

```bash
ai init
ai status
ai context "add organization auth support"
ai session start --provider generic --model local
ai session prompt "Review the auth service"
ai session finish "Auth review complete"
ai mcp
```

## AI service integration

This repository includes instruction files for different AI tools and workflows.

- GitHub Copilot: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- GitHub Copilot Enterprise: [GITHUB_COPILOT_ENTERPRISE.md](GITHUB_COPILOT_ENTERPRISE.md)
- Claude Code: [CLAUDE.md](CLAUDE.md)
- Claude system prompt: [CLAUDE_SYSTEM_PROMPT.md](CLAUDE_SYSTEM_PROMPT.md)
- Devin: [DEVIN.md](DEVIN.md)
- Cursor / Codex-style rules: [.cursor/rules/aidiff.mdc](.cursor/rules/aidiff.mdc)
- Codex instructions: [CODEX_INSTRUCTIONS.md](CODEX_INSTRUCTIONS.md)
- Generic agent instructions: [AGENTS.md](AGENTS.md)
- Universal master template: [AI_SESSION_MASTER_TEMPLATE.md](AI_SESSION_MASTER_TEMPLATE.md)

Use the file that matches the AI platform you are using, or the master template for a vendor-neutral default.

## Documentation map

- [docs/README.md](docs/README.md) — documentation index
- [docs/agent-guides/README.md](docs/agent-guides/README.md) — AI tool-specific instruction guides
- [docs/customer-facing/README.md](docs/customer-facing/README.md) — customer-facing overview and rollout guidance
- [FULL_BUILD_SPEC.md](FULL_BUILD_SPEC.md) — full project specification and build requirements

## Security and privacy

AIDIFF is built for local-first operation:

- metadata stays local unless the user explicitly opts into external sharing
- Git remains the canonical source of truth for code changes
- AI summaries do not replace repository evidence
- the workflow is designed for internal and customer-facing environments without forcing a cloud-only model

## Production packaging

The package is structured for distribution and installation in real environments:

- CLI binary exposed via the `ai` command
- compiled output generated under `dist/`
- install flow supports local or global installation
- packaged for customer or team distribution outside the repo source tree

## Troubleshooting

### `ai` is not found

```bash
npm install -g ./aidiff-0.1.0.tgz
which ai
ai --help
```

### Not a Git repository

```bash
git init
ai init
```

### Repo not initialized

```bash
ai init
```

## Support

This project is intended for internal engineering workflows and customer-facing deployment where local traceability and reviewability matter.

For production usage, update package metadata and repository URLs before public publishing.
