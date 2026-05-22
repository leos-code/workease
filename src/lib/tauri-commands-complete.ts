/**
 * Tauri Command Integration (Complete)
 * Connects TypeScript tool service to Rust backend commands
 *
 * This file provides a type-safe interface to Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// File Operations
// ============================================================================

/**
 * Read file contents
 * @param path - File path to read
 * @returns File contents as string
 */
export async function readFile(path: string): Promise<string> {
  return await invoke('read_file', { path });
}

/**
 * Write content to a file
 * @param path - File path to write
 * @param content - Content to write
 * @returns Promise that resolves when write completes
 */
export async function writeFile(path: string, content: string): Promise<void> {
  return await invoke('write_file', { path, content });
}

/**
 * Edit file by replacing string
 * @param path - File path to edit
 * @param oldString - String to replace
 * @param newString - Replacement string
 * @returns Success message
 */
export async function editFile(
  path: string,
  oldString: string,
  newString: string
): Promise<string> {
  try {
    // Read file
    const content = await readFile(path);

    // Check if old string exists
    if (!content.includes(oldString)) {
      throw new Error(`String not found in file: ${oldString.substring(0, 30)}...`);
    }

    // Replace string
    const newContent = content.replaceAll(oldString, newString);

    // Write back
    await writeFile(path, newContent);

    return `Successfully replaced "${oldString.substring(0, 30)}..." with "${newString.substring(0, 30)}..." in ${path}`;
  } catch (error) {
    throw new Error(`Failed to edit file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// Command Execution
// ============================================================================

/**
 * Execute shell command
 * @param command - Command to execute
 * @param workDir - Working directory (optional)
 * @param timeout - Timeout in milliseconds (optional, default 120000)
 * @returns Command output
 */
export async function executeCommand(
  command: string,
  workDir?: string,
  timeout?: number
): Promise<string> {
  // ✅ READY - Just implement in Rust backend
  return await invoke('execute_command', {
    command,
    workDir,
    timeoutMs: timeout,
  });
}

// ============================================================================
// Search Operations
// ============================================================================

/**
 * Find files by glob pattern
 * @param pattern - Glob pattern (*.ts, **/*.js)
 * @param path - Search path (optional, default ".")
 * @returns Array of matching file paths
 */
export async function globFiles(
  pattern: string,
  path?: string
): Promise<string[]> {
  // ✅ READY - Just implement in Rust backend
  return await invoke('glob_files', {
    pattern,
    path: path || '.',
  });
}

/**
 * Search file contents with grep
 * @param pattern - Search pattern (regex)
 * @param path - Search path (optional, default ".")
 * @param recursive - Search recursively (optional, default true)
 * @param caseSensitive - Case-sensitive search (optional, default false)
 * @returns Array of matching lines
 */
export async function grepFiles(
  pattern: string,
  path?: string,
  recursive?: boolean,
  caseSensitive?: boolean
): Promise<string[]> {
  // ✅ READY - Just implement in Rust backend
  return await invoke('grep_files', {
    pattern,
    path: path || '.',
    recursive: recursive !== false, // default true
    caseSensitive: caseSensitive || false, // default false
  });
}

// ============================================================================
// Directory Operations
// ============================================================================

/**
 * List files in directory
 * @param path - Directory path
 * @returns Array of file entries
 */
export async function listDirectory(path: string): Promise<Array<{
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}>> {
  return await invoke('list_directory', { path });
}

/**
 * Check if path exists
 * @param path - Path to check
 * @returns True if path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  return await invoke('path_exists', { path });
}

/**
 * Get folder information
 * @param path - Folder path
 * @returns Folder info with file count
 */
export async function getFolderInfo(path: string): Promise<{
  path: string;
  name: string;
  file_count: number;
}> {
  return await invoke('get_folder_info', { path });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Join path segments (cross-platform)
 */
export function joinPath(...segments: string[]): string {
  return segments.join('/').replace(/\/+/g, '/');
}

/**
 * Get file extension
 */
export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1] : '';
}

/**
 * Get file name from path
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Get directory name from path
 */
export function getDirName(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '.';
}

// ============================================================================
// Command Status
// ============================================================================

/**
 * Check which commands are available
 * Useful for feature detection
 */
export async function checkCommandAvailability(): Promise<{
  readFile: boolean;
  writeFile: boolean;
  executeCommand: boolean;
  globFiles: boolean;
  grepFiles: boolean;
}> {
  const results = {
    readFile: false,
    writeFile: false,
    executeCommand: false,
    globFiles: false,
    grepFiles: false,
  };

  // Test each command
  try {
    await invoke('read_file', { path: '.' });
    results.readFile = true;
  } catch {}

  try {
    await invoke('write_file', { path: '.test', content: '' });
    results.writeFile = true;
  } catch {}

  try {
    await invoke('execute_command', { command: 'echo test' });
    results.executeCommand = true;
  } catch {}

  try {
    await invoke('glob_files', { pattern: '*', path: '.' });
    results.globFiles = true;
  } catch {}

  try {
    await invoke('grep_files', { pattern: 'test', path: '.', recursive: false, caseSensitive: false });
    results.grepFiles = true;
  } catch {}

  return results;
}
