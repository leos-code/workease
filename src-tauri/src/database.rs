/**
 * Database Module - WorkEase SQLite Integration
 *
 * Provides complete CRUD operations for all entities:
 * - Sessions
 * - Tasks
 * - Messages
 * - Files (Artifacts)
 * - Settings
 *
 * Uses rusqlite with bundled SQLite for cross-platform support
 */

use rusqlite::{Connection, Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

// ============================================================================
// Database Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub prompt: String,
    pub task_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub session_id: String,
    pub task_index: i32,
    pub prompt: String,
    pub status: String,
    pub cost: Option<f64>,
    pub duration: Option<i32>,
    pub favorite: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub id: Option<i64>,
    pub task_id: String,
    pub message_type: String,
    pub content: Option<String>,
    pub tool_name: Option<String>,
    pub tool_input: Option<String>,
    pub tool_output: Option<String>,
    pub tool_use_id: Option<String>,
    pub subtype: Option<String>,
    pub error_message: Option<String>,
    pub attachments: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileArtifact {
    pub id: Option<i64>,
    pub task_id: String,
    pub name: String,
    pub file_type: String,
    pub path: String,
    pub preview: Option<String>,
    pub thumbnail: Option<String>,
    pub is_favorite: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

// ============================================================================
// Database Manager
// ============================================================================

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Initialize database with schema
    pub fn new(db_path: &Path) -> SqliteResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;

        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };

        // Initialize schema
        db.init_schema()?;

        Ok(db)
    }

    /// Get default database path
    pub fn default_path() -> PathBuf {
        // Use app data directory
        let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        path.push(".workease");
        path.push("workease.db");
        path
    }

    /// Initialize database schema
    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

        // Sessions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                prompt TEXT NOT NULL,
                task_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC)",
            [],
        )?;

        // Tasks table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
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
            )",
            [],
        )?;

        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_favorite ON tasks(favorite)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC)", [])?;

        // Messages table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS messages (
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
            )",
            [],
        )?;

        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)", [])?;

        // Files table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS files (
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
            )",
            [],
        )?;

        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_type ON files(type)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(is_favorite)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)", [])?;

        // Settings table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute("CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)", [])?;

        // Migrations table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL UNIQUE,
                applied_at TEXT NOT NULL
            )",
            [],
        )?;

        // Insert default settings
        let now = Utc::now().to_rfc3339();
        let defaults = vec![
            ("language", "en"),
            ("theme", "auto"),
            ("auto_save", "true"),
            ("sandbox_enabled", "true"),
            ("sandbox_provider", "claude-code"),
            ("skills_enabled", "false"),
        ];

        for (key, value) in defaults {
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
                params![key, value, now],
            )?;
        }

        // Insert initial migration
        conn.execute(
            "INSERT OR IGNORE INTO migrations (version, applied_at) VALUES ('1.0.0', ?1)",
            params![now],
        )?;

        Ok(())
    }

    // ========================================================================
    // Session Operations
    // ========================================================================

    pub fn create_session(&self, prompt: &str) -> SqliteResult<Session> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO sessions (id, prompt, task_count, created_at, updated_at)
             VALUES (?1, ?2, 0, ?3, ?3)",
            params![id, prompt, now],
        )?;

        Ok(Session {
            id,
            prompt: prompt.to_string(),
            task_count: 0,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_session(&self, id: &str) -> SqliteResult<Option<Session>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, prompt, task_count, created_at, updated_at
             FROM sessions WHERE id = ?1"
        )?;

        let sessions = stmt.query_map(params![id], |row| {
            Ok(Session {
                id: row.get(0)?,
                prompt: row.get(1)?,
                task_count: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        sessions.into_iter().next().transpose()
    }

    pub fn list_sessions(&self, limit: Option<i32>, offset: Option<i32>) -> SqliteResult<Vec<Session>> {
        let conn = self.conn.lock().unwrap();
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);

        let mut stmt = conn.prepare(
            format!(
                "SELECT id, prompt, task_count, created_at, updated_at
                 FROM sessions ORDER BY created_at DESC LIMIT {} OFFSET {}",
                limit, offset
            )
        )?;

        let sessions = stmt.query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                prompt: row.get(1)?,
                task_count: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        sessions.collect()
    }

    pub fn update_session(&self, id: &str, prompt: Option<&str>) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        if let Some(new_prompt) = prompt {
            conn.execute(
                "UPDATE sessions SET prompt = ?1, updated_at = ?2 WHERE id = ?3",
                params![new_prompt, now, id],
            )?;
        }

        Ok(())
    }

    pub fn delete_session(&self, id: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ========================================================================
    // Task Operations
    // ========================================================================

    pub fn create_task(
        &self,
        session_id: &str,
        task_index: i32,
        prompt: &str,
    ) -> SqliteResult<Task> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tasks (id, session_id, task_index, prompt, status, favorite, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 'running', 0, ?5, ?5)",
            params![id, session_id, task_index, prompt, now],
        )?;

        // Update session task count
        conn.execute(
            "UPDATE sessions SET task_count = task_count + 1, updated_at = ?1 WHERE id = ?2",
            params![now, session_id],
        )?;

        Ok(Task {
            id,
            session_id: session_id.to_string(),
            task_index,
            prompt: prompt.to_string(),
            status: "running".to_string(),
            cost: None,
            duration: None,
            favorite: false,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn get_task(&self, id: &str) -> SqliteResult<Option<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
             FROM tasks WHERE id = ?1"
        )?;

        let tasks = stmt.query_map(params![id], |row| {
            Ok(Task {
                id: row.get(0)?,
                session_id: row.get(1)?,
                task_index: row.get(2)?,
                prompt: row.get(3)?,
                status: row.get(4)?,
                cost: row.get(5)?,
                duration: row.get(6)?,
                favorite: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        tasks.into_iter().next().transpose()
    }

    pub fn list_tasks(
        &self,
        session_id: Option<&str>,
        status: Option<&str>,
        favorite: Option<bool>,
        limit: Option<i32>,
    ) -> SqliteResult<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let limit = limit.unwrap_or(50);

        let (query, params) = match (session_id, status, favorite) {
            (Some(sid), Some(st), Some(fav)) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks WHERE session_id = ?1 AND status = ?2 AND favorite = ?3 ORDER BY created_at DESC LIMIT ?4".to_string(),
                vec![sid.to_string(), st.to_string(), if fav { "1" } else { "0" }.to_string(), limit.to_string()]
            ),
            (Some(sid), Some(st), None) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks WHERE session_id = ?1 AND status = ?2 ORDER BY created_at DESC LIMIT ?3".to_string(),
                vec![sid.to_string(), st.to_string(), limit.to_string()]
            ),
            (Some(sid), None, None) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks WHERE session_id = ?1 ORDER BY created_at DESC LIMIT ?2".to_string(),
                vec![sid.to_string(), limit.to_string()]
            ),
            (None, Some(st), None) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2".to_string(),
                vec![st.to_string(), limit.to_string()]
            ),
            (None, None, Some(fav)) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks WHERE favorite = ?1 ORDER BY created_at DESC LIMIT ?2".to_string(),
                vec![if fav { "1" } else { "0" }.to_string(), limit.to_string()]
            ),
            (None, None, None) => (
                "SELECT id, session_id, task_index, prompt, status, cost, duration, favorite, created_at, updated_at
                 FROM tasks ORDER BY created_at DESC LIMIT ?1".to_string(),
                vec![limit.to_string()]
            ),
        };

        let mut stmt = conn.prepare(&query)?;
        let params: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();

        let tasks = stmt.query_map(&params[..], |row| {
            Ok(Task {
                id: row.get(0)?,
                session_id: row.get(1)?,
                task_index: row.get(2)?,
                prompt: row.get(3)?,
                status: row.get(4)?,
                cost: row.get(5)?,
                duration: row.get(6)?,
                favorite: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        tasks.collect()
    }

    pub fn update_task_status(
        &self,
        id: &str,
        status: &str,
        cost: Option<f64>,
        duration: Option<i32>,
    ) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE tasks SET status = ?1, cost = ?2, duration = ?3, updated_at = ?4 WHERE id = ?5",
            params![status, cost, duration, now, id],
        )?;

        Ok(())
    }

    pub fn toggle_task_favorite(&self, id: &str) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE tasks SET favorite = CASE WHEN favorite = 0 THEN 1 ELSE 0 END, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        )?;

        // Get new favorite status
        let mut stmt = conn.prepare("SELECT favorite FROM tasks WHERE id = ?1")?;
        let fav = stmt.query_map(params![id], |row| row.get::<_, i32>(0))?
            .next()
            .unwrap_or(Ok(0))?;

        Ok(fav == 1)
    }

    pub fn delete_task(&self, id: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ========================================================================
    // Message Operations
    // ========================================================================

    pub fn create_message(&self, message: &Message) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO messages (task_id, type, content, tool_name, tool_input, tool_output, tool_use_id, subtype, error_message, attachments, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                &message.task_id,
                &message.message_type,
                &message.content,
                &message.tool_name,
                &message.tool_input,
                &message.tool_output,
                &message.tool_use_id,
                &message.subtype,
                &message.error_message,
                &message.attachments,
                &message.created_at,
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_messages(&self, task_id: &str, limit: Option<i32>) -> SqliteResult<Vec<Message>> {
        let conn = self.conn.lock().unwrap();
        let limit = limit.unwrap_or(100);

        let mut stmt = conn.prepare(
            "SELECT id, task_id, type, content, tool_name, tool_input, tool_output, tool_use_id, subtype, error_message, attachments, created_at
             FROM messages WHERE task_id = ?1 ORDER BY created_at ASC LIMIT ?2"
        )?;

        let messages = stmt.query_map(params![task_id, limit], |row| {
            Ok(Message {
                id: Some(row.get(0)?),
                task_id: row.get(1)?,
                message_type: row.get(2)?,
                content: row.get(3)?,
                tool_name: row.get(4)?,
                tool_input: row.get(5)?,
                tool_output: row.get(6)?,
                tool_use_id: row.get(7)?,
                subtype: row.get(8)?,
                error_message: row.get(9)?,
                attachments: row.get(10)?,
                created_at: row.get(11)?,
            })
        })?;

        messages.collect()
    }

    pub fn delete_messages(&self, task_id: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM messages WHERE task_id = ?1", params![task_id])?;
        Ok(())
    }

    // ========================================================================
    // File Operations
    // ========================================================================

    pub fn create_file(&self, file: &FileArtifact) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO files (task_id, name, type, path, preview, thumbnail, is_favorite, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                &file.task_id,
                &file.name,
                &file.file_type,
                &file.path,
                &file.preview,
                &file.thumbnail,
                if file.is_favorite { 1 } else { 0 },
                &file.created_at,
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_files(&self, task_id: &str) -> SqliteResult<Vec<FileArtifact>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, task_id, name, type, path, preview, thumbnail, is_favorite, created_at
             FROM files WHERE task_id = ?1 ORDER BY created_at DESC"
        )?;

        let files = stmt.query_map(params![task_id], |row| {
            Ok(FileArtifact {
                id: Some(row.get(0)?),
                task_id: row.get(1)?,
                name: row.get(2)?,
                file_type: row.get(3)?,
                path: row.get(4)?,
                preview: row.get(5)?,
                thumbnail: row.get(6)?,
                is_favorite: row.get::<_, i32>(7)? == 1,
                created_at: row.get(8)?,
            })
        })?;

        files.collect()
    }

    pub fn delete_file(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM files WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ========================================================================
    // Settings Operations
    // ========================================================================

    pub fn get_setting(&self, key: &str) -> SqliteResult<Option<Setting>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT key, value, updated_at FROM settings WHERE key = ?1"
        )?;

        let settings = stmt.query_map(params![key], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })?;

        settings.into_iter().next().transpose()
    }

    pub fn set_setting(&self, key: &str, value: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![key, value, now],
        )?;

        Ok(())
    }

    pub fn get_all_settings(&self) -> SqliteResult<Vec<Setting>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT key, value, updated_at FROM settings ORDER BY key"
        )?;

        let settings = stmt.query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })?;

        settings.collect()
    }
}
