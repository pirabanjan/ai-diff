# AIDIFF

AIDIFF is a vendor-neutral traceability layer for AI-driven software development.

It records repository state, local AI session evidence, and project metadata so that a user can understand what changed, why it changed, and what was validated.

## Phase 1 scope

This repository currently includes the MVP foundation required by the specification:

- Git repository detection
- local configuration generation
- SQLite initialization
- repository metadata bootstrap
- CLI commands: `ai init` and `ai status`

## Quick start

```bash
npm install
npm test
npx tsx src/cli.ts init
npx tsx src/cli.ts status
```

## Project principles

- Git remains the source of truth for code state.
- Local-first storage is default.
- Deterministic evidence is separated from AI interpretation.
- The core domain stays independent from any one AI vendor.

## Notes

This is the first implementation phase from the full specification and intentionally focuses on a reliable local foundation rather than later feature history or AI diff generation.
