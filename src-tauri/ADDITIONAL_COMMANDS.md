# Additional Rust Commands for WorkEase

This file contains the additional Rust commands needed to complete the tool execution system.

## Command: execute_command

Add this to `src-tauri/src/lib.rs`:

```rust
use std::process::Command;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

/// Execute shell command
#[tauri::command]
fn execute_command(
    command: String,
    work_dir: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    // Parse command (simple version - split by spaces)
    // Note: This is a basic implementation. For production, use a proper shell parser.
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let cmd = parts[0];
    let args = &parts[1..];

    // Build command
    let mut cmd_builder = Command::new(cmd);
    cmd_builder.args(args);

    // Set working directory if provided
    if let Some(dir) = work_dir {
        cmd_builder.current_dir(dir);
    }

    // Execute command
    let output = cmd_builder.output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                Ok(stdout)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                Err(format!("Command failed with exit code {}: {}",
                    output.status.code().unwrap_or(-1),
                    stderr))
            }
        }
        Err(e) => {
            Err(format!("Failed to execute command: {}", e))
        }
    }
}
```

## Update invoke_handler

Add `execute_command` to the invoke_handler:

```rust
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
            path_exists,
            execute_command  // ← ADD THIS
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Command: glob_files

Add this to `src-tauri/src/lib.rs`:

```rust
use glob::glob;

/// Find files by glob pattern
#[tauri::command]
fn glob_files(pattern: String, path: String) -> Result<Vec<String>, String> {
    let search_path = if path == "." || path == "" {
        pattern.clone()
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

## Command: grep_files

Add this to `src-tauri/src/lib.rs`:

```rust
use std::fs::File;
use std::io::{BufRead, BufReader};
use regex::Regex;

/// Search file contents with grep
#[tauri::command]
fn grep_files(
    pattern: String,
    path: String,
    recursive: bool,
    case_sensitive: bool,
) -> Result<Vec<String>, String> {
    let mut matches = Vec::new();

    // Build regex
    let regex = if case_sensitive {
        Regex::new(&pattern)
    } else {
        Regex::new(&format!("(?i){}", pattern))
    };

    let regex = regex.map_err(|e| format!("Invalid regex: {}", e))?;

    if recursive {
        // Walk directory
        for entry in WalkDir::new(&path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            let file_path = entry.path();
            if let Ok(file) = File::open(file_path) {
                let reader = BufReader::new(file);
                for (line_num, line) in reader.lines().enumerate() {
                    if let Ok(line_content) = line {
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

        let reader = BufReader::new(file);
        for (line_num, line) in reader.lines().enumerate() {
            if let Ok(line_content) = line {
                if regex.is_match(&line_content) {
                    matches.push(format!("{}:{}", path, line_content));
                }
            }
        }
    }

    Ok(matches)
}
```

## Update Cargo.toml

Add these dependencies to `src-tauri/Cargo.toml`:

```toml
[dependencies]
# ... existing dependencies ...
tokio = { version = "1", features = ["full"] }
glob = "0.3"
regex = "1.10"
walkdir = "2"  # Already present
```

## Complete Updated invoke_handler

```rust
.invoke_handler(tauri::generate_handler![
    list_directory,
    read_file,
    write_file,
    get_folder_info,
    path_exists,
    execute_command,
    glob_files,
    grep_files
])
```

## Testing Commands

After implementing these commands, test them from the frontend:

```typescript
import { executeCommand, globFiles, grepFiles } from './lib/tauri-commands';

// Test execute_command
const result = await executeCommand('ls -la', '.', 5000);
console.log(result);

// Test glob_files
const files = await globFiles('*.ts', './src');
console.log(files);

// Test grep_files
const matches = await grepFiles('function', './src', true, false);
console.log(matches);
```

## Security Considerations

⚠️ **IMPORTANT**: The execute_command implementation is basic and has security limitations:

1. **Command Injection**: The simple split by spaces doesn't handle quotes or escapes
2. **No Shell Access**: Can't use shell features like pipes, redirects, or variables
3. **No Sanitization**: Commands are executed as-is

For production use, consider:
- Using a proper shell (sh, bash, cmd.exe) for complex commands
- Adding command whitelisting/blacklisting
- Implementing proper input sanitization
- Adding user approval prompts for dangerous commands

## Alternative: Use Shell

For more robust command execution, use the system shell:

```rust
#[tauri::command]
fn execute_command_shell(command: String) -> Result<String, String> {
    let (shell, shell_arg) = if cfg!(target_os = "windows") {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    };

    let output = Command::new(shell)
        .arg(shell_arg)
        .arg(&command)
        .output();

    // ... rest of error handling
}
```

This allows full shell features but increases security risk. Use with caution!
