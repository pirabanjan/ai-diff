import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../src/db.js';
import { initializeRepository } from '../src/repository.js';
import { createAiCommit, addSessionToAiCommit } from '../src/ai-commits.js';
import { createSession } from '../src/sessions.js';
import { handleMcpRequest } from '../src/mcp.js';

describe('Phase 7 MCP server', () => {
  let tempRoot: string;
  let repoId: string;

  beforeEach(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'aidiff-phase7-'));
    const { execSync } = await import('node:child_process');
    execSync('git init', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.name "Test User"', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git config user.email "test@example.com"', { cwd: tempRoot, stdio: 'inherit' });
    writeFileSync(join(tempRoot, 'readme.md'), '# Phase 7\n');
    execSync('git add readme.md', { cwd: tempRoot, stdio: 'inherit' });
    execSync('git commit -m "initial"', { cwd: tempRoot, stdio: 'inherit' });

    const db = initializeDatabase(tempRoot);
    const repo = await initializeRepository(tempRoot);
    repoId = repo.id;

    const session = createSession(db, {
      repositoryId: repo.id,
      provider: 'generic',
      model: 'local',
      developer: 'alice',
      branch: 'main',
      summary: 'Investigated organization auth flow',
    });

    const commit = createAiCommit(db, {
      repositoryId: repo.id,
      title: 'Organization auth support',
      description: 'Added org-aware login flow and auth guard checks.',
      originalIntent: 'support organizations in authentication',
      status: 'completed',
      semanticSummary: 'Support organizations in auth',
    });

    addSessionToAiCommit(db, commit.id, session.id, 'worked on org authentication');
    db.close();
  });

  it('exposes the MCP tool catalogue and resolves relevant context through JSON-RPC', () => {
    const db = initializeDatabase(tempRoot);
    const toolsResponse = handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }, db, repoId);

    expect(toolsResponse.result.tools).toBeDefined();
    expect(toolsResponse.result.tools.some((tool: any) => tool.name === 'get_relevant_context')).toBe(true);

    const contextResponse = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'get_relevant_context', arguments: { task: 'modify authentication to support organizations' } },
      },
      db,
      repoId
    );

    expect(contextResponse.result.content[0].text).toContain('Organization');
    expect(contextResponse.result.content[0].text).toContain('authentication');

    db.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
});
