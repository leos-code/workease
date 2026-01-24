use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FolderInfo {
    pub path: String,
    pub name: String,
    pub file_count: usize,
}

/// List files and directories in a given path
#[tauri::command]
fn list_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(path);
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", path.display()));
    }
    
    let entries = fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|entry| {
            entry.ok().map(|e| {
                let metadata = e.metadata().ok();
                FileEntry {
                    name: e.file_name().to_string_lossy().to_string(),
                    path: e.path().to_string_lossy().to_string(),
                    is_dir: e.path().is_dir(),
                    size: metadata.map(|m| m.len()).unwrap_or(0),
                }
            })
        })
        .collect();
    
    Ok(entries)
}

/// Read file contents as string
#[tauri::command]
fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Write content to a file
#[tauri::command]
fn write_file(path: &str, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Get folder information including file count
#[tauri::command]
fn get_folder_info(path: &str) -> Result<FolderInfo, String> {
    let path_obj = Path::new(path);
    
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    let name = path_obj
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string());
    
    let file_count = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .count();
    
    Ok(FolderInfo {
        path: path.to_string(),
        name,
        file_count,
    })
}

/// Check if a path exists
#[tauri::command]
fn path_exists(path: &str) -> bool {
    Path::new(path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            write_file,
            get_folder_info,
            path_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
