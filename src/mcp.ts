import type Database from 'better-sqlite3';
import { getAiCommitById, listAiCommits } from './ai-commits.js';
import { compareAiCommits, resolveAiDiffTarget } from './ai-diff.js';
import { buildTaskContext, searchProjectHistory } from './context.js';
import { getCurrentBranch, getCurrentHead } from './git.js';
import { getRepositorySummary } from './repository.js';
import { getSessionById, listSessions } from './sessions.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_ai_commit',
    description: 'Return details for a single AI commit by id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'list_ai_commits',
    description: 'List AI commits in the repository.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_session',
    description: 'Return details for a single session by id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'search_history',
    description: 'Search project history for relevant AI commits and sessions.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'get_relevant_context',
    description: 'Return a compact task-oriented context summary with relevant history and git state.',
    inputSchema: {
      type: 'object',
      properties: { task: { type: 'string' } },
      required: ['task'],
    },
  },
  {
    name: 'get_ai_diff',
    description: 'Compare two AI commit ids and return a structured diff summary.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_dependencies',
    description: 'List dependency or relation metadata for an AI commit.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
    },
  },
  {
    name: 'get_validation',
    description: 'Return validation metadata or known commands for the repository.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_current_status',
    description: 'Return the active repository status, current branch, and recent session summary.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

function jsonRpcSuccess(id: number | string | null, result: unknown): { jsonrpc: '2.0'; id: number | string | null; result: unknown } {
  return {
    jsonrpc: '2.0' as const,
    id,
    result,
  };
}

function jsonRpcError(id: number | string | null, code: number, message: string): { jsonrpc: '2.0'; id: number | string | null; error: { code: number; message: string } } {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
    },
  };
}

function asToolResult(payload: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

export function handleMcpRequest(
  request: any,
  db: Database.Database,
  repositoryId?: string
): { jsonrpc: '2.0'; id: number | string | null; result?: unknown; error?: unknown } {
  const repoId = repositoryId ?? (db.prepare('SELECT id FROM repositories ORDER BY created_at DESC LIMIT 1').get() as { id?: string } | undefined)?.id;

  if (!request || typeof request !== 'object') {
    return jsonRpcError(null, -32600, 'Invalid request payload.');
  }

  const { method, id, params = {} } = request;

  switch (method) {
    case 'initialize':
      return jsonRpcSuccess(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: 'aidiff-mcp',
          version: '0.1.0',
        },
      });
    case 'tools/list':
      return jsonRpcSuccess(id, { tools: MCP_TOOLS });
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};
      if (!toolName || typeof toolName !== 'string') {
        return jsonRpcError(id, -32602, 'Tool name is required.');
      }

      try {
        switch (toolName) {
          case 'get_ai_commit': {
            const value = getAiCommitById(db, toolArgs.id ?? toolArgs.aiCommitId);
            return jsonRpcSuccess(id, asToolResult(value ?? { error: 'AI commit not found.' }));
          }
          case 'list_ai_commits': {
            const rows = listAiCommits(db, repoId);
            return jsonRpcSuccess(id, asToolResult(rows));
          }
          case 'get_session': {
            const value = getSessionById(db, toolArgs.id ?? toolArgs.sessionId);
            return jsonRpcSuccess(id, asToolResult(value ?? { error: 'Session not found.' }));
          }
          case 'search_history': {
            const query = String(toolArgs.query ?? '');
            if (!query) {
              return jsonRpcError(id, -32602, 'A search query is required.');
            }
            if (!repoId) {
              return jsonRpcError(id, -32603, 'No repository is available for this database.');
            }
            return jsonRpcSuccess(id, asToolResult(searchProjectHistory(db, repoId, query, toolArgs.limit ?? 5)));
          }
          case 'get_relevant_context': {
            const task = String(toolArgs.task ?? '');
            if (!task) {
              return jsonRpcError(id, -32602, 'A task description is required.');
            }
            if (!repoId) {
              return jsonRpcError(id, -32603, 'No repository is available for this database.');
            }
            return jsonRpcSuccess(id, asToolResult(buildTaskContext(db, repoId, task, toolArgs.limit ?? 5)));
          }
          case 'get_ai_diff': {
            const fromId = toolArgs.from ?? toolArgs.fromId;
            const toId = toolArgs.to ?? toolArgs.toId;
            if (!fromId || !toId) {
              return jsonRpcError(id, -32602, 'Both from and to AI commit ids are required.');
            }
            const value = compareAiCommits(db, String(fromId), String(toId));
            return jsonRpcSuccess(id, asToolResult(value));
          }
          case 'get_dependencies': {
            const idValue = toolArgs.id ?? toolArgs.aiCommitId;
            const rows = idValue
              ? (db.prepare('SELECT * FROM ai_commit_relations WHERE source_ai_commit_id = ? OR target_ai_commit_id = ? ORDER BY created_at DESC').all(String(idValue), String(idValue)) as any[])
              : (db.prepare('SELECT * FROM ai_commit_relations ORDER BY created_at DESC LIMIT 25').all() as any[]);
            return jsonRpcSuccess(id, asToolResult(rows));
          }
          case 'get_validation': {
            const status = getRepositorySummary(process.cwd());
            const validation = {
              commands: ['npm test', 'npm run build', 'npm run typecheck'],
              repoStatus: status,
              note: 'No custom validation events were recorded in the local database.',
            };
            return jsonRpcSuccess(id, asToolResult(validation));
          }
          case 'get_current_status': {
            if (!repoId) {
              return jsonRpcError(id, -32603, 'No repository is available for this database.');
            }
            const repoSummary = getRepositorySummary(process.cwd());
            const latestSessions = listSessions(db, repoId).slice(0, 5);
            const latestCommits = listAiCommits(db, repoId).slice(0, 5);
            const status = {
              repositoryId: repoId,
              branch: getCurrentBranch(process.cwd()),
              head: getCurrentHead(process.cwd()),
              dirty: repoSummary.dirty,
              statusText: repoSummary.statusText,
              latestSessions,
              latestCommits,
            };
            return jsonRpcSuccess(id, asToolResult(status));
          }
          default:
            return jsonRpcError(id, -32601, `Unknown tool: ${toolName}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool execution failed.';
        return jsonRpcError(id, -32000, message);
      }
    }
    default:
      return jsonRpcError(id, -32601, `Method not found: ${String(method)}`);
  }
}

function readMcpMessages(buffer: string): { messages: any[]; remaining: string } {
  const messages: any[] = [];
  let remaining = buffer;

  while (remaining.length > 0) {
    const headerIndex = remaining.indexOf('\r\n\r\n');
    if (headerIndex === -1) {
      break;
    }

    const headerBlock = remaining.slice(0, headerIndex);
    const contentLengthMatch = headerBlock.match(/content-length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      break;
    }

    const contentLength = Number(contentLengthMatch[1]);
    const payloadStart = headerIndex + 4;
    const payloadEnd = payloadStart + contentLength;
    if (remaining.length < payloadEnd) {
      break;
    }

    const messageText = remaining.slice(payloadStart, payloadEnd);
    try {
      messages.push(JSON.parse(messageText));
    } catch {
      messages.push({ invalid: true, raw: messageText });
    }

    remaining = remaining.slice(payloadEnd);
  }

  if (messages.length === 0 && remaining.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(remaining.trim());
      return { messages: [parsed], remaining: '' };
    } catch {
      return { messages: [], remaining };
    }
  }

  return { messages, remaining };
}

export function runMcpServer(db: Database.Database, repositoryId?: string): void {
  let buffer = '';

  const emit = (response: unknown) => {
    const payload = JSON.stringify(response);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(payload, 'utf8')}\r\n\r\n${payload}`);
    process.stdout.write('\n');
  };

  process.stdin.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    const { messages, remaining } = readMcpMessages(buffer);
    buffer = remaining;

    for (const message of messages) {
      if (message && typeof message === 'object' && 'method' in message) {
        const response = handleMcpRequest(message, db, repositoryId);
        emit(response);
      }
    }
  });
}
