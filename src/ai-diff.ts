import type Database from 'better-sqlite3';
import type { AiCommit, AiSession, DiffStats } from './types.js';
import { getCurrentHead, getDiffStats } from './git.js';

export type DiffTargetType = 'ai-commit' | 'session' | 'git-sha';

export interface DiffTarget {
  kind: DiffTargetType;
  id: string;
  title?: string;
  summary?: string;
  baseSha?: string;
  resultSha?: string;
  sessionId?: string;
}

export interface AiDiffEvidence {
  kind: 'git' | 'session' | 'ai-commit';
  label: string;
  value: string;
}

export interface AiDiffResult {
  from: DiffTarget;
  to: DiffTarget;
  intent: string[];
  behavior: string[];
  architecture: string[];
  validation: string[];
  dependencies: string[];
  remainingWork: string[];
  evidence: AiDiffEvidence[];
}

export function resolveAiDiffTarget(db: Database.Database, target: string): DiffTarget | undefined {
  const commitRow = db.prepare('SELECT * FROM ai_commits WHERE id = ?').get(target) as any;
  if (commitRow) {
    return {
      kind: 'ai-commit',
      id: commitRow.id,
      title: commitRow.title,
      summary: commitRow.semantic_summary ?? commitRow.title,
      baseSha: commitRow.base_sha ?? undefined,
      resultSha: commitRow.result_sha ?? undefined,
    };
  }

  const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(target) as any;
  if (sessionRow) {
    return {
      kind: 'session',
      id: sessionRow.id,
      title: sessionRow.summary ?? 'Session',
      summary: sessionRow.summary ?? 'Session',
      baseSha: sessionRow.base_sha ?? undefined,
      resultSha: sessionRow.final_sha ?? undefined,
      sessionId: sessionRow.id,
    };
  }

  return undefined;
}

export function compareAiCommits(
  db: Database.Database,
  fromId: string,
  toId: string
): AiDiffResult {
  const fromCommit = db.prepare('SELECT * FROM ai_commits WHERE id = ?').get(fromId) as any;
  const toCommit = db.prepare('SELECT * FROM ai_commits WHERE id = ?').get(toId) as any;

  if (!fromCommit || !toCommit) {
    throw new Error('Both AI Commit targets must exist.');
  }

  const fromTarget: DiffTarget = {
    kind: 'ai-commit',
    id: fromCommit.id,
    title: fromCommit.title,
    summary: fromCommit.semantic_summary ?? fromCommit.title,
    baseSha: fromCommit.base_sha ?? undefined,
    resultSha: fromCommit.result_sha ?? undefined,
  };

  const toTarget: DiffTarget = {
    kind: 'ai-commit',
    id: toCommit.id,
    title: toCommit.title,
    summary: toCommit.semantic_summary ?? toCommit.title,
    baseSha: toCommit.base_sha ?? undefined,
    resultSha: toCommit.result_sha ?? undefined,
  };

  const diffStats = getDiffStats(process.cwd(), fromCommit.result_sha ?? 'HEAD', toCommit.result_sha ?? 'HEAD');
  const sessionRows = db.prepare(
    `SELECT s.* FROM sessions s
     INNER JOIN ai_commit_sessions acs ON acs.session_id = s.id
     WHERE acs.ai_commit_id IN (?, ?)
     ORDER BY s.started_at DESC`
  ).all(fromId, toId) as any[];

  const evidence: AiDiffEvidence[] = [
    { kind: 'git', label: 'Git range', value: `${fromCommit.result_sha ?? 'unknown'} -> ${toCommit.result_sha ?? 'unknown'}` },
    { kind: 'ai-commit', label: 'From', value: fromCommit.title },
    { kind: 'ai-commit', label: 'To', value: toCommit.title },
  ];

  if (sessionRows.length > 0) {
    evidence.push({ kind: 'session', label: 'Sessions', value: sessionRows.map((row) => row.id).join(', ') });
  }

  return {
    from: fromTarget,
    to: toTarget,
    intent: [
      `Updated intent from ${fromCommit.original_intent ?? fromCommit.title} to ${toCommit.original_intent ?? toCommit.title}`,
    ],
    behavior: [
      `${toCommit.title} expands the scope beyond ${fromCommit.title}`,
      `Git evidence shows ${diffStats.totalFiles} file(s) affected and ${diffStats.additions} added lines`,
    ],
    architecture: [`Feature progression from ${fromCommit.title} to ${toCommit.title}`],
    validation: ['No external validation record was attached; fallback diff-stat evidence used.'],
    dependencies: ['No explicit dependency edges were recorded.'],
    remainingWork: ['No remaining work was recorded for this comparison.'],
    evidence,
  };
}

export function summarizeAiDiff(diff: AiDiffResult): string {
  const sections = [
    'Intent',
    ...diff.intent,
    'Behavior',
    ...diff.behavior,
    'Architecture',
    ...diff.architecture,
    'Validation',
    ...diff.validation,
    'Dependencies',
    ...diff.dependencies,
    'Remaining work',
    ...diff.remainingWork,
    'Evidence',
    ...diff.evidence.map((item) => `${item.label}: ${item.value}`),
  ];

  return sections.join('\n- ');
}
