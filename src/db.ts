import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function getAiHistoryDir(repoRoot: string): string {
  return resolve(repoRoot, '.ai-history');
}

export function getDatabasePath(repoRoot: string): string {
  return resolve(getAiHistoryDir(repoRoot), 'aidiff.db');
}

export function initializeDatabase(repoRoot: string): Database.Database {
  const dir = getAiHistoryDir(repoRoot);
  mkdirSync(dir, { recursive: true });

  const dbPath = getDatabasePath(repoRoot);
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL,
      remote_url TEXT,
      default_branch TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      external_session_id TEXT,
      developer TEXT,
      branch TEXT,
      base_sha TEXT,
      final_sha TEXT,
      base_tree_sha TEXT,
      final_tree_sha TEXT,
      status TEXT NOT NULL,
      summary TEXT,
      started_at TEXT,
      ended_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      raw_text TEXT NOT NULL,
      summary TEXT,
      retention_mode TEXT NOT NULL DEFAULT 'summary',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS session_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS ai_commits (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      original_intent TEXT,
      normalized_intent TEXT,
      status TEXT NOT NULL,
      base_sha TEXT,
      result_sha TEXT,
      semantic_summary TEXT,
      human_approval_status TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_commit_sessions (
      id TEXT PRIMARY KEY,
      ai_commit_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      contribution_summary TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ai_commit_id) REFERENCES ai_commits(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS ai_commit_relations (
      id TEXT PRIMARY KEY,
      source_ai_commit_id TEXT NOT NULL,
      target_ai_commit_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      evidence_ref TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_ai_commit_id) REFERENCES ai_commits(id),
      FOREIGN KEY (target_ai_commit_id) REFERENCES ai_commits(id)
    );
  `);

  return db;
}

export function databaseExists(repoRoot: string): boolean {
  return existsSync(getDatabasePath(repoRoot));
}
