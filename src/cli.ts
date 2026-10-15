#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { createAppConfig, readAppConfig, writeAppConfig } from './config.js';
import { initializeDatabase, getDatabasePath } from './db.js';
import { detectGitRepository, getCurrentBranch, getCurrentHead } from './git.js';
import { getRepositorySummary, initializeRepository } from './repository.js';
import { addPrompt, createSession, finishSession, getActiveSession, listSessions } from './sessions.js';
import { buildTaskContext } from './context.js';
import { runMcpServer } from './mcp.js';

function printHelp(): void {
  console.log(`AI Diff CLI\n\nCommands:\n  ai init\n  ai status\n  ai context "task"\n  ai mcp\n  ai session start\n  ai session prompt "text"\n  ai session finish "summary"\n  ai session list\n  ai session show <id>\n  ai help\n`);
}

function getRepositoryRow(db: Database.Database): { id: string; name: string; root_path: string; default_branch: string } | undefined {
  return db
    .prepare('SELECT id, name, root_path, default_branch FROM repositories ORDER BY created_at DESC LIMIT 1')
    .get() as { id: string; name: string; root_path: string; default_branch: string } | undefined;
}

function openRepoDatabase(repoRoot: string): Database.Database {
  const configPath = resolve(repoRoot, '.ai-history', 'config.json');
  if (!existsSync(configPath)) {
    throw new Error('AI Diff is not initialized in this repository. Run `ai init` first.');
  }
  return new Database(getDatabasePath(repoRoot));
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
  const repo = getRepositoryRow(db);
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

function handleSessionStart(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  const existing = getActiveSession(db, repo.id);
  if (existing) {
    throw new Error(`An active session already exists: ${existing.id}`);
  }

  const args = process.argv.slice(3);
  const getFlag = (name: string): string | undefined => {
    const index = args.indexOf(name);
    if (index >= 0 && args[index + 1]) {
      return args[index + 1];
    }
    return undefined;
  };

  const session = createSession(db, {
    repositoryId: repo.id,
    provider: getFlag('--provider') ?? 'generic',
    model: getFlag('--model') ?? 'local',
    developer: getFlag('--developer') ?? 'unknown',
    branch: getCurrentBranch(repoRoot),
    baseSha: getCurrentHead(repoRoot),
    summary: 'Session started',
  });

  db.close();
  console.log(`Session started: ${session.id}`);
  console.log(`Provider: ${session.provider ?? 'generic'}`);
  console.log(`Branch: ${session.branch ?? 'unknown'}`);
  console.log(`Base SHA: ${session.baseSha ?? 'unknown'}`);
}

function handleSessionPrompt(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  const text = process.argv.slice(3).join(' ').trim();
  if (!text) {
    throw new Error('No prompt text was provided. Use `ai session prompt "your request"`.');
  }

  const session = getActiveSession(db, repo.id);
  if (!session) {
    throw new Error('No active session found. Start one with `ai session start`.');
  }

  const prompt = addPrompt(db, session.id, text, 'summary');
  db.close();
  console.log(`Prompt recorded for ${session.id}`);
  console.log(`Summary: ${prompt.summary}`);
}

function handleSessionFinish(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  const session = getActiveSession(db, repo.id);
  if (!session) {
    throw new Error('No active session found. Start one with `ai session start`.');
  }

  const summary = process.argv.slice(3).join(' ').trim() || 'Session completed';
  const finalized = finishSession(db, session.id, summary, getCurrentHead(repoRoot), repoRoot);
  db.close();

  console.log(`Session finished: ${finalized.id}`);
  console.log(`Status: ${finalized.status}`);
  console.log(`Final SHA: ${finalized.finalSha ?? 'unknown'}`);
}

function handleSessionList(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  const sessions = listSessions(db, repo.id);
  db.close();

  if (sessions.length === 0) {
    console.log('No sessions recorded for this repository.');
    return;
  }

  for (const session of sessions) {
    console.log(`${session.id}  ${session.status}  ${session.branch ?? 'unknown'}  ${session.summary ?? ''}`.trim());
  }
}

function handleSessionShow(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const sessionId = process.argv[3];
  if (!sessionId) {
    throw new Error('A session ID is required. Example: `ai session show session-123`.');
  }

  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(sessionId) as any;
  db.close();

  if (!session) {
    console.log(`Session not found: ${sessionId}`);
    return;
  }

  console.log(`Session: ${session.id}`);
  console.log(`Provider: ${session.provider ?? 'unknown'}`);
  console.log(`Model: ${session.model ?? 'unknown'}`);
  console.log(`Status: ${session.status}`);
  console.log(`Branch: ${session.branch ?? 'unknown'}`);
  console.log(`Base SHA: ${session.base_sha ?? 'unknown'}`);
  console.log(`Final SHA: ${session.final_sha ?? 'unknown'}`);
  console.log(`Summary: ${session.summary ?? 'n/a'}`);
}

function handleMcp(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  runMcpServer(db, repo.id);
}

function handleContext(): void {
  const repoRoot = detectGitRepository(process.cwd());
  const db = openRepoDatabase(repoRoot);
  const repo = getRepositoryRow(db);
  if (!repo) {
    throw new Error('Repository metadata not found. Run `ai init` first.');
  }

  const task = process.argv.slice(3).join(' ').trim();
  if (!task) {
    throw new Error('A task description is required. Example: `ai context "add organization auth support"`');
  }

  const context = buildTaskContext(db, repo.id, task);
  db.close();

  console.log(`Context for: ${task}`);
  console.log(`Git state: ${context.currentGitState}`);
  console.log('Relevant AI Commits:');
  if (context.relevantAiCommits.length === 0) {
    console.log('  none');
  } else {
    for (const item of context.relevantAiCommits) {
      console.log(`  - ${item.title} (score ${item.score})`);
      console.log(`      ${item.summary}`);
    }
  }

  console.log('Relevant Sessions:');
  if (context.relevantSessions.length === 0) {
    console.log('  none');
  } else {
    for (const item of context.relevantSessions) {
      console.log(`  - ${item.title} (score ${item.score})`);
      console.log(`      ${item.summary}`);
    }
  }

  console.log('Important decisions:');
  for (const item of context.importantDecisions) {
    console.log(`  - ${item}`);
  }

  console.log('Dependencies:');
  for (const item of context.dependencies) {
    console.log(`  - ${item}`);
  }

  console.log('Known issues:');
  for (const item of context.knownIssues) {
    console.log(`  - ${item}`);
  }

  console.log('Unresolved work:');
  for (const item of context.unresolvedWork) {
    console.log(`  - ${item}`);
  }

  console.log('Relevant files:');
  for (const item of context.relevantFiles) {
    console.log(`  - ${item}`);
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'init':
      await handleInit();
      break;
    case 'status':
      handleStatus();
      break;
    case 'context':
      handleContext();
      break;
    case 'mcp':
      handleMcp();
      break;
    case 'session':
      switch (rest[0]) {
        case 'start':
          handleSessionStart();
          break;
        case 'prompt':
          handleSessionPrompt();
          break;
        case 'finish':
          handleSessionFinish();
          break;
        case 'list':
          handleSessionList();
          break;
        case 'show':
          handleSessionShow();
          break;
        default:
          printHelp();
          break;
      }
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
