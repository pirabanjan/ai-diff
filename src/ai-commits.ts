import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { AiCommit, AiCommitRelation, AiCommitSessionLink, AiCommitStatus } from './types.js';

function normalizeAiCommitStatus(raw?: string): AiCommitStatus {
  switch (raw) {
    case 'proposed':
    case 'in_progress':
    case 'ready_for_review':
    case 'completed':
    case 'blocked':
    case 'superseded':
    case 'abandoned':
      return raw;
    default:
      return 'proposed';
  }
}

function toAiCommit(row: any): AiCommit {
  const summary = row.semantic_summary ?? row.summary ?? undefined;

  return {
    id: row.id,
    repositoryId: row.repository_id,
    title: row.title,
    description: row.description ?? undefined,
    originalIntent: row.original_intent ?? undefined,
    normalizedIntent: row.normalized_intent ?? undefined,
    status: normalizeAiCommitStatus(row.status),
    baseSha: row.base_sha ?? undefined,
    resultSha: row.result_sha ?? undefined,
    summary,
    semanticSummary: summary,
    humanApprovalStatus: row.human_approval_status ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function createAiCommit(
  db: Database.Database,
  options: {
    repositoryId: string;
    title: string;
    description?: string;
    originalIntent?: string;
    normalizedIntent?: string;
    status?: AiCommitStatus;
    baseSha?: string;
    resultSha?: string;
    semanticSummary?: string;
    humanApprovalStatus?: string;
  }
): AiCommit {
  const now = new Date().toISOString();
  const entityId = `ai-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(
    `INSERT INTO ai_commits (
      id, repository_id, title, description, original_intent, normalized_intent, status, base_sha,
      result_sha, semantic_summary, human_approval_status, created_at, completed_at, updated_at
    ) VALUES (
      @id, @repositoryId, @title, @description, @originalIntent, @normalizedIntent, @status, @baseSha,
      @resultSha, @semanticSummary, @humanApprovalStatus, @createdAt, @completedAt, @updatedAt
    )`
  ).run({
    id: entityId,
    repositoryId: options.repositoryId,
    title: options.title,
    description: options.description ?? null,
    originalIntent: options.originalIntent ?? null,
    normalizedIntent: options.normalizedIntent ?? options.originalIntent ?? null,
    status: options.status ?? 'proposed',
    baseSha: options.baseSha ?? null,
    resultSha: options.resultSha ?? null,
    semanticSummary: options.semanticSummary ?? null,
    humanApprovalStatus: options.humanApprovalStatus ?? null,
    createdAt: now,
    completedAt: null,
    updatedAt: now,
  });

  return getAiCommitById(db, entityId)!;
}

export function getAiCommitById(db: Database.Database, aiCommitId: string): AiCommit | undefined {
  const row = db.prepare('SELECT * FROM ai_commits WHERE id = ?').get(aiCommitId) as any;
  return row ? toAiCommit(row) : undefined;
}

export function listAiCommits(db: Database.Database, repositoryId?: string): AiCommit[] {
  const rows = repositoryId
    ? db.prepare('SELECT * FROM ai_commits WHERE repository_id = ? ORDER BY created_at DESC').all(repositoryId)
    : db.prepare('SELECT * FROM ai_commits ORDER BY created_at DESC').all();

  return (rows as any[]).map(toAiCommit);
}

export function addSessionToAiCommit(
  db: Database.Database,
  aiCommitId: string,
  sessionId: string,
  contributionSummary?: string
): AiCommitSessionLink {
  const id = `ai-session-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(
    `INSERT INTO ai_commit_sessions (id, ai_commit_id, session_id, contribution_summary, created_at)
     VALUES (@id, @aiCommitId, @sessionId, @contributionSummary, @createdAt)`
  ).run({
    id,
    aiCommitId,
    sessionId,
    contributionSummary: contributionSummary ?? null,
    createdAt: new Date().toISOString(),
  });

  return {
    id,
    aiCommitId,
    sessionId,
    contributionSummary: contributionSummary ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

export function completeAiCommit(
  db: Database.Database,
  aiCommitId: string,
  summary: string
): AiCommit {
  const commit = getAiCommitById(db, aiCommitId);
  if (!commit) {
    throw new Error(`AI Commit ${aiCommitId} not found.`);
  }

  const now = new Date().toISOString();

  db.prepare(
    `UPDATE ai_commits
     SET status = 'completed',
         semantic_summary = @summary,
         completed_at = @completedAt,
         updated_at = @updatedAt
     WHERE id = @aiCommitId`
  ).run({
    summary,
    completedAt: now,
    updatedAt: now,
    aiCommitId,
  });

  return getAiCommitById(db, aiCommitId)!;
}

export function addAiCommitRelation(
  db: Database.Database,
  sourceAiCommitId: string,
  targetAiCommitId: string,
  relationType: string,
  confidence = 0.5
): AiCommitRelation {
  const id = `ai-relation-${Date.now()}-${randomUUID().slice(0, 8)}`;

  db.prepare(
    `INSERT INTO ai_commit_relations (id, source_ai_commit_id, target_ai_commit_id, relation_type, confidence, evidence_ref, created_at)
     VALUES (@id, @sourceAiCommitId, @targetAiCommitId, @relationType, @confidence, @evidenceRef, @createdAt)`
  ).run({
    id,
    sourceAiCommitId,
    targetAiCommitId,
    relationType,
    confidence,
    evidenceRef: null,
    createdAt: new Date().toISOString(),
  });

  return {
    id,
    sourceAiCommitId,
    targetAiCommitId,
    relationType,
    confidence,
    evidenceRef: undefined,
    createdAt: new Date().toISOString(),
  };
}
