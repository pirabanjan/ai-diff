import type Database from 'better-sqlite3';
import { getCurrentBranch, getCurrentHead, getWorkingTreeStatus } from './git.js';

export interface ProjectHistoryMatch {
  id: string;
  kind: 'session' | 'ai-commit';
  title: string;
  summary: string;
  score: number;
  status?: string;
}

export interface ProjectHistorySearchResult {
  query: string;
  relevantAiCommits: ProjectHistoryMatch[];
  relevantSessions: ProjectHistoryMatch[];
}

export interface TaskContextResult extends ProjectHistorySearchResult {
  importantDecisions: string[];
  dependencies: string[];
  knownIssues: string[];
  unresolvedWork: string[];
  relevantFiles: string[];
  currentGitState: string;
  summary: string;
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return Array.from(new Set(normalizeSearchText(value).split(' ').filter((token) => token.length > 2)));
}

function scoreMatch(query: string, text: string, preferTitle = false): number {
  const queryText = normalizeSearchText(query);
  const haystack = normalizeSearchText(text);
  if (!queryText || !haystack) {
    return 0;
  }

  let score = 0;
  const tokens = tokenize(queryText);
  if (tokens.length === 0) {
    return 0;
  }

  const expandedTerms = new Set<string>();
  for (const token of tokens) {
    expandedTerms.add(token);
    expandedTerms.add(token.replace(/s$/, ''));
    expandedTerms.add(token.replace(/ing$/, ''));
    expandedTerms.add(token.replace(/ed$/, ''));
    if (token.startsWith('auth')) {
      expandedTerms.add('auth');
    }
    if (token.startsWith('organiz')) {
      expandedTerms.add('organization');
    }
    if (token.length > 4) {
      expandedTerms.add(token.slice(0, 4));
    }
  }

  for (const token of expandedTerms) {
    if (!token) continue;
    if (haystack.includes(token)) {
      score += 3;
    }
    const stem = token.replace(/(s|ing|ed|es)$/, '');
    if (stem && stem !== token && haystack.includes(stem)) {
      score += 2;
    }
  }

  if (haystack.includes(queryText)) {
    score += 8;
  }

  if (preferTitle && queryText.split(' ').length > 1) {
    const parts = queryText.split(' ');
    if (parts.every((part) => haystack.includes(part) || haystack.includes(part.replace(/s$/, '')))) {
      score += 5;
    }
  }

  return score;
}

function extractFiles(value: string): string[] {
  const matches = value.match(/[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+/g) ?? [];
  return Array.from(new Set(matches)).slice(0, 5);
}

export function searchProjectHistory(
  db: Database.Database,
  repositoryId: string,
  query: string,
  limit = 5
): ProjectHistorySearchResult {
  const relevantAiCommits: ProjectHistoryMatch[] = [];
  const relevantSessions: ProjectHistoryMatch[] = [];

  const commitRows = db
    .prepare('SELECT * FROM ai_commits WHERE repository_id = ? ORDER BY created_at DESC')
    .all(repositoryId) as any[];

  for (const row of commitRows) {
    const title = row.title ?? 'Untitled AI Commit';
    const summary = row.semantic_summary ?? row.description ?? row.original_intent ?? title;
    const score = scoreMatch(query, `${title} ${summary}`, true);
    if (score > 0) {
      relevantAiCommits.push({
        id: row.id,
        kind: 'ai-commit',
        title,
        summary,
        score,
        status: row.status,
      });
    }
  }

  const sessionRows = db
    .prepare('SELECT * FROM sessions WHERE repository_id = ? ORDER BY started_at DESC')
    .all(repositoryId) as any[];

  for (const row of sessionRows) {
    const title = row.summary ?? 'Session';
    const summary = `${row.provider ?? 'generic'} session: ${row.summary ?? row.branch ?? 'session'}`;
    const score = scoreMatch(query, `${title} ${summary}`);
    if (score > 0) {
      relevantSessions.push({
        id: row.id,
        kind: 'session',
        title,
        summary,
        score,
        status: row.status,
      });
    }
  }

  return {
    query,
    relevantAiCommits: relevantAiCommits.sort((a, b) => b.score - a.score).slice(0, limit),
    relevantSessions: relevantSessions.sort((a, b) => b.score - a.score).slice(0, limit),
  };
}

export function buildTaskContext(
  db: Database.Database,
  repositoryId: string,
  task: string,
  limit = 5
): TaskContextResult {
  const repoRow = db
    .prepare('SELECT root_path FROM repositories WHERE id = ?')
    .get(repositoryId) as { root_path: string } | undefined;
  const repoRoot = repoRow?.root_path ?? process.cwd();

  const history = searchProjectHistory(db, repositoryId, task, limit);
  const importantDecisions = history.relevantAiCommits
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 3);

  const dependencies = Array.from(
    new Set(
      history.relevantAiCommits.flatMap((item) => extractFiles(item.summary)).concat(
        history.relevantSessions.flatMap((item) => extractFiles(item.summary))
      )
    )
  ).slice(0, 3);

  const knownIssues = history.relevantAiCommits
    .filter((item) => item.status === 'blocked' || item.status === 'abandoned')
    .map((item) => item.title);

  const unresolvedWork = history.relevantAiCommits
    .filter((item) => item.status !== 'completed')
    .map((item) => item.title);

  const relevantFiles = Array.from(
    new Set(
      history.relevantAiCommits.flatMap((item) => extractFiles(item.summary)).concat(
        history.relevantSessions.flatMap((item) => extractFiles(item.summary))
      )
    )
  ).slice(0, 5);

  const branch = getCurrentBranch(repoRoot);
  const head = getCurrentHead(repoRoot);
  const dirty = getWorkingTreeStatus(repoRoot).trim().length > 0;
  const currentGitState = `Branch ${branch}; HEAD ${head.slice(0, 12)}; ${dirty ? 'working tree has local changes' : 'working tree is clean'}`;

  const summaryText = [
    `Relevant history for "${task}":`,
    ...history.relevantAiCommits.map((commit) => `- ${commit.title} (${commit.score})`),
    ...history.relevantSessions.map((session) => `- ${session.title} (${session.score})`),
  ].join('\n');

  return {
    ...history,
    importantDecisions: importantDecisions.length > 0 ? importantDecisions : ['No explicit decisions were recorded for this task.'],
    dependencies: dependencies.length > 0 ? dependencies : ['No dependency hints were captured.'],
    knownIssues: knownIssues.length > 0 ? knownIssues : ['No known blockers were recorded.'],
    unresolvedWork: unresolvedWork.length > 0 ? unresolvedWork : ['No unresolved work was recorded.'],
    relevantFiles: relevantFiles.length > 0 ? relevantFiles : ['No file paths were recorded.'],
    currentGitState,
    summary: summaryText,
  };
}
