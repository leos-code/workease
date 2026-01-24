import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

export interface FolderInfo {
  path: string;
  name: string;
  file_count: number;
}

/**
 * List files and directories in a given path
 */
export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path });
}

/**
 * Read file contents as string
 */
export async function readFile(path: string): Promise<string> {
  return invoke<string>("read_file", { path });
}

/**
 * Write content to a file
 */
export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_file", { path, content });
}

/**
 * Get folder information including file count
 */
export async function getFolderInfo(path: string): Promise<FolderInfo> {
  return invoke<FolderInfo>("get_folder_info", { path });
}

/**
 * Check if a path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>("path_exists", { path });
}

/**
 * Open a folder picker dialog
 */
export async function pickFolder(): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
    title: "Select a folder to grant access",
  });
  return result as string | null;
}

/**
 * Open a file picker dialog
 */
export async function pickFiles(options?: {
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  const result = await open({
    directory: false,
    multiple: options?.multiple ?? false,
    filters: options?.filters,
    title: "Select files",
  });
  return result;
}
