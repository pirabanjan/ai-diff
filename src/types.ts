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
