import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { GenericAgentAdapter, GitHubCopilotAdapter, type AgentSessionStartEvent, type AgentPromptEvent, type AgentSessionEndEvent } from '../src/adapters.js';

describe('Phase 8 agent adapters', () => {
  let tempRoot: string;
  let repoId: string;
  let db: ReturnType<typeof initializeDatabase>;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase8-'));
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'readme.md'), '# Phase 8\n');
    execSync('git add readme.md', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });

    db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
    repoId = repo.id;
  });

  it('records a session lifecycle from generic and Copilot adapter events', async () => {
    const generic = new GenericAgentAdapter(db, repoId, { provider: 'generic', model: 'local' });
    const startEvent: AgentSessionStartEvent = {
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      baseSha: 'abc123',
      summary: 'Session started',
    };

    const session = await generic.onSessionStart(startEvent);
    const prompt = await generic.onPrompt({ sessionId: session.id, rawText: 'Add org auth support', retentionMode: 'summary' });
    const ended = await generic.onSessionEnd({ sessionId: session.id, summary: 'Completed organization auth support' });

    expect(session).toBeTruthy();
    expect(prompt.summary).toContain('Add');
    expect(ended.status).toBe('completed');

    const copilot = new GitHubCopilotAdapter(db, repoId, { model: 'gpt-4o' });
    const copilotSession = await copilot.onSessionStart({ provider: 'github-copilot', model: 'gpt-4o', branch: 'main', baseSha: 'def456' });
    const copilotPrompt = await copilot.onPrompt({ sessionId: copilotSession.id, rawText: 'Fix auth bug for orgs' });

    expect(copilotSession.provider).toBe('github-copilot');
    expect(copilotPrompt.summary).toContain('auth');

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
