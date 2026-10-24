# AIDIFF Customer Documentation

AIDIFF is a local-first traceability layer for AI-assisted software development. It helps teams preserve the connection between code changes, user intent, AI session context, validation, and feature-level history.

## What AIDIFF does

AIDIFF maintains a durable project record that answers:

- what changed
- why it changed
- which AI session or feature contributed to the change
- how the work was validated
- what remains unresolved

This makes it easier to review AI-generated work without losing trust in the underlying Git repository.

## Why it matters

Modern AI assistants often change code quickly, but the reasoning, intent, and validation trail can become fragmented. AIDIFF keeps that context attached to the repo so teams can review and understand work with confidence.

## Core principles

- Git remains the source of truth for code state.
- AI session and feature metadata stay local by default.
- Validation evidence is preserved alongside changes.
- History is vendor-neutral and portable.
- The system is designed for internal or customer-facing use without requiring cloud-only storage.

## Typical use cases

- review AI-assisted changes after a coding session
- track a feature across prompts, sessions, and commits
- compare development states across time
- understand which work was validated and which remains open
- support engineering governance and audit readiness

## Customer workflow

1. Install the CLI.
2. Initialize AIDIFF in a Git repository.
3. Start a session when the user begins a task.
4. Work with the AI assistant.
5. Finish the session with a validation-backed summary.
6. Use the local context and repository state to review, share, or hand off the work.

## Example

```bash
ai init
ai session start --provider generic --model local
ai session prompt "Add support for organization-scoped billing access"
# ... implement work and validate ...
ai session finish "Implemented organization-scoped billing access and verified the related tests pass"
ai context "add organization-scoped billing access"
```

## Security and privacy

AIDIFF is designed to be local-first. It stores project metadata in the repository instead of requiring external sync. This helps teams keep project traceability without exposing internal context to third-party systems unless explicitly configured.

## Package and deployment notes

The tool is packaged for installation via local package or global CLI install and is suitable for internal distribution to engineering teams and customer environments.

## Related docs

- [../README.md](../README.md)
- [../FULL_BUILD_SPEC.md](../FULL_BUILD_SPEC.md)
- [../docs/README.md](../docs/README.md)
