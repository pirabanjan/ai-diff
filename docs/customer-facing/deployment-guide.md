# AIDIFF Deployment Guide

This guide explains how to install, initialize, and use AIDIFF in customer or internal environments.

## Installation

Use the bundled installer or a local package install:

```bash
chmod +x install.sh
./install.sh --global
```

On Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Global
```

## Basic setup

```bash
cd /path/to/project
git init
ai init
ai status
```

## Start a session

```bash
ai session start --provider generic --model local
ai session prompt "<user request>"
```

## Validation

Before finishing, run the relevant checks:

```bash
npm test
npm run build
npm run typecheck
```

## Complete a session

```bash
ai session finish "<summary of outcome and validation>"
ai status
ai context "<task summary>"
```

## Operational notes

- keep the repo local and private by default
- prefer Git-based evidence over AI narration
- use built-in validation commands when available
- keep session summaries brief and reviewable

## Support notes

For internal deployment, ensure that the target environment has a supported Node version and Git installed.
