#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { createAppConfig, readAppConfig, writeAppConfig } from './config.js';
import { initializeDatabase, getDatabasePath } from './db.js';
import { detectGitRepository } from './git.js';
import { getRepositorySummary, initializeRepository } from './repository.js';

function printHelp(): void {
  console.log(`AI Diff CLI\n\nCommands:\n  ai init\n  ai status\n  ai help\n`);
}

async function handleInit(): Promise<void> {
  const repoRoot = detectGitRepository(process.cwd());
  const configDir = resolve(repoRoot, '.ai-history');
  const configPath = resolve(configDir, 'config.json');

  const config = createAppConfig();
  writeAppConfig(configPath, config);

  const db = initializeDatabase(repoRoot);
  const repo = await initializeRepository(repoRoot);

  db.prepare(
    `INSERT OR REPLACE INTO repositories (id, name, root_path, remote_url, default_branch, created_at, updated_at)
     VALUES (@id, @name, @rootPath, @remoteUrl, @defaultBranch, @createdAt, @updatedAt)`
  ).run({
    id: repo.id,
    name: repo.name,
    rootPath: repo.rootPath,
    remoteUrl: repo.remoteUrl ?? null,
    defaultBranch: repo.defaultBranch,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
  });

  db.close();

  console.log(`Repository initialized: ${basename(repoRoot)}`);
  console.log(`Metadata directory: ${configDir}`);
  console.log(`Database: ${getDatabasePath(repoRoot)}`);
  console.log(`Config: ${configPath}`);
}

function handleStatus(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const configPath = resolve(repoRoot, '.ai-history', 'config.json');

  if (!existsSync(configPath)) {
    console.log('AI Diff is not initialized in this repository. Run `ai init` first.');
    process.exitCode = 1;
    return;
  }

  const config = readAppConfig(configPath);
  const summary = getRepositorySummary(repoRoot);
  const db = new Database(getDatabasePath(repoRoot));
  const repo = db.prepare('SELECT name, root_path, default_branch FROM repositories ORDER BY created_at DESC LIMIT 1').get() as
    | { name: string; root_path: string; default_branch: string }
    | undefined;
  db.close();

  console.log('Repository:');
  console.log(`  ${repo?.name ?? basename(repoRoot)}`);
  console.log(`Branch: ${summary.branch}`);
  console.log(`Git: ${summary.head.slice(0, 12)}`);
  console.log(`Working tree: ${summary.dirty ? 'modified' : 'clean'}`);
  console.log(`Prompt retention: ${config.promptRetention}`);
  console.log(`Local-only mode: ${config.localOnly ? 'yes' : 'no'}`);

  if (summary.statusText.trim().length > 0) {
    console.log('Changes:');
    console.log(summary.statusText.split('\n').map((line) => `  ${line}`).join('\n'));
  }
}

async function main(): Promise<void> {
  const [command] = process.argv.slice(2);

  switch (command) {
    case 'init':
      await handleInit();
      break;
    case 'status':
      handleStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      printHelp();
      break;
  }
}

main().catch((error: Error) => {
  console.error(`AI Diff error: ${error.message}`);
  process.exitCode = 1;
});
