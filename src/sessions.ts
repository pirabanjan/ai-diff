import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { getCurrentHead, getTreeSha } from './git.js';
import type { AiSession, PromptRetentionMode, PromptRecord, SessionStatus } from './types.js';

function normalizeSessionStatus(raw?: string): SessionStatus {
  const value = raw ?? 'active';
  switch (value) {
    case 'active':
    case 'completed':
    case 'partial':
    case 'failed':
    case 'abandoned':
    case 'unknown':
      return value;
    default:
      return 'unknown';
  }
}

function toSession(row: any): AiSession {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    externalSessionId: row.external_session_id ?? undefined,
    developer: row.developer ?? undefined,
    branch: row.branch ?? undefined,
    baseSha: row.base_sha ?? undefined,
    finalSha: row.final_sha ?? undefined,
    baseTreeSha: row.base_tree_sha ?? undefined,
    finalTreeSha: row.final_tree_sha ?? undefined,
    status: normalizeSessionStatus(row.status),
    summary: row.summary ?? undefined,
    startedAt: row.started_at ?? row.created_at,
    endedAt: row.ended_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPrompt(row: any): PromptRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    sequence: Number(row.sequence ?? 0),
    rawText: row.raw_text,
    summary: row.summary,
    retentionMode: (row.retention_mode as PromptRetentionMode) ?? 'summary',
    createdAt: row.created_at,
  };
}

export function summarizePromptText(rawText: string): string {
  const normalized = rawText.trim().replace(/\s+/g, ' ');
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

export function createSession(
  db: Database.Database,
  options: {
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
    summary?: string;
    status?: SessionStatus;
  }
): AiSession {
  const now = new Date().toISOString();
  const sessionId = `session-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const baseSha = options.baseSha ?? 'unknown';

  db.prepare(
    `INSERT INTO sessions (
      id, repository_id, provider, model, external_session_id, developer, branch, base_sha, final_sha,
      base_tree_sha, final_tree_sha, status, summary, started_at, ended_at, created_at, updated_at
    ) VALUES (
      @id, @repositoryId, @provider, @model, @externalSessionId, @developer, @branch, @baseSha, @finalSha,
      @baseTreeSha, @finalTreeSha, @status, @summary, @startedAt, @endedAt, @createdAt, @updatedAt
    )`
  ).run({
    id: sessionId,
    repositoryId: options.repositoryId,
    provider: options.provider ?? 'generic',
    model: options.model ?? 'local',
    externalSessionId: options.externalSessionId ?? null,
    developer: options.developer ?? null,
    branch: options.branch ?? 'main',
    baseSha,
    finalSha: options.finalSha ?? null,
    baseTreeSha: options.baseTreeSha ?? null,
    finalTreeSha: options.finalTreeSha ?? null,
    status: options.status ?? 'active',
    summary: options.summary ?? null,
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return getSessionById(db, sessionId)!;
}

export function getSessionById(db: Database.Database, sessionId: string): AiSession | undefined {
  const row = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(sessionId) as any;

  return row ? toSession(row) : undefined;
}

export function getActiveSession(db: Database.Database, repositoryId: string): AiSession | undefined {
  const row = db
    .prepare('SELECT * FROM sessions WHERE repository_id = ? AND status = ? ORDER BY started_at DESC LIMIT 1')
    .get(repositoryId, 'active') as any;

  return row ? toSession(row) : undefined;
}

export function addPrompt(
  db: Database.Database,
  sessionId: string,
  rawText: string,
  retentionMode: PromptRetentionMode = 'summary'
): PromptRecord {
  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM prompts WHERE session_id = ?')
    .get(sessionId) as { count: number };

  const promptId = `prompt-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const summary = summarizePromptText(rawText);
  const sequence = Number(countRow?.count ?? 0) + 1;

  db.prepare(
    `INSERT INTO prompts (id, session_id, sequence, raw_text, summary, retention_mode, created_at)
     VALUES (@id, @sessionId, @sequence, @rawText, @summary, @retentionMode, @createdAt)`
  ).run({
    id: promptId,
    sessionId,
    sequence,
    rawText,
    summary,
    retentionMode,
    createdAt: new Date().toISOString(),
  });

  return getPromptById(db, promptId)!;
}

export function getPromptById(db: Database.Database, promptId: string): PromptRecord | undefined {
  const row = db
    .prepare('SELECT * FROM prompts WHERE id = ?')
    .get(promptId) as any;

  return row ? toPrompt(row) : undefined;
}

export function listSessions(db: Database.Database, repositoryId?: string): AiSession[] {
  const rows = repositoryId
    ? db.prepare('SELECT * FROM sessions WHERE repository_id = ? ORDER BY started_at DESC').all(repositoryId)
    : db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all();

  return (rows as any[]).map(toSession);
}

export function finishSession(
  db: Database.Database,
  sessionId: string,
  summary: string,
  finalSha?: string,
  repoRoot?: string
): AiSession {
  const session = getSessionById(db, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found.`);
  }

  const finalHead = finalSha ?? session.finalSha ?? 'unknown';
  const finalTree = repoRoot ? getTreeSha(repoRoot) : session.finalTreeSha ?? null;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE sessions
     SET final_sha = @finalSha,
         final_tree_sha = @finalTreeSha,
         summary = @summary,
         status = 'completed',
         ended_at = @endedAt,
         updated_at = @updatedAt
     WHERE id = @sessionId`
  ).run({
    finalSha: finalHead,
    finalTreeSha: finalTree,
    summary,
    endedAt: now,
    updatedAt: now,
    sessionId,
  });

  return getSessionById(db, sessionId)!;
}

export function getSessionByRepositoryId(db: Database.Database, repositoryId: string): AiSession[] {
  return listSessions(db, repositoryId);
}

export function getSessionSummaryForRepo(db: Database.Database, repositoryId: string): string {
  const session = getActiveSession(db, repositoryId);
  return session?.summary ?? 'no active session';
}
