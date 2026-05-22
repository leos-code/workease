/**
 * Database Tauri Commands
 *
 * Exposes database operations to the frontend via Tauri invoke system
 */

use crate::database::{Database, Session, Task, Message, FileArtifact, Setting};
use std::sync::Mutex;
use tauri::State;
use std::path::PathBuf;

// Global database state
pub struct DbState(pub Mutex<Option<Database>>);

// ============================================================================
// Helper Functions
// ============================================================================

fn get_db(state: &State<DbState>) -> Result<Database, String> {
    let db = state.0.lock().unwrap();
    db.as_ref()
        .cloned()
        .ok_or_else(|| "Database not initialized".to_string())
}

// ============================================================================
// Database Initialization
// ============================================================================

#[tauri::command]
pub fn init_database(state: State<DbState>) -> Result<String, String> {
    let db_path = Database::default_path();
    let db = Database::new(&db_path)
        .map_err(|e| format!("Failed to initialize database: {}", e))?;

    {
        let mut state_guard = state.0.lock().unwrap();
        *state_guard = Some(db);
    }

    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_database_path() -> String {
    Database::default_path().to_string_lossy().to_string()
}

// ============================================================================
// Session Commands
// ============================================================================

#[tauri::command]
pub fn create_session(state: State<DbState>, prompt: String) -> Result<Session, String> {
    let db = get_db(&state)?;
    db.create_session(&prompt)
        .map_err(|e| format!("Failed to create session: {}", e))
}

#[tauri::command]
pub fn get_session(state: State<DbState>, id: String) -> Result<Option<Session>, String> {
    let db = get_db(&state)?;
    db.get_session(&id)
        .map_err(|e| format!("Failed to get session: {}", e))
}

#[tauri::command]
pub fn list_sessions(
    state: State<DbState>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<Session>, String> {
    let db = get_db(&state)?;
    db.list_sessions(limit, offset)
        .map_err(|e| format!("Failed to list sessions: {}", e))
}

#[tauri::command]
pub fn update_session(
    state: State<DbState>,
    id: String,
    prompt: Option<String>,
) -> Result<(), String> {
    let db = get_db(&state)?;
    db.update_session(&id, prompt.as_deref())
        .map_err(|e| format!("Failed to update session: {}", e))
}

#[tauri::command]
pub fn delete_session(state: State<DbState>, id: String) -> Result<(), String> {
    let db = get_db(&state)?;
    db.delete_session(&id)
        .map_err(|e| format!("Failed to delete session: {}", e))
}

// ============================================================================
// Task Commands
// ============================================================================

#[tauri::command]
pub fn create_task(
    state: State<DbState>,
    session_id: String,
    task_index: i32,
    prompt: String,
) -> Result<Task, String> {
    let db = get_db(&state)?;
    db.create_task(&session_id, task_index, &prompt)
        .map_err(|e| format!("Failed to create task: {}", e))
}

#[tauri::command]
pub fn get_task(state: State<DbState>, id: String) -> Result<Option<Task>, String> {
    let db = get_db(&state)?;
    db.get_task(&id)
        .map_err(|e| format!("Failed to get task: {}", e))
}

#[tauri::command]
pub fn list_tasks(
    state: State<DbState>,
    session_id: Option<String>,
    status: Option<String>,
    favorite: Option<bool>,
    limit: Option<i32>,
) -> Result<Vec<Task>, String> {
    let db = get_db(&state)?;
    db.list_tasks(
        session_id.as_deref(),
        status.as_deref(),
        favorite,
        limit,
    )
    .map_err(|e| format!("Failed to list tasks: {}", e))
}

#[tauri::command]
pub fn update_task_status(
    state: State<DbState>,
    id: String,
    status: String,
    cost: Option<f64>,
    duration: Option<i32>,
) -> Result<(), String> {
    let db = get_db(&state)?;
    db.update_task_status(&id, &status, cost, duration)
        .map_err(|e| format!("Failed to update task status: {}", e))
}

#[tauri::command]
pub fn toggle_task_favorite(state: State<DbState>, id: String) -> Result<bool, String> {
    let db = get_db(&state)?;
    db.toggle_task_favorite(&id)
        .map_err(|e| format!("Failed to toggle task favorite: {}", e))
}

#[tauri::command]
pub fn delete_task(state: State<DbState>, id: String) -> Result<(), String> {
    let db = get_db(&state)?;
    db.delete_task(&id)
        .map_err(|e| format!("Failed to delete task: {}", e))
}

// ============================================================================
// Message Commands
// ============================================================================

#[tauri::command]
pub fn create_message(state: State<DbState>, message: Message) -> Result<i64, String> {
    let db = get_db(&state)?;
    db.create_message(&message)
        .map_err(|e| format!("Failed to create message: {}", e))
}

#[tauri::command]
pub fn get_messages(
    state: State<DbState>,
    task_id: String,
    limit: Option<i32>,
) -> Result<Vec<Message>, String> {
    let db = get_db(&state)?;
    db.get_messages(&task_id, limit)
        .map_err(|e| format!("Failed to get messages: {}", e))
}

#[tauri::command]
pub fn delete_messages(state: State<DbState>, task_id: String) -> Result<(), String> {
    let db = get_db(&state)?;
    db.delete_messages(&task_id)
        .map_err(|e| format!("Failed to delete messages: {}", e))
}

// ============================================================================
// File Commands
// ============================================================================

#[tauri::command]
pub fn create_file(state: State<DbState>, file: FileArtifact) -> Result<i64, String> {
    let db = get_db(&state)?;
    db.create_file(&file)
        .map_err(|e| format!("Failed to create file: {}", e))
}

#[tauri::command]
pub fn get_files(state: State<DbState>, task_id: String) -> Result<Vec<FileArtifact>, String> {
    let db = get_db(&state)?;
    db.get_files(&task_id)
        .map_err(|e| format!("Failed to get files: {}", e))
}

#[tauri::command]
pub fn delete_file(state: State<DbState>, id: i64) -> Result<(), String> {
    let db = get_db(&state)?;
    db.delete_file(id)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

// ============================================================================
// Settings Commands
// ============================================================================

#[tauri::command]
pub fn get_setting(state: State<DbState>, key: String) -> Result<Option<Setting>, String> {
    let db = get_db(&state)?;
    db.get_setting(&key)
        .map_err(|e| format!("Failed to get setting: {}", e))
}

#[tauri::command]
pub fn set_setting(state: State<DbState>, key: String, value: String) -> Result<(), String> {
    let db = get_db(&state)?;
    db.set_setting(&key, &value)
        .map_err(|e| format!("Failed to set setting: {}", e))
}

#[tauri::command]
pub fn get_all_settings(state: State<DbState>) -> Result<Vec<Setting>, String> {
    let db = get_db(&state)?;
    db.get_all_settings()
        .map_err(|e| format!("Failed to get all settings: {}", e))
}
