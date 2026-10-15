# AIDIFF

AIDIFF is a vendor-neutral traceability and feature-history layer for AI-driven software development.

Git remembers what changed. AI Commit preserves what the work meant. AI Diff explains how that meaning changed over time.

AIDIFF keeps a local project history that ties together:

- Git state and repo metadata
- AI session records
- AI commit summaries and relationships
- Diff evidence and validation notes
- Context retrieval for future work
- MCP access for supported AI agents

## Why this exists

AI-generated changes are often hard to understand later because the code state, intent, and validation history are disconnected. AIDIFF gives a project local, reviewable evidence of what an AI session tried to do and how it evolved.

## Installation

### Option 1: use the bundled installer scripts

From the repo root:

```bash
chmod +x install.sh
./install.sh --global
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Global
```

### Option 2: install globally from a local package

```bash
npm install
npm pack
npm install -g ./aidiff-0.1.0.tgz
```

### Option 3: install directly from a Git repo

```bash
git clone <your-repo-url>
cd aidiff
npm install
npm run build
npm install -g .
```

### Option 4: use the package without a global install

```bash
npm install
npx ai --help
```

## Usage in any Git repository

After installing the CLI, go to any repository you want to track:

```bash
cd /path/to/your/project
ai init
ai status
```

This creates a local metadata directory:

```bash
.git/ai-history/
```

The app stores its database and config locally within the project, so nothing is uploaded by default.

## Core commands

```bash
ai init
ai status
ai context "modify authentication to support organizations"
ai session start --provider generic --model local
ai session prompt "Investigate SSO setup"
ai session finish "Completed investigation"
```

### Session lifecycle

```bash
ai session start
ai session prompt "Review the auth service"
ai session finish "Auth review complete"
ai session list
ai session show <session-id>
```

### Context retrieval

```bash
ai context "add organization auth support"
```

This returns a ranked view of:

- relevant AI Commits
- relevant sessions
- decisions and dependencies
- known issues
- unresolved work
- relevant files
- current Git state

### MCP access

```bash
ai mcp
```

The MCP server exposes tools including:

- `get_ai_commit`
- `list_ai_commits`
- `get_session`
- `search_history`
- `get_relevant_context`
- `get_ai_diff`
- `get_dependencies`
- `get_validation`
- `get_current_status`

## Example workflow

```bash
mkdir demo-app
cd demo-app
git init
git config user.name "Your Name"
git config user.email "you@example.com"

echo "# Demo app" > README.md
git add README.md
git commit -m "initial commit"

ai init
ai status
ai session start --provider generic --model local
ai session prompt "Add an admin-only billing view"
ai session finish "Billing view implemented"
ai context "add admin billing view"
```

## Privacy and local-first design

AIDIFF is designed to be local-first and vendor-neutral:

- metadata is stored under the repo's `.ai-history` directory
- raw prompts are not required to be uploaded anywhere
- retention is configurable
- Git remains the source of truth for code changes
- no external cloud service is required

## Production packaging notes

This package is structured for customer distribution:

- CLI binary is exposed via `bin.ai`
- compiled output is built into `dist/`
- packaging is driven by `npm pack` and `npm install -g`
- install flow works outside the source repository

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

### Repository not initialized

```bash
ai init
```

## Support

This project is intended for local developer workflow and customer-facing internal distribution. For production deployment, update the package metadata to your real GitHub/org URLs before publishing.
