import { execFileSync, type ExecSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function runGit(repoRoot: string, args: string[], options: ExecSyncOptions = {}): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).toString().trim();
}

export function detectGitRepository(startPath: string): string {
  let current = resolve(startPath);

  while (true) {
    const gitDir = join(current, '.git');
    if (existsSync(gitDir)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        `No Git repository found from ${startPath}. Initialize one with "git init" or run this command inside an existing repository.`
      );
    }
    current = parent;
  }
}

export function getCurrentBranch(repoRoot: string): string {
  try {
    return runGit(repoRoot, ['symbolic-ref', '--short', 'HEAD']);
  } catch {
    return runGit(repoRoot, ['branch', '--show-current']) || 'master';
  }
}

export function getCurrentHead(repoRoot: string): string {
  try {
    return runGit(repoRoot, ['rev-parse', 'HEAD']);
  } catch {
    return runGit(repoRoot, ['hash-object', '-t', 'tree', '--stdin'], { input: '' })
      .replace(/\r?\n/g, '')
      .trim();
  }
}

export function getWorkingTreeStatus(repoRoot: string): string {
  return runGit(repoRoot, ['status', '--short']);
}

export function getDefaultBranch(repoRoot: string): string {
  const configured = runGit(repoRoot, ['config', '--get', 'init.defaultBranch']);
  if (configured) {
    return configured;
  }

  const branch = getCurrentBranch(repoRoot);
  if (branch === 'HEAD') {
    return 'master';
  }

  if (branch === 'main' || branch === 'master') {
    return branch;
  }

  return 'master';
}

export function getRemoteUrl(repoRoot: string): string | undefined {
  try {
    return runGit(repoRoot, ['remote', 'get-url', 'origin']);
  } catch {
    return undefined;
  }
}
