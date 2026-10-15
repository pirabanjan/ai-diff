import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { detectGitRepository, getCurrentBranch, getCurrentHead } from '../src/git.js';
import { createAppConfig, readAppConfig, writeAppConfig } from '../src/config.js';
import { initializeRepository } from '../src/repository.js';

describe('Phase 1 foundation', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase1-'));
  });

  it('detects a git repository root and resolves current HEAD and branch', async () => {
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git checkout -b feature/test', { cwd: tempRoot, stdio: 'inherit' });

    const repoRoot = await detectGitRepository(tempRoot);
    expect(repoRoot).toBe(tempRoot);

    const branch = getCurrentBranch(tempRoot);
    expect(branch).toBe('feature/test');

    const head = getCurrentHead(tempRoot);
    expect(head).toMatch(/^[a-f0-9]{40}$/);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('creates the local app configuration and initializes repository metadata', async () => {
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });

    const config = createAppConfig();
    expect(config.promptRetention).toBe('summary');
    expect(config.localOnly).toBe(true);

    const configPath = join(tempRoot, '.ai-history', 'config.json');
    writeAppConfig(configPath, config);
    const persisted = readAppConfig(configPath);
    expect(persisted.promptRetention).toBe('summary');

    const repo = await initializeRepository(tempRoot);
    expect(repo.rootPath).toBe(tempRoot);
    expect(repo.defaultBranch).toMatch(/^(main|master)$/);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('provides actionable guidance when no git repository exists', () => {
    const missingRepoDir = join(tempRoot, 'not-a-git-repo');

    expect(() => detectGitRepository(missingRepoDir)).toThrowError(/git init|existing repository/i);
  });
});
