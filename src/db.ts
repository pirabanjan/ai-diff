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
  `);

  return db;
}

export function databaseExists(repoRoot: string): boolean {
  return existsSync(getDatabasePath(repoRoot));
}
