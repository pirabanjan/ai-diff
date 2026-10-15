import { basename, join, resolve } from 'node:path';
import { detectGitRepository, getCurrentBranch, getCurrentHead, getDefaultBranch, getRemoteUrl, getWorkingTreeStatus } from './git.js';
import type { RepositoryRecord } from './types.js';

export async function initializeRepository(repoPath: string): Promise<RepositoryRecord> {
  const rootPath = detectGitRepository(repoPath);
  const now = new Date().toISOString();

  return {
    id: `repo-${Date.now()}`,
    name: basename(rootPath),
    rootPath,
    remoteUrl: getRemoteUrl(rootPath),
    defaultBranch: getDefaultBranch(rootPath),
    createdAt: now,
    updatedAt: now,
  };
}

export function getRepositorySummary(repoRoot: string): { branch: string; head: string; dirty: boolean; statusText: string } {
  const branch = getCurrentBranch(repoRoot);
  const head = getCurrentHead(repoRoot);
  const statusText = getWorkingTreeStatus(repoRoot);

  return {
    branch,
    head,
    dirty: statusText.length > 0,
    statusText,
  };
}
