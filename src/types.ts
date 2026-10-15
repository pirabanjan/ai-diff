export type PromptRetentionMode = 'none' | 'summary' | 'full';

export interface AppConfig {
  promptRetention: PromptRetentionMode;
  localOnly: boolean;
  redactSecrets: boolean;
  defaultRepoName?: string;
}

export interface RepositoryRecord {
  id: string;
  name: string;
  rootPath: string;
  remoteUrl?: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitStatusSummary {
  branch: string;
  head: string;
  dirty: boolean;
  statusText: string;
}

export type SessionStatus = 'active' | 'completed' | 'partial' | 'failed' | 'abandoned' | 'unknown';

export interface AiSession {
  id: string;
  repositoryId: string;
  provider?: string;
  model?: string;
  externalSessionId?: string;
  developer?: string;
  branch?: string;
  baseSha?: string;
  finalSha?: string;
  baseTreeSha?: string;
  finalTreeSha?: string;
  status: SessionStatus;
  summary?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptRecord {
  id: string;
  sessionId: string;
  sequence: number;
  rawText: string;
  summary: string;
  retentionMode: PromptRetentionMode;
  createdAt: string;
}

export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unknown';

export interface ChangedFile {
  path: string;
  changeType: ChangeType;
  insertions: number;
  deletions: number;
  oldPath?: string;
  newPath?: string;
}

export interface DiffStats {
  totalFiles: number;
  additions: number;
  deletions: number;
  raw: string;
}

export interface GitComparison {
  fromSha: string;
  toSha: string;
  changedFiles: ChangedFile[];
  stats: DiffStats;
}

export type AiCommitStatus =
  | 'proposed'
  | 'in_progress'
  | 'ready_for_review'
  | 'completed'
  | 'blocked'
  | 'superseded'
  | 'abandoned';

export interface AiCommit {
  id: string;
  repositoryId: string;
  title: string;
  description?: string;
  originalIntent?: string;
  normalizedIntent?: string;
  status: AiCommitStatus;
  baseSha?: string;
  resultSha?: string;
  summary?: string;
  semanticSummary?: string;
  humanApprovalStatus?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface AiCommitSessionLink {
  id: string;
  aiCommitId: string;
  sessionId: string;
  contributionSummary?: string;
  createdAt: string;
}

export interface AiCommitRelation {
  id: string;
  sourceAiCommitId: string;
  targetAiCommitId: string;
  relationType: string;
  confidence: number;
  evidenceRef?: string;
  createdAt: string;
}
