# AIDIFF Documentation

This folder contains the project’s documentation set for onboarding, usage, and AI-agent guidance.

## Documentation map

### Main project docs
- [../README.md](../README.md) — project overview, install steps, and usage
- [../FULL_BUILD_SPEC.md](../FULL_BUILD_SPEC.md) — full build specification and feature requirements

### AI agent and workflow docs
- [agent-guides/README.md](agent-guides/README.md) — index for all AI session guidance files
- [agent-guides/master-template.md](agent-guides/master-template.md) — universal template for any AI workflow
- [agent-guides/github-copilot.md](agent-guides/github-copilot.md) — GitHub Copilot workflow
- [agent-guides/github-copilot-enterprise.md](agent-guides/github-copilot-enterprise.md) — enterprise-ready Copilot instructions
- [agent-guides/claude-code.md](agent-guides/claude-code.md) — Claude Code workflow
- [agent-guides/claude-system-prompt.md](agent-guides/claude-system-prompt.md) — Claude system prompt version
- [agent-guides/devin.md](agent-guides/devin.md) — Devin workflow guidance
- [agent-guides/cursor-codex.md](agent-guides/cursor-codex.md) — Cursor / Codex-style rules
- [agent-guides/codex.md](agent-guides/codex.md) — strict Codex instruction set
- [agent-guides/generic-agent.md](agent-guides/generic-agent.md) — generic multi-agent instructions

### Customer-facing docs
- [customer-facing/README.md](customer-facing/README.md) — overview for customers and internal stakeholders
- [customer-facing/deployment-guide.md](customer-facing/deployment-guide.md) — install and deployment workflow
- [customer-facing/usage-guide.md](customer-facing/usage-guide.md) — day-to-day usage guide
- [customer-facing/privacy-and-security.md](customer-facing/privacy-and-security.md) — privacy and security overview
- [customer-facing/faq.md](customer-facing/faq.md) — common questions and answers

## Recommended usage

Use the root-level files when the target platform expects a specific filename:
- [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- [../CLAUDE.md](../CLAUDE.md)
- [../AGENTS.md](../AGENTS.md)
- [../DEVIN.md](../DEVIN.md)
- [../.cursor/rules/aidiff.mdc](../.cursor/rules/aidiff.mdc)

Use the files under docs/agent-guides/ when you want a centralized, readable reference set for onboarding, training, or internal customer documentation.
