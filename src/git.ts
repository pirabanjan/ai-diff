import { execFileSync, type ExecSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ChangedFile, DiffStats, GitComparison } from './types.js';

export function runGit(repoRoot: string, args: string[], options: ExecSyncOptions = {}): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).toString().trim();
}

function normalizeChangeType(statusToken: string): ChangedFile['changeType'] {
  const token = statusToken.toUpperCase();
  if (token.startsWith('R')) return 'renamed';
  if (token.startsWith('C')) return 'copied';
  if (token.includes('D')) return 'deleted';
  if (token.includes('A')) return 'added';
  if (token.includes('M')) return 'modified';
  return 'unknown';
}

function parseNameStatusOutput(raw: string): ChangedFile[] {
  if (!raw.trim()) {
    return [];
  }

  const changes: ChangedFile[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const parts = line.split('\t');
    const statusToken = parts[0]?.trim() ?? '';
    const status = normalizeChangeType(statusToken);

    if (statusToken.startsWith('R') || statusToken.startsWith('C')) {
      const oldPath = parts[1] ?? '';
      const newPath = parts[2] ?? parts[1] ?? '';
      changes.push({
        path: newPath,
        changeType: status,
        insertions: 0,
        deletions: 0,
        oldPath,
        newPath,
      });
      continue;
    }

    const path = parts[1] ?? parts[0]?.replace(/^[A-Z?]+\s+/, '') ?? '';
    changes.push({
      path,
      changeType: status,
      insertions: 0,
      deletions: 0,
    });
  }

  return changes;
}

function parsePorcelainStatus(raw: string): ChangedFile[] {
  if (!raw.trim()) {
    return [];
  }

  const changes: ChangedFile[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const statusCode = line.slice(0, 2);
    const pathRaw = line.slice(3);
    const renamed = pathRaw.includes(' -> ');
    const normalized = renamed ? pathRaw.split(' -> ').at(-1) ?? pathRaw : pathRaw;
    const status = statusCode.startsWith('??')
      ? 'added'
      : normalizeChangeType(statusCode.replace(/\?/g, ''));

    changes.push({
      path: normalized,
      changeType: status,
      insertions: 0,
      deletions: 0,
      oldPath: renamed ? pathRaw.split(' -> ')[0] : undefined,
      newPath: normalized,
    });
  }

  return changes;
}

function parseNumStat(raw: string): DiffStats {
  let totalFiles = 0;
  let additions = 0;
  let deletions = 0;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;

    const left = Number(parts[0] ?? 0);
    const right = Number(parts[1] ?? 0);
    const file = parts.slice(2).join(' ');

    if (file) {
      totalFiles += 1;
    }

    if (!Number.isNaN(left)) {
      additions += left;
    }
    if (!Number.isNaN(right)) {
      deletions += right;
    }
  }

  return {
    totalFiles,
    additions,
    deletions,
    raw,
  };
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

export function getTreeSha(repoRoot: string, rev = 'HEAD'): string {
  try {
    return runGit(repoRoot, ['rev-parse', `${rev}^{tree}`]);
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

export function getChangedFiles(repoRoot: string, fromRef = 'HEAD', toRef?: string): ChangedFile[] {
  const merged = new Map<string, ChangedFile>();

  try {
    const diffRaw = toRef
      ? runGit(repoRoot, ['diff', '--name-status', fromRef, toRef])
      : runGit(repoRoot, ['diff', '--name-status', fromRef]);

    for (const file of parseNameStatusOutput(diffRaw)) {
      merged.set(file.path, file);
    }
  } catch {
    // no diff from the requested state
  }

  try {
    const cachedRaw = runGit(repoRoot, ['diff', '--cached', '--name-status']);
    for (const file of parseNameStatusOutput(cachedRaw)) {
      merged.set(file.path, file);
    }
  } catch {
    // no staged changes
  }

  try {
    const statusRaw = runGit(repoRoot, ['status', '--porcelain=v1', '--untracked-files=all']);
    for (const file of parsePorcelainStatus(statusRaw)) {
      merged.set(file.path, file);
    }
  } catch {
    // no working-tree status
  }

  return Array.from(merged.values());
}

export function getDiffStats(repoRoot: string, fromRef = 'HEAD', toRef?: string): DiffStats {
  const outputs: string[] = [];

  if (toRef) {
    try {
      outputs.push(runGit(repoRoot, ['diff', '--numstat', fromRef, toRef]));
    } catch {
      // no direct diff between the provided refs
    }
  } else {
    try {
      outputs.push(runGit(repoRoot, ['diff', '--numstat', fromRef]));
    } catch {
      // no unstaged diff
    }

    try {
      outputs.push(runGit(repoRoot, ['diff', '--cached', '--numstat']));
    } catch {
      // no staged diff
    }

    try {
      const statusRaw = runGit(repoRoot, ['status', '--porcelain=v1', '--untracked-files=all']);
      for (const line of statusRaw.split(/\r?\n/)) {
        if (!line.trim() || !line.startsWith('?? ')) continue;
        outputs.push(`1\t0\t${line.slice(3)}`);
      }
    } catch {
      // no working-tree status
    }
  }

  return parseNumStat(outputs.join('\n'));
}

export function compareGitStates(repoRoot: string, fromRef: string, toRef: string): GitComparison {
  const changedFiles = getChangedFiles(repoRoot, fromRef, toRef);
  const stats = getDiffStats(repoRoot, fromRef, toRef);

  return {
    fromSha: resolveGitRef(repoRoot, fromRef),
    toSha: resolveGitRef(repoRoot, toRef),
    changedFiles,
    stats,
  };
}

export function resolveGitRef(repoRoot: string, ref: string): string {
  try {
    return runGit(repoRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
  } catch {
    return ref;
  }
}

export function listCommitsBetween(repoRoot: string, fromRef: string, toRef: string): string[] {
  try {
    const output = runGit(repoRoot, ['rev-list', '--reverse', `${fromRef}..${toRef}`]);
    return output ? output.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}
