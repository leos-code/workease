# WorkEase Database Architecture

## Overview

The WorkEase application uses SQLite as its primary database for persistent storage of sessions, tasks, messages, and artifacts. The database schema is designed to support the core AI agent functionality with proper relationships and indexes.

## Database Schema

### Tables

1. **sessions** - Conversation contexts containing multiple related tasks
2. **tasks** - Individual task executions within sessions
3. **messages** - Chat messages and tool execution results
4. **files** (artifacts) - Generated files from task execution
5. **settings** - Application configuration
6. **migrations** - Database version tracking

See `schema.sql` for the complete schema definition with indexes.

## Implementation Status

### ✅ Completed

- [x] Database schema design (`schema.sql`)
- [x] TypeScript type definitions (`../types/index.ts`)
- [x] Database service interface (`database.ts`)

### ⚠️ In Progress

- [ ] Tauri backend implementation with SQLite
- [ ] Database migration system
- [ ] Tauri commands for database operations

### ❌ Not Started

- [ ] Database connection pooling
- [ ] Query optimization
- [ ] Backup/restore functionality

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend (React/TypeScript)        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │     Database Service (database.ts)        │ │
│  │  - Type-safe API                          │ │
│  │  - Error handling                         │ │
│  │  - Data transformation                    │ │
│  └─────────────┬─────────────────────────────┘ │
└────────────────┼───────────────────────────────┘
                 │ Tauri IPC
                 ↓
┌─────────────────────────────────────────────────┐
│         Tauri Backend (Rust)                    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │   Database Commands (lib.rs)              │ │
│  │  - db_init                                │ │
│  │  - db_create_session                      │ │
│  │  - db_get_session                         │ │
│  │  - db_list_sessions                       │ │
│  │  - db_create_task                         │ │
│  │  - db_get_task                            │ │
│  │  - db_update_task_status                  │ │
│  │  - db_list_tasks                          │ │
│  │  - db_create_message                      │ │
│  │  - db_get_messages                        │ │
│  │  - db_create_artifact                     │ │
│  │  - db_get_artifacts                       │ │
│  │  - db_get_setting                         │ │
│  │  - db_set_setting                         │ │
│  └─────────────┬─────────────────────────────┘ │
└────────────────┼───────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         SQLite Database File                    │
│                                                 │
│  workease.sqlite                                │
│  - sessions                                     │
│  - tasks                                        │
│  - messages                                     │
│  - files                                        │
│  - settings                                     │
│  - migrations                                   │
└─────────────────────────────────────────────────┘
```

## Required Tauri Commands

To implement the database functionality, add the following Tauri commands to `src-tauri/src/lib.rs`:

### Database Setup

```rust
#[tauri::command]
async fn db_init(path: String, migrate: bool) -> Result<(), String> {
    // Initialize SQLite connection
    // Run migrations if migrate = true
}

#[tauri::command]
async fn db_close() -> Result<(), String> {
    // Close database connection
}
```

### Session Commands

```rust
#[tauri::command]
async fn db_create_session(session: Session) -> Result<(), String> {
    // Insert session into database
}

#[tauri::command]
async fn db_get_session(session_id: String) -> Result<Session, String> {
    // Query session by ID
}

#[tauri::command]
async fn db_list_sessions(limit: i32, offset: i32) -> Result<Vec<Session>, String> {
    // List sessions with pagination
}

#[tauri::command]
async fn db_increment_task_count(session_id: String) -> Result<(), String> {
    // Increment session task_count
}
```

### Task Commands

```rust
#[tauri::command]
async fn db_create_task(task: Task) -> Result<(), String> {
    // Insert task into database
}

#[tauri::command]
async fn db_get_task(task_id: String) -> Result<Task, String> {
    // Query task by ID
}

#[tauri::command]
async fn db_update_task_status(
    task_id: String,
    status: String,
    cost: Option<f64>,
    duration: Option<i64>
) -> Result<(), String> {
    // Update task status and optionally cost/duration
}

#[tauri::command]
async fn db_toggle_task_favorite(task_id: String) -> Result<bool, String> {
    // Toggle task favorite status and return new value
}

#[tauri::command]
async fn db_list_tasks(filters: TaskFilters) -> Result<Vec<Task>, String> {
    // List tasks with filters
}
```

### Message Commands

```rust
#[tauri::command]
async fn db_create_message(message: Message) -> Result<i64, String> {
    // Insert message and return new ID
}

#[tauri::command]
async fn db_get_messages(task_id: String, filters: MessageFilters) -> Result<Vec<Message>, String> {
    // Get messages for task
}
```

### Artifact Commands

```rust
#[tauri::command]
async fn db_create_artifact(artifact: Artifact) -> Result<i64, String> {
    // Insert artifact and return new ID
}

#[tauri::command]
async fn db_get_artifacts(task_id: String) -> Result<Vec<Artifact>, String> {
    // Get artifacts for task
}
```

### Settings Commands

```rust
#[tauri::command]
async fn db_get_setting(key: String) -> Result<Option<String>, String> {
    // Get setting value
}

#[tauri::command]
async fn db_set_setting(key: String, value: String, updated_at: String) -> Result<(), String> {
    // Set setting value
}

#[tauri::command]
async fn db_get_all_settings() -> Result<HashMap<String, String>, String> {
    // Get all settings
}
```

## Rust Dependencies

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-sql = "2"
rusqlite = { version = "0.32", features = ["bundled"] }
```

## Database Location

The database file will be stored in the application data directory:

- **macOS**: `~/Library/Application Support/WorkEase/workease.sqlite`
- **Linux**: `~/.config/WorkEase/workease.sqlite`
- **Windows**: `%APPDATA%\WorkEase\workease.sqlite`

## Migration System

The database includes a `migrations` table to track schema versions. When implementing the Rust backend:

1. Check current migration version on startup
2. Apply any pending migrations
3. Record successful migrations

## Usage Example

```typescript
import { getDatabase } from './db/database';

// Initialize database
const db = getDatabase();
await db.initialize();

// Create a session
const sessionResult = await db.createSession('Build a todo app');
if (sessionResult.success) {
  const session = sessionResult.data;
  console.log('Created session:', session.id);
}

// Create a task
const taskResult = await db.createTask(session.id, 1, 'Create React component');
if (taskResult.success) {
  const task = taskResult.data;
  console.log('Created task:', task.id);
}

// Update task status
await db.updateTaskStatus(task.id, 'completed');
```

## Testing

To test database operations:

```bash
# Run tests (once implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Performance Considerations

1. **Indexes**: All frequently queried columns have indexes
2. **Foreign Keys**: Cascading deletes ensure data integrity
3. **Connection Pooling**: Reuse connections where possible
4. **Batch Operations**: For bulk inserts, use transactions

## Future Enhancements

- [ ] Full-text search on task prompts and messages
- [ ] Database backup/restore functionality
- [ ] Query result caching
- [ ] Async I/O optimization
- [ ] Database vacuum and optimization
