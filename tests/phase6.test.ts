import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { createAiCommit, addSessionToAiCommit } from '../src/ai-commits.js';
import { createSession } from '../src/sessions.js';
import { buildTaskContext, searchProjectHistory } from '../src/context.js';

describe('Phase 6 context retrieval', () => {
  let tempRoot: string;
  let repoId: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase6-'));
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'readme.md'), '# Phase 6\n');
    execSync('git add readme.md', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });

    const db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
    repoId = repo.id;

    const session1 = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      summary: 'Investigated organization auth flow',
    });

    const session2 = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'bob',
      branch: 'main',
      summary: 'Added invoice dashboard basics',
    });

    const commit1 = createAiCommit(db, {
      repositoryId: repo.id,
      title: 'Organization auth support',
      description: 'Added org-aware login flow and auth guard checks.',
      originalIntent: 'support organizations in authentication',
      status: 'completed',
      semanticSummary: 'Support organizations in auth',
    });

    const commit2 = createAiCommit(db, {
      repositoryId: repo.id,
      title: 'Invoice dashboard',
      description: 'Built the invoice dashboard and summary cards.',
      originalIntent: 'show invoice metrics',
      status: 'completed',
      semanticSummary: 'Dashboard summarization',
    });

    addSessionToAiCommit(db, commit1.id, session1.id, 'worked on org authentication');
    addSessionToAiCommit(db, commit2.id, session2.id, 'built dashboard UI');

    db.close();
  });

  it('ranks relevant project history for a task and returns a summarized context block', () => {
    const db = initializeDatabase(tempRoot);
    const history = searchProjectHistory(db, repoId, 'organization authentication support');

    expect(history.relevantAiCommits.length).toBeGreaterThan(0);
    expect(history.relevantSessions.length).toBeGreaterThan(0);
    expect(history.relevantAiCommits[0]?.title).toContain('Organization');

    const context = buildTaskContext(db, repoId, 'modify authentication to support organizations');
    expect(context.relevantAiCommits.length).toBeGreaterThan(0);
    expect(context.relevantSessions.length).toBeGreaterThan(0);
    expect(context.summary).toContain('Organization');
    expect(context.summary).toContain('authentication');

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
