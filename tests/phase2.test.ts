import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { compareGitStates, getChangedFiles, getDiffStats, getTreeSha, listCommitsBetween } from '../src/git.js';

describe('Phase 2 git evidence layer', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase2-'));
    const { execSync } = require('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'app.txt'), 'first line\n');
    execSync('git add app.txt', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });
  });

  it('captures tree and working-tree diff evidence', () => {
    const { execSync } = require('node:child_process');
    writeFileSync(join(tempRoot, 'app.txt'), 'first line\nsecond line\n');
    writeFileSync(join(tempRoot, 'notes.txt'), 'new file\n');
    const tree = getTreeSha(tempRoot, 'HEAD');
    expect(tree).toMatch(/^[a-f0-9]{40}$/);

    const stats = getDiffStats(tempRoot, 'HEAD');
    expect(stats.totalFiles).toBeGreaterThanOrEqual(2);
    expect(stats.additions).toBeGreaterThanOrEqual(1);

    const files = getChangedFiles(tempRoot, 'HEAD');
    expect(files.map((file) => file.path)).toEqual(expect.arrayContaining(['app.txt', 'notes.txt']));

    execSync('git add notes.txt', { cwd: tempRoot, stdio: 'inherit' });
    const stagedStats = getDiffStats(tempRoot, 'HEAD');
    expect(stagedStats.totalFiles).toBeGreaterThanOrEqual(1);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('compares two SHAs and resolves commit range history', () => {
    const { execSync } = require('node:child_process');
    const base = execSync('git rev-parse HEAD', { cwd: tempRoot, encoding: 'utf8' }).trim();

    writeFileSync(join(tempRoot, 'app.txt'), 'first line\nsecond line\n');
    execSync('git add app.txt', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "second"', { cwd: tempRoot, stdio: 'inherit' });
    const head = execSync('git rev-parse HEAD', { cwd: tempRoot, encoding: 'utf8' }).trim();

    const comparison = compareGitStates(tempRoot, base, head);
    expect(comparison.changedFiles.some((file) => file.path === 'app.txt')).toBe(true);
    expect(comparison.stats.totalFiles).toBeGreaterThan(0);

    const commits = listCommitsBetween(tempRoot, base, head);
    expect(commits.length).toBe(1);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});
