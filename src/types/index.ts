/**
 * Core data types for WorkEase application
 * Based on PRD specifications for Sessions, Tasks, Messages, and Files
 */

// ============================================================================
// Database Models (SQLite)
// ============================================================================

/**
 * Session - A conversation context that can contain multiple related tasks
 * Corresponds to 'sessions' table in SQLite database
 */
export interface Session {
  id: string;
  prompt: string;
  task_count: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Task - A single user task execution within a session
 * Corresponds to 'tasks' table in SQLite database
 */
export interface Task {
  id: string;
  session_id: string;
  task_index: number;
  prompt: string;
  status: TaskStatus;
  cost?: number;
  duration?: number; // in milliseconds
  favorite: boolean;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Task status enumeration
 */
export type TaskStatus = 'running' | 'completed' | 'error' | 'stopped';

/**
 * Message - A single message within a task conversation
 * Corresponds to 'messages' table in SQLite database
 */
export interface Message {
  id: number; // Auto-increment primary key
  task_id: string;
  type: MessageType;
  content?: string;
  tool_name?: string;
  tool_input?: string; // JSON string
  tool_output?: string;
  tool_use_id?: string;
  subtype?: string;
  error_message?: string;
  attachments?: string; // JSON string array
  created_at: string; // ISO 8601 timestamp
}

/**
 * Message type enumeration
 */
export type MessageType =
  | 'text'           // Plain text message from agent
  | 'tool_use'       // Agent using a tool
  | 'tool_result'    // Result from tool execution
  | 'result'         // Final result
  | 'error'          // Error message
  | 'user'           // User message
  | 'plan';          // Planning phase message

/**
 * File/Artifact - Generated files from task execution
 * Corresponds to 'files' table in SQLite database
 */
export interface Artifact {
  id: number; // Auto-increment primary key
  task_id: string;
  name: string;
  type: ArtifactType;
  path: string;
  preview?: string;
  thumbnail?: string;
  is_favorite: boolean;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Artifact/File type enumeration
 */
export type ArtifactType =
  | 'html'
  | 'jsx'
  | 'code'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'text'
  | 'markdown'
  | 'website';

/**
 * Settings - Application configuration
 * Corresponds to 'settings' table in SQLite database
 */
export interface Setting {
  key: string;
  value: string;
  updated_at: string; // ISO 8601 timestamp
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to execute a new task
 */
export interface ExecuteTaskRequest {
  prompt: string;
  work_dir?: string;
  task_id: string;
  model_config?: ModelConfig;
  sandbox_config?: SandboxConfig;
  images?: ImageAttachment[];
  conversation?: ConversationMessage[];
  skills_path?: string;
}

/**
 * Model configuration for AI provider
 */
export interface ModelConfig {
  api_key?: string;
  base_url?: string;
  model?: string;
  provider?: 'anthropic' | 'openai' | 'openrouter' | 'custom';
}

/**
 * Sandbox execution configuration
 */
export interface SandboxConfig {
  enabled: boolean;
  provider?: 'claude-code' | 'codex' | 'native';
}

/**
 * Image attachment for multimodal input
 */
export interface ImageAttachment {
  data: string; // Base64 encoded
  mime_type: string;
}

/**
 * Message in conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// SSE Streaming Message Types
// ============================================================================

/**
 * Server-Sent Event message types for streaming responses
 */
export type AgentStreamMessage =
  | { type: 'session'; session_id: string }
  | { type: 'text'; content: string }
  | { type: 'tool_use'; name: string; input: unknown; id: string }
  | { type: 'tool_result'; tool_use_id: string; output: string }
  | { type: 'plan'; plan: TaskPlan }
  | { type: 'direct_answer'; content: string }
  | { type: 'permission_request'; permission: PermissionRequest }
  | { type: 'error'; message: string }
  | { type: 'done' };

// ============================================================================
// Planning & Execution Types
// ============================================================================

/**
 * Task execution plan (two-phase execution)
 */
export interface TaskPlan {
  goal: string;
  steps: PlanStep[];
}

/**
 * Single step in execution plan
 */
export interface PlanStep {
  id: string;
  description: string;
  status: StepStatus;
}

/**
 * Step status in execution plan
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Permission request for dangerous operations
 */
export interface PermissionRequest {
  id: string;
  prompt: string;
  options: PermissionOption[];
}

/**
 * Permission option for user approval
 */
export interface PermissionOption {
  label: string;
  value: string;
  description?: string;
}

// ============================================================================
// Tool Execution Types
// ============================================================================

/**
 * Available tools for agent execution
 */
export type ToolName =
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'Bash'
  | 'Glob'
  | 'Grep'
  | 'WebSearch'
  | 'WebFetch'
  | 'Task'
  | 'AskUserQuestion'
  | 'browser_snapshot'
  | 'browser_click'
  | 'browser_type'
  | 'browser_navigate';

/**
 * Tool execution result
 */
export interface ToolResult {
  tool_name: string;
  tool_use_id: string;
  output: string;
  error?: string;
}

// ============================================================================
// File System Types
// ============================================================================

/**
 * File node in workspace file tree
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified_at?: string;
  children?: FileNode[];
}

// ============================================================================
// Settings & Configuration Types
// ============================================================================

/**
 * Application settings structure
 */
export interface AppSettings {
  // Account
  api_key?: string;
  user_name?: string;

  // General
  language: 'zh' | 'en';
  theme: 'light' | 'dark' | 'auto';
  auto_save: boolean;

  // Workspace
  work_dir: string;
  sessions_dir: string;

  // Model
  default_provider: 'anthropic' | 'openai' | 'openrouter' | 'custom';
  default_model: string;
  api_endpoint?: string;

  // MCP
  mcp_servers: MCPServerConfig[];
  mcp_config_path: string;

  // Skills
  skills_enabled: boolean;
  skills_dir: string;

  // Sandbox
  sandbox_enabled: boolean;
  sandbox_provider: 'claude-code' | 'codex' | 'native';
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Database Query Types
// ============================================================================

/**
 * Filters for task queries
 */
export interface TaskFilters {
  session_id?: string;
  status?: TaskStatus;
  favorite?: boolean;
  search_query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Filters for message queries
 */
export interface MessageFilters {
  task_id: string;
  type?: MessageType;
  limit?: number;
  offset?: number;
}
