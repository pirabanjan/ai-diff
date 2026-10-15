import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { addPrompt, createSession, finishSession } from '../src/sessions.js';
import { addSessionToAiCommit, completeAiCommit, createAiCommit, getAiCommitById, listAiCommits } from '../src/ai-commits.js';

describe('Phase 4 ai commit lifecycle', () => {
  let tempRoot: string;
  let repoId: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase4-'));
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'readme.md'), '# AIDIFF\n');
    execSync('git add readme.md', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });

    const db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
    repoId = repo.id;

    db.prepare(
      `INSERT INTO repositories (id, name, root_path, remote_url, default_branch, created_at, updated_at)
       VALUES (@id, @name, @rootPath, @remoteUrl, @defaultBranch, @createdAt, @updatedAt)`
    ).run({
      id: repo.id,
      name: repo.name,
      rootPath: repo.rootPath,
      remoteUrl: repo.remoteUrl ?? null,
      defaultBranch: repo.defaultBranch,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
    });
    db.close();
  });

  it('creates and attaches sessions to an AI commit, then completes it', () => {
    const db = initializeDatabase(tempRoot);
    const sessionA = createSession(db, {
      repositoryId: repoId,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      baseSha: 'abc123',
      summary: 'session one',
    });
    const sessionB = createSession(db, {
      repositoryId: repoId,
      provider: 'generic',
      model: 'local',
      developer: 'bob',
      branch: 'main',
      baseSha: 'def456',
      summary: 'session two',
    });

    addPrompt(db, sessionA.id, 'Add login flow', 'summary');
    addPrompt(db, sessionB.id, 'Improve MFA flow', 'summary');

    const aiCommit = createAiCommit(db, {
      repositoryId: repoId,
      title: 'Authentication upgrade',
      description: 'Improve auth flow',
      originalIntent: 'Add login and MFA',
      status: 'in_progress',
      baseSha: 'abc123',
      resultSha: 'def456',
    });

    addSessionToAiCommit(db, aiCommit.id, sessionA.id, 'Implemented login flow');
    addSessionToAiCommit(db, aiCommit.id, sessionB.id, 'Added MFA flow');

    const completed = completeAiCommit(db, aiCommit.id, 'Authentication upgrade finished');
    expect(completed.status).toBe('completed');
    expect(completed.summary).toContain('Authentication upgrade finished');

    const stored = getAiCommitById(db, aiCommit.id);
    expect(stored?.title).toBe('Authentication upgrade');

    const commits = listAiCommits(db, repoId);
    expect(commits.some((item) => item.id === aiCommit.id)).toBe(true);

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
