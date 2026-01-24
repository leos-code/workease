/**
 * Server Environment and Context Types
 */

export interface Env {
  // API Keys (from environment variables)
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;

  // Database
  DATABASE_PATH?: string;

  // Workspace
  WORK_DIR?: string;
  SESSIONS_DIR?: string;

  // Features
  SANDBOX_ENABLED?: string;
  MCP_ENABLED?: string;
}

export interface RequestContext {
  sessionId?: string;
  taskId?: string;
  userId?: string;
}

export interface StreamContext {
  sessionId: string;
  taskId: string;
  controller: AbortController;
}
