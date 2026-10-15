import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentHead } from '../src/git.js';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { addPrompt, createSession, finishSession, listSessions } from '../src/sessions.js';

describe('Phase 3 session lifecycle', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase3-'));
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'readme.md'), '# AIDIFF\n');
    execSync('git add readme.md', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });
  });

  it('starts a session and records prompt evidence', async () => {
    const db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
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

    const session = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      baseSha: getCurrentHead(tempRoot),
      summary: 'session started',
    });

    expect(session.status).toBe('active');
    expect(session.id).toBeTruthy();

    const prompt = addPrompt(db, session.id, 'Add login flow', 'summary');
    expect(prompt.rawText).toBe('Add login flow');
    expect(prompt.retentionMode).toBe('summary');

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('finishes a session and exposes it through query methods', async () => {
    const db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
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

    const session = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      baseSha: getCurrentHead(tempRoot),
      summary: 'session started',
    });

    const finished = finishSession(db, session.id, 'Added login flow', getCurrentHead(tempRoot));
    expect(finished.status).toBe('completed');
    expect(finished.summary).toBe('Added login flow');

    const sessions = listSessions(db, repo.id);
    expect(sessions.some((item) => item.id === session.id)).toBe(true);

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
