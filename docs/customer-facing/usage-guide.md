# AIDIFF Usage Guide

This guide shows how to use AIDIFF in a normal engineering workflow.

## Initialize a repo

```bash
cd /path/to/project
ai init
```

## Check repository state

```bash
ai status
```

## Start a session

```bash
ai session start --provider generic --model local
ai session prompt "Investigate and fix the failing checkout flow"
```

## Make changes

After changes are made, run the relevant checks:

```bash
npm test
npm run build
```

## Finish the session

```bash
ai session finish "Fixed the checkout flow and verified the relevant tests pass"
ai context "fix checkout flow"
```

## Review findings

Use local evidence to review:
- what changed
- what intent was captured
- which files are relevant
- what validation was performed
- what remains open
