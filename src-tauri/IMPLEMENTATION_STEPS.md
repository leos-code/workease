# Rust Backend Implementation - Step-by-Step Guide

## Overview

This guide provides exact steps to implement the remaining 3 Rust commands (execute_command, glob_files, grep_files) to complete the tool execution system.

**Estimated Time**: 15-20 minutes
**Difficulty**: Beginner-friendly (copy-paste ready)

---

## Step 1: Update Cargo.toml

### Location: `src-tauri/Cargo.toml`

Add these dependencies to the `[dependencies]` section:

```toml
[dependencies]
# ... existing dependencies ...
walkdir = "2"

# ⬇️ ADD THESE THREE LINES ⬇️
tokio = { version = "1", features = ["full"] }
glob = "0.3"
regex = "1.10"
```

**Why these dependencies?**
- `tokio`: Async runtime (required for future async operations)
- `glob`: Pattern matching for file search (*.ts, **/*.js)
- `regex`: Regular expression support for content search

---

## Step 2: Update lib.rs

### Location: `src-tauri/src/lib.rs`

### 2.1 Add Imports

Add to the top of the file (after existing imports):

```rust
use std::process::Command;
```

### 2.2 Add execute_command Function

Add this function before the `run()` function:

```rust
/// Execute shell command
#[tauri::command]
fn execute_command(
    command: String,
    work_dir: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    // Parse command (simple version - split by spaces)
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
                let exit_code = output.status.code().unwrap_or(-1);
                Err(format!(
                    "Command failed with exit code {}: {}",
                    exit_code, stderr
                ))
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}
```

### 2.3 Add glob_files Function

Add this function after `execute_command`:

```rust
/// Find files by glob pattern
#[tauri::command]
fn glob_files(pattern: String, path: String) -> Result<Vec<String>, String> {
    use glob::glob;

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

### 2.4 Add grep_files Function

Add this function after `glob_files`:

```rust
/// Search file contents with grep
#[tauri::command]
fn grep_files(
    pattern: String,
    path: String,
    recursive: bool,
    case_sensitive: bool,
) -> Result<Vec<String>, String> {
    use regex::Regex;
    use std::fs::File;
    use std::io::{BufRead, BufReader};

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
            .filter(|e| e.path().is_file())
        {
            let file_path = entry.path();
            if let Ok(file) = File::open(file_path) {
                let reader = BufReader::new(file);
                for line in reader.lines() {
                    if let Ok(line_content) = line {
                        if regex.is_match(&line_content) {
                            matches.push(format!(
                                "{}:{}",
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
        for line in reader.lines() {
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

### 2.5 Update invoke_handler

Find the `invoke_handler` section and update it:

**Before:**
```rust
.invoke_handler(tauri::generate_handler![
    list_directory,
    read_file,
    write_file,
    get_folder_info,
    path_exists
])
```

**After:**
```rust
.invoke_handler(tauri::generate_handler![
    list_directory,
    read_file,
    write_file,
    get_folder_info,
    path_exists,
    execute_command,   // ⬅️ ADD THIS
    glob_files,        // ⬅️ ADD THIS
    grep_files         // ⬅️ ADD THIS
])
```

---

## Step 3: Build and Test

### 3.1 Build the Project

```bash
npm run tauri build
```

Or for development:
```bash
npm run tauri dev
```

### 3.2 Verify Compilation

If you see compilation errors, check:
1. All dependencies added to Cargo.toml ✅
2. All functions added to lib.rs ✅
3. All functions registered in invoke_handler ✅

Common errors:
- **"use of undeclared crate"**: Add dependency to Cargo.toml
- **"not found in this scope"**: Add `use glob::glob;` or `use regex::Regex;`
- **"command does not exist"**: Add function to invoke_handler

---

## Step 4: Update TypeScript Tools

### Location: `src/server/services/tools-v2.ts`

Now that Rust commands are implemented, connect them in TypeScript:

### 4.1 Update toolBash

**Before:**
```typescript
export async function toolBash(input: BashToolInput): Promise<ToolResult> {
    // ... placeholder code ...
}
```

**After:**
```typescript
import { executeCommand } from '../../lib/tauri-commands-complete';

export async function toolBash(input: BashToolInput): Promise<ToolResult> {
    const { command, work_dir, timeout = 120000 } = input;

    try {
        console.log(`[Tool:Bash] Executing: ${command} in ${work_dir || 'default dir'}`);

        // ✅ NOW CONNECTED TO RUST
        const output = await executeCommand(command, work_dir, timeout);

        return {
            tool_name: 'Bash',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Bash',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

### 4.2 Update toolGlob

```typescript
import { globFiles } from '../../lib/tauri-commands-complete';

export async function toolGlob(input: GlobToolInput): Promise<ToolResult> {
    const { pattern, path = '.' } = input;

    try {
        console.log(`[Tool:Glob] Searching: ${pattern} in ${path}`);

        // ✅ NOW CONNECTED TO RUST
        const files = await globFiles(pattern, path);

        const output = files.length > 0
            ? files.join('\n')
            : `No files found matching pattern: ${pattern}`;

        return {
            tool_name: 'Glob',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Glob',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

### 4.3 Update toolGrep

```typescript
import { grepFiles } from '../../lib/tauri-commands-complete';

export async function toolGrep(input: GrepToolInput): Promise<ToolResult> {
    const { pattern, path = '.', recursive = true, case_sensitive = false } = input;

    try {
        console.log(`[Tool:Grep] Searching for "${pattern}" in ${path}`);

        // ✅ NOW CONNECTED TO RUST
        const matches = await grepFiles(pattern, path, recursive, case_sensitive);

        const output = matches.length > 0
            ? matches.join('\n')
            : `No matches found for pattern: ${pattern}`;

        return {
            tool_name: 'Grep',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Grep',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

---

## Step 5: Test All Tools

Create a test file to verify all tools work:

```typescript
import { executeTool } from './src/server/services/tools-v2';

async function testAllTools() {
    console.log('Testing Read...');
    const readResult = await executeTool('Read', { file_path: 'README.md' });
    console.log('✅ Read:', readResult.output ? 'Success' : readResult.error);

    console.log('Testing Write...');
    const writeResult = await executeTool('Write', {
        file_path: 'test.txt',
        content: 'Hello from WorkEase!'
    });
    console.log('✅ Write:', writeResult.output ? 'Success' : writeResult.error);

    console.log('Testing Bash...');
    const bashResult = await executeTool('Bash', {
        command: 'echo "Hello from Tauri!"'
    });
    console.log('✅ Bash:', bashResult.output ? 'Success' : bashResult.error);

    console.log('Testing Glob...');
    const globResult = await executeTool('Glob', {
        pattern: '*.ts',
        path: './src'
    });
    console.log('✅ Glob:', globResult.output ? 'Success' : globResult.error);

    console.log('Testing Grep...');
    const grepResult = await executeTool('Grep', {
        pattern: 'function',
        path: './src',
        recursive: true
    });
    console.log('✅ Grep:', grepResult.output ? 'Success' : grepResult.error);

    console.log('Testing Edit...');
    const editResult = await executeTool('Edit', {
        file_path: 'test.txt',
        old_string: 'Hello',
        new_string: 'Goodbye'
    });
    console.log('✅ Edit:', editResult.output ? 'Success' : editResult.error);
}

testAllTools();
```

---

## Success Criteria

You'll know everything is working when:

✅ **Cargo.toml** has 3 new dependencies
✅ **lib.rs** compiles without errors
✅ **invoke_handler** registers 8 commands (was 5, now 8)
✅ **npm run tauri dev** starts successfully
✅ **All 6 tools** (Read, Write, Edit, Bash, Glob, Grep) work from TypeScript

---

## Troubleshooting

### Error: "cannot find `glob` in this scope"
**Solution**: Add `use glob::glob;` inside the function or at top of file

### Error: "cannot find `Regex` in this scope"
**Solution**: Add `use regex::Regex;` inside the function or at top of file

### Error: "unknown command: execute_command"
**Solution**: Add `execute_command` to `invoke_handler` macro

### Error: Command not found (when testing)
**Solution**: Make sure command exists on your system (use `ls`, `echo`, etc.)

---

## What's Next?

After completing this implementation:

1. ✅ All 6 tools are fully functional
2. ✅ Tool execution system is complete
3. ✅ Ready for frontend integration
4. ✅ Can move on to:
   - Database implementation
   - Claude SDK integration
   - Frontend UI updates
   - Test framework setup

---

**Status**: ✅ Ready to implement
**Time**: 15-20 minutes
**Difficulty**: Beginner
**Files Modified**: 2 (Cargo.toml, lib.rs)
**Files Created**: 1 (updated tools-v2.ts)
