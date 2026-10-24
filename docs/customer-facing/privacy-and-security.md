# AIDIFF Privacy and Security

AIDIFF is designed to be local-first and transparent.

## Privacy model

- metadata stays within the repository by default
- no forced cloud sync is required
- source-of-truth code history remains in Git
- session summaries are project-local and reviewable

## Security posture

- prefer local validation and local evidence
- avoid sending sensitive code or customer data to external services unless the user explicitly consents
- keep sessions scoped to the current repository and task

## Recommended deployment model

For customer or enterprise distribution, keep AIDIFF in a local workstation or internal environment and treat it as a traceability and governance layer rather than an external data store.
