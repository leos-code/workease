-- WorkEase SQLite Database Schema
-- Based on PRD specifications

-- ============================================================================
-- Sessions Table
-- ============================================================================
-- Stores conversation contexts that contain multiple related tasks
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  task_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for faster session lookups by creation date
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- ============================================================================
-- Tasks Table
-- ============================================================================
-- Stores individual task executions within sessions
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  task_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'error', 'stopped')),
  cost REAL,
  duration INTEGER,
  favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes for common task queries
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_favorite ON tasks(favorite);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- ============================================================================
-- Messages Table
-- ============================================================================
-- Stores individual messages within task conversations
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('text', 'tool_use', 'tool_result', 'result', 'error', 'user', 'plan')),
  content TEXT,
  tool_name TEXT,
  tool_input TEXT,
  tool_output TEXT,
  tool_use_id TEXT,
  subtype TEXT,
  error_message TEXT,
  attachments TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================================
-- Files (Artifacts) Table
-- ============================================================================
-- Stores generated files and artifacts from task execution
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('html', 'jsx', 'code', 'document', 'spreadsheet', 'presentation', 'image', 'text', 'markdown', 'website')),
  path TEXT NOT NULL,
  preview TEXT,
  thumbnail TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for file queries
CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- ============================================================================
-- Settings Table
-- ============================================================================
-- Stores application configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for settings lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================================
-- Initial Settings Data
-- ============================================================================
-- Default application settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('language', 'en', datetime('now')),
  ('theme', 'auto', datetime('now')),
  ('auto_save', 'true', datetime('now')),
  ('sandbox_enabled', 'true', datetime('now')),
  ('sandbox_provider', 'claude-code', datetime('now')),
  ('skills_enabled', 'false', datetime('now'));

-- ============================================================================
-- Migration Tracking
-- ============================================================================
-- Track database schema version
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);

-- Initial migration
INSERT OR IGNORE INTO migrations (version, applied_at) VALUES
  ('1.0.0', datetime('now'));
