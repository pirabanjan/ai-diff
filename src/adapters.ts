import type Database from 'better-sqlite3';
import { addPrompt, createSession, finishSession, getSessionById } from './sessions.js';
import type { AiSession, PromptRecord, PromptRetentionMode, SessionStatus } from './types.js';

export interface AgentSessionStartEvent {
  provider?: string;
  model?: string;
  externalSessionId?: string;
  developer?: string;
  branch?: string;
  baseSha?: string;
  finalSha?: string;
  summary?: string;
}

export interface AgentPromptEvent {
  sessionId: string;
  rawText: string;
  retentionMode?: PromptRetentionMode;
}

export interface AgentToolEvent {
  sessionId: string;
  eventType: string;
  payload?: unknown;
  sequence?: number;
}

export interface AgentSessionEndEvent {
  sessionId: string;
  summary?: string;
  finalSha?: string;
}

export interface AgentAdapter {
  onSessionStart(event: AgentSessionStartEvent): Promise<AiSession>;
  onPrompt(event: AgentPromptEvent): Promise<PromptRecord>;
  onToolEvent(event: AgentToolEvent): Promise<void>;
  onSessionEnd(event: AgentSessionEndEvent): Promise<AiSession>;
}

function recordSessionEvent(
  db: Database.Database,
  sessionId: string,
  eventType: string,
  payload?: unknown,
  sequence?: number
): void {
  const countRow = db
    .prepare('SELECT COUNT(*) as count FROM session_events WHERE session_id = ?')
    .get(sessionId) as { count: number } | undefined;

  const nextSequence = sequence ?? Number(countRow?.count ?? 0) + 1;
  const payloadJson = payload === undefined ? null : JSON.stringify(payload);

  db.prepare(
    `INSERT INTO session_events (id, session_id, event_type, sequence, payload_json, created_at)
     VALUES (@id, @sessionId, @eventType, @sequence, @payloadJson, @createdAt)`
  ).run({
    id: `event-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    sessionId,
    eventType,
    sequence: nextSequence,
    payloadJson,
    createdAt: new Date().toISOString(),
  });
}

export class GenericAgentAdapter implements AgentAdapter {
  constructor(
    private readonly db: Database.Database,
    private readonly repositoryId: string,
    private readonly defaults: {
      provider?: string;
      model?: string;
      developer?: string;
    } = {}
  ) {}

  async onSessionStart(event: AgentSessionStartEvent): Promise<AiSession> {
    const session = createSession(this.db, {
      repositoryId: this.repositoryId,
      provider: event.provider ?? this.defaults.provider ?? 'generic',
      model: event.model ?? this.defaults.model ?? 'local',
      developer: event.developer ?? this.defaults.developer ?? 'unknown',
      branch: event.branch ?? 'main',
      baseSha: event.baseSha ?? 'unknown',
      finalSha: event.finalSha,
      summary: event.summary ?? 'Session started',
      status: 'active',
    });

    recordSessionEvent(this.db, session.id, 'session_start', {
      provider: session.provider,
      model: session.model,
      developer: session.developer,
      summary: session.summary,
    });

    return session;
  }

  async onPrompt(event: AgentPromptEvent): Promise<PromptRecord> {
    const prompt = addPrompt(this.db, event.sessionId, event.rawText, event.retentionMode ?? 'summary');
    recordSessionEvent(this.db, event.sessionId, 'prompt', {
      rawText: event.rawText,
      summary: prompt.summary,
      sequence: prompt.sequence,
    });
    return prompt;
  }

  async onToolEvent(event: AgentToolEvent): Promise<void> {
    const session = getSessionById(this.db, event.sessionId);
    if (!session) {
      throw new Error(`Session ${event.sessionId} not found.`);
    }

    recordSessionEvent(this.db, event.sessionId, event.eventType, event.payload, event.sequence);
  }

  async onSessionEnd(event: AgentSessionEndEvent): Promise<AiSession> {
    const session = getSessionById(this.db, event.sessionId);
    if (!session) {
      throw new Error(`Session ${event.sessionId} not found.`);
    }

    const finalSession = finishSession(this.db, session.id, event.summary ?? session.summary ?? 'Session completed', event.finalSha);
    recordSessionEvent(this.db, finalSession.id, 'session_end', {
      summary: finalSession.summary,
      finalSha: finalSession.finalSha,
    });
    return finalSession;
  }
}

export class GitHubCopilotAdapter extends GenericAgentAdapter {
  constructor(db: Database.Database, repositoryId: string, defaults: { model?: string; developer?: string } = {}) {
    super(db, repositoryId, {
      provider: 'github-copilot',
      model: defaults.model ?? 'copilot',
      developer: defaults.developer ?? 'copilot',
    });
  }
}

export class ClaudeCodeAdapter extends GenericAgentAdapter {
  constructor(db: Database.Database, repositoryId: string, defaults: { model?: string; developer?: string } = {}) {
    super(db, repositoryId, {
      provider: 'claude-code',
      model: defaults.model ?? 'claude',
      developer: defaults.developer ?? 'claude',
    });
  }
}
