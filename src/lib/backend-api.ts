/**
 * Backend API Client Service
 * Connects frontend to WorkEase backend agent execution system
 *
 * Features:
 * - SSE (Server-Sent Events) streaming for real-time updates
 * - Agent execution with two-phase process (plan + execute)
 * - Tool use and result streaming
 * - Error handling
 */

import type { AgentStreamMessage, ExecuteTaskRequest, TaskPlan } from "../types";

/**
 * Backend API configuration
 */
export interface BackendConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * Agent execution callbacks
 */
export interface AgentCallbacks {
  onSession: (sessionId: string) => void;
  onText: (content: string) => void;
  onToolUse: (name: string, input: unknown, id: string) => void;
  onToolResult: (toolUseId: string, output: string) => void;
  onPlan: (plan: TaskPlan) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

/**
 * Default backend configuration
 */
const DEFAULT_CONFIG: BackendConfig = {
  baseUrl: "http://localhost:3000", // Default Hono server address
  timeout: 300000, // 5 minutes default
};

/**
 * Execute a task via the backend agent system with SSE streaming
 *
 * @param request - Task execution request
 * @param callbacks - Event callbacks for streaming responses
 * @param config - Backend API configuration
 * @returns Cleanup function to abort the execution
 */
export function executeAgent(
  request: ExecuteTaskRequest,
  callbacks: AgentCallbacks,
  config: Partial<BackendConfig> = {}
): () => void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const url = `${fullConfig.baseUrl}/agent/execute`;

  // Create abort controller for cleanup
  const abortController = new AbortController();

  // Start the execution
  executeAgentInternal(url, request, callbacks, abortController.signal).catch((error) => {
    console.error("[Backend API] Execution failed:", error);
    callbacks.onError(error instanceof Error ? error.message : String(error));
  });

  // Return cleanup function
  return () => {
    abortController.abort();
  };
}

/**
 * Internal SSE execution implementation
 */
async function executeAgentInternal(
  url: string,
  request: ExecuteTaskRequest,
  callbacks: AgentCallbacks,
  signal: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }

    // Check if response is SSE
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("text/event-stream")) {
      throw new Error(`Expected SSE stream, got ${contentType}`);
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();

          if (!data) continue; // Skip empty data

          try {
            const message: AgentStreamMessage = JSON.parse(data);

            // Route message to appropriate callback
            switch (message.type) {
              case "session":
                callbacks.onSession(message.session_id);
                break;

              case "text":
                callbacks.onText(message.content);
                break;

              case "tool_use":
                callbacks.onToolUse(
                  message.name,
                  message.input,
                  message.id
                );
                break;

              case "tool_result":
                callbacks.onToolResult(
                  message.tool_use_id,
                  message.output
                );
                break;

              case "plan":
                callbacks.onPlan(message.plan);
                break;

              case "error":
                callbacks.onError(message.message);
                break;

              case "done":
                callbacks.onDone();
                return; // Exit on done signal
            }
          } catch (error) {
            console.error("[Backend API] Failed to parse SSE message:", data, error);
          }
        }
      }
    }
  } catch (error) {
    // Don't error if aborted
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    throw error;
  }
}

/**
 * Stop a running task execution
 *
 * @param sessionId - Session ID to stop
 * @param config - Backend API configuration
 */
export async function stopAgent(
  sessionId: string,
  config: Partial<BackendConfig> = {}
): Promise<void> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const url = `${fullConfig.baseUrl}/agent/stop`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to stop agent: ${response.status} - ${errorText}`);
  }
}

/**
 * Health check for backend server
 *
 * @param config - Backend API configuration
 * @returns true if backend is healthy
 */
export async function healthCheck(
  config: Partial<BackendConfig> = {}
): Promise<boolean> {
  try {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const url = `${fullConfig.baseUrl}/health`;

    const response = await fetch(url, {
      method: "GET",
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get backend server status
 *
 * @param config - Backend API configuration
 * @returns Server status information
 */
export async function getServerStatus(
  config: Partial<BackendConfig> = {}
): Promise<{ status: string; uptime: number } | null> {
  try {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const url = `${fullConfig.baseUrl}/health`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Build agent execution request from user prompt
 *
 * @param prompt - User's task prompt
 * @param taskId - Unique task ID
 * @param options - Optional execution parameters
 * @returns ExecuteTaskRequest object
 */
export function buildExecutionRequest(
  prompt: string,
  taskId: string,
  options: {
    workDir?: string;
    conversation?: Array<{ role: string; content: string }>;
    modelConfig?: ExecuteTaskRequest["model_config"];
    sandboxConfig?: ExecuteTaskRequest["sandbox_config"];
    skillsPath?: string;
  } = {}
): ExecuteTaskRequest {
  return {
    prompt,
    task_id: taskId,
    work_dir: options.workDir,
    conversation: options.conversation,
    model_config: options.modelConfig,
    sandbox_config: options.sandboxConfig,
    skills_path: options.skillsPath,
  };
}

/**
 * Utility to generate a unique task ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Utility to format tool input for display
 */
export function formatToolInput(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input === null || input === undefined) {
    return "";
  }

  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

/**
 * Utility to format tool output for display
 */
export function formatToolOutput(output: string): string {
  // Truncate very long outputs
  const maxLength = 500;
  if (output.length > maxLength) {
    return output.substring(0, maxLength) + `\n... (${output.length - maxLength} more characters)`;
  }
  return output;
}
