# Tauri Rust Backend Implementation Guide

## Overview

This document provides complete implementation specifications for the Tauri Rust backend that will handle all file operations, command execution, and database management for the WorkEase AI agent.

## Architecture

```
Frontend (TypeScript)
    ↓ Tauri IPC
Rust Backend (lib.rs)
    ↓ File System
OS (Windows/macOS/Linux)
```

## Required Dependencies

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "devtools"] }
tauri-plugin-opener = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-sql = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
walkdir = "2"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.32", features = ["bundled"] }
glob = "0.3"
grep = "0.2"
```

## Tauri Commands Implementation

### 1. File Operations

#### read_file
```rust
#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    use tauri_plugin_fs::FsExt;

    // Check if file exists
    if !std::path::Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }

    // Read file contents
    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}
```

#### write_file
```rust
#[tauri::command]
async fn write_file(path: String, content: String) -> Result<String, String> {
    // Create parent directories if they don't exist
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Write file
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(format!("Successfully wrote {} bytes to {}", content.len(), path))
}
```

#### edit_file
```rust
#[tauri::command]
async fn edit_file(path: String, old_string: String, new_string: String) -> Result<String, String> {
    // Read file
    let mut content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Replace string
    if !content.contains(&old_string) {
        return Err(format!("String not found in file: {}", old_string));
    }

    content = content.replace(&old_string, &new_string);

    // Write back
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(format!("Successfully replaced text in {}", path))
}
```

### 2. Command Execution

#### execute_command
```rust
#[tauri::command]
async fn execute_command(
    command: String,
    work_dir: Option<String>,
    timeout: Option<u64>,
) -> Result<String, String> {
    use tokio::process::Command;
    use tokio::time::{timeout, Duration};

    let work_dir = work_dir.unwrap_or_else(|| ".".to_string());
    let timeout_dur = Duration::from_millis(timeout.unwrap_or(120000));

    // Parse command (simple version - split by spaces)
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let cmd = parts[0];
    let args = &parts[1..];

    // Execute command
    let output = timeout(timeout_dur, Command::new(cmd)
        .args(args)
        .current_dir(&work_dir)
        .output()
    )
    .await
    .map_err(|_| "Command timed out".to_string())?
    .map_err(|e| format!("Failed to execute command: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Command failed: {}", stderr))
    }
}
```

### 3. Search Operations

#### glob_files
```rust
#[tauri::command]
async fn glob_files(pattern: String, path: String) -> Result<Vec<String>, String> {
    use glob::glob;

    let search_path = if path == "." {
        format!("**/{}", pattern)
    } else {
        format!("{}/{}", path, pattern)
    };

    let mut files = Vec::new();

    for entry in glob(&search_path)
        .map_err(|e| format!("Failed to read glob pattern: {}", e))?
    {
        match entry {
            Ok(path) => {
                files.push(path.to_string_lossy().to_string());
            }
            Err(e) => {
                eprintln!("Error reading file: {}", e);
            }
        }
    }

    Ok(files)
}
```

#### grep_files
```rust
#[tauri::command]
async fn grep_files(
    pattern: String,
    path: String,
    recursive: bool,
    case_sensitive: bool,
) -> Result<Vec<String>, String> {
    use grep::regex::Regex;
    use grep::searcher::Searcher;
    use std::fs::File;
    use std::io::BufRead;
    use walkdir::WalkDir;

    let mut matches = Vec::new();

    // Build regex
    let regex = if case_sensitive {
        Regex::new(&pattern)
    } else {
        Regex::new(&format!("(?i){}", pattern))
    }.map_err(|e| format!("Invalid regex: {}", e))?;

    if recursive {
        // Walk directory
        for entry in WalkDir::new(&path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let file_path = entry.path();
            if let Ok(file) = File::open(file_path) {
                let line_num = 0;
                for line in std::io::BufReader::new(file).lines() {
                    if let Ok(line_content) = line {
                        line_num += 1;
                        if regex.is_match(&line_content) {
                            matches.push(format!(
                                "{}:{}:{}",
                                path,
                                file_path.display(),
                                line_content
                            ));
                        }
                    }
                }
            }
        }
    } else {
        // Single file
        let file = File::open(&path)
            .map_err(|e| format!("Failed to open file: {}", e))?;

        let mut line_num = 0;
        for line in std::io::BufReader::new(file).lines() {
            if let Ok(line_content) = line {
                line_num += 1;
                if regex.is_match(&line_content) {
                    matches.push(format!("{}:{}", path, line_content));
                }
            }
        }
    }

    Ok(matches)
}
```

### 4. Database Operations

#### Database Connection Setup
```rust
use rusqlite::{Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};

pub struct AppState {
    pub db: Arc<Mutex<Connection>>,
}

pub fn get_db_path() -> String {
    let mut path = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    path.push_str("/.workease/workease.sqlite");

    // Create directory if it doesn't exist
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    path
}

pub fn init_database() -> SqliteResult<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    // Execute schema
    let schema = include_str!("../../src/db/schema.sql");
    conn.execute_batch(schema)?;

    Ok(conn)
}
```

#### Session Commands
```rust
#[tauri::command]
async fn db_create_session(
    state: tauri::State<'_, AppState>,
    id: String,
    prompt: String,
) -> Result<(), String> {
    let db = state.db.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    db.execute(
        "INSERT INTO sessions (id, prompt, task_count, created_at, updated_at) VALUES (?1, ?2, 0, ?3, ?3)",
        [&id, &prompt, &chrono::Utc::now().to_rfc3339()],
    )
    .map_err(|e| format!("Failed to create session: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn db_get_session(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> Result<Session, String> {
    let db = state.db.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    let mut stmt = db.prepare(
        "SELECT id, prompt, task_count, created_at, updated_at FROM sessions WHERE id = ?1"
    )
    .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let session = stmt.query_row([&session_id], |row| {
        Ok(Session {
            id: row.get(0)?,
            prompt: row.get(1)?,
            task_count: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })
    .map_err(|e| format!("Session not found: {}", e))?;

    Ok(session)
}
```

## Complete lib.rs Structure

```rust
// src-tauri/src/lib.rs

mod types;
mod db;

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub prompt: String,
    pub task_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

pub struct AppState {
    pub db: Arc<Mutex<rusqlite::Connection>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let db = db::init_database()
                .expect("Failed to initialize database");

            // Manage app state
            app.manage(AppState {
                db: Arc::new(Mutex::new(db)),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File operations
            read_file,
            write_file,
            edit_file,
            // Command execution
            execute_command,
            // Search operations
            glob_files,
            grep_files,
            // Database operations
            db_create_session,
            db_get_session,
            // ... add all other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## TypeScript Types for Rust Commands

Add to `src/types/tauri.ts`:

```typescript
/**
 * Tauri command signatures
 */

// File operations
export interface ReadFileCommand {
  path: string;
}

export interface WriteFileCommand {
  path: string;
  content: string;
}

export interface EditFileCommand {
  path: string;
  old_string: string;
  new_string: string;
}

// Command execution
export interface ExecuteCommandInput {
  command: string;
  work_dir?: string;
  timeout?: number;
}

// Search operations
export interface GlobFilesInput {
  pattern: string;
  path?: string;
}

export interface GrepFilesInput {
  pattern: string;
  path?: string;
  recursive?: boolean;
  case_sensitive?: boolean;
}

// Database operations
export interface CreateSessionInput {
  id: string;
  prompt: string;
}
```

## Testing Strategy

1. **Unit Tests**: Test each command independently
2. **Integration Tests**: Test frontend-backend communication
3. **Error Handling**: Verify proper error propagation
4. **Performance**: Test with large files and directories

## Security Considerations

1. **Command Injection**: Validate and sanitize all command inputs
2. **Path Traversal**: Validate file paths are within allowed directories
3. **Resource Limits**: Enforce timeouts and memory limits
4. **Error Messages**: Don't expose sensitive information in errors

## Implementation Order

1. ✅ File operations (read, write, edit)
2. ✅ Command execution (bash)
3. ✅ Search operations (glob, grep)
4. ⏳ Database operations (sessions, tasks, messages)
5. ⏳ Error handling and validation
6. ⏳ Security hardening

## Next Steps

1. Copy the command implementations above into `src-tauri/src/lib.rs`
2. Add required dependencies to `Cargo.toml`
3. Test each command individually
4. Connect frontend to Tauri commands
5. Replace placeholder implementations in `src/server/services/tools.ts`

---

**Status**: Ready for implementation
**Estimated Time**: 4-6 hours for full implementation
**Priority**: HIGH (required for core functionality)
