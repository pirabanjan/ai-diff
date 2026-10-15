import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { createAiCommit, addSessionToAiCommit } from '../src/ai-commits.js';
import { createSession } from '../src/sessions.js';
import { compareAiCommits, resolveAiDiffTarget, summarizeAiDiff } from '../src/ai-diff.js';

describe('Phase 5 ai diff', () => {
  let tempRoot: string;
  let repoId: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase5-'));
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

    const s1 = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      baseSha: 'a111111111111111111111111111111111111111',
      summary: 'first session',
    });
    const s2 = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'bob',
      branch: 'main',
      baseSha: 'b222222222222222222222222222222222222222',
      summary: 'second session',
    });

    const commit1 = createAiCommit(db, {
      repositoryId: repo.id,
      title: 'Feature A',
      description: 'base feature',
      originalIntent: 'base intent',
      status: 'completed',
      baseSha: 'aaa',
      resultSha: 'bbb',
    });
    const commit2 = createAiCommit(db, {
      repositoryId: repo.id,
      title: 'Feature B',
      description: 'next feature',
      originalIntent: 'next intent',
      status: 'completed',
      baseSha: 'bbb',
      resultSha: 'ccc',
    });

    addSessionToAiCommit(db, commit1.id, s1.id, 'added base capability');
    addSessionToAiCommit(db, commit2.id, s2.id, 'extended feature');

    db.close();
  });

  it('resolves AI Commit targets and compares them deterministically', () => {
    const db = initializeDatabase(tempRoot);
    const commits = db.prepare('SELECT * FROM ai_commits ORDER BY created_at DESC').all() as any[];
    const from = resolveAiDiffTarget(db, commits[1].id);
    const to = resolveAiDiffTarget(db, commits[0].id);

    expect(from).toBeTruthy();
    expect(to).toBeTruthy();

    const diff = compareAiCommits(db, from!.id, to!.id);
    expect(diff.from).toBeDefined();
    expect(diff.to).toBeDefined();
    expect(diff.evidence.length).toBeGreaterThan(0);

    const summary = summarizeAiDiff(diff);
    expect(summary).toContain('Intent');
    expect(summary).toContain('Behavior');
    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
