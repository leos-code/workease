/**
 * Tool Execution Service (Connected to Tauri)
 * Implements all tool operations for the AI agent using actual Tauri commands
 *
 * Tools:
 * - Read: Read file contents ✅ CONNECTED
 * - Write: Create new files ✅ CONNECTED
 * - Edit: Edit existing files ✅ CONNECTED
 * - Bash: Execute shell commands ⏳ NEEDS RUST
 * - Glob: Find files by pattern ⏳ NEEDS RUST
 * - Grep: Search file contents ⏳ NEEDS RUST
 */

import type { ToolResult } from '../../types';
import { readFile, writeFile, editFile } from '../../lib/tauri-commands';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ReadToolInput {
  file_path: string;
}

export interface WriteToolInput {
  file_path: string;
  content: string;
}

export interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
}

export interface BashToolInput {
  command: string;
  work_dir?: string;
  timeout?: number;
}

export interface GlobToolInput {
  pattern: string;
  path?: string;
}

export interface GrepToolInput {
  pattern: string;
  path?: string;
  recursive?: boolean;
  case_sensitive?: boolean;
}

// ============================================================================
// Tool Implementation
// ============================================================================

/**
 * Read file contents
 *
 * @param input - Tool input with file_path
 * @returns Tool result with file contents
 */
export async function toolRead(input: ReadToolInput): Promise<ToolResult> {
  const { file_path } = input;

  try {
    console.log(`[Tool:Read] Reading file: ${file_path}`);

    // ✅ CONNECTED TO TAURI
    const content = await readFile(file_path);

    return {
      tool_name: 'Read',
      tool_use_id: generateId(),
      output: content,
    };
  } catch (error) {
    return {
      tool_name: 'Read',
      tool_use_id: generateId(),
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Write file contents
 *
 * @param input - Tool input with file_path and content
 * @returns Tool result with success message
 */
export async function toolWrite(input: WriteToolInput): Promise<ToolResult> {
  const { file_path, content } = input;

  try {
    console.log(`[Tool:Write] Writing file: ${file_path} (${content.length} bytes)`);

    // ✅ CONNECTED TO TAURI
    await writeFile(file_path, content);

    return {
      tool_name: 'Write',
      tool_use_id: generateId(),
      output: `Successfully wrote ${content.length} bytes to ${file_path}`,
    };
  } catch (error) {
    return {
      tool_name: 'Write',
      tool_use_id: generateId(),
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Edit file by replacing string
 *
 * @param input - Tool input with file_path, old_string, new_string
 * @returns Tool result with success message
 */
export async function toolEdit(input: EditToolInput): Promise<ToolResult> {
  const { file_path, old_string, new_string } = input;

  try {
    console.log(`[Tool:Edit] Editing file: ${file_path}`);

    // ✅ CONNECTED TO TAURI (via editFile wrapper)
    const result = await editFile(file_path, old_string, new_string);

    return {
      tool_name: 'Edit',
      tool_use_id: generateId(),
      output: result,
    };
  } catch (error) {
    return {
      tool_name: 'Edit',
      tool_use_id: generateId(),
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute bash command
 *
 * @param input - Tool input with command and optional work_dir
 * @returns Tool result with command output
 */
export async function toolBash(input: BashToolInput): Promise<ToolResult> {
  const { command, work_dir, timeout = 120000 } = input;

  try {
    // ⏳ NEEDS RUST IMPLEMENTATION
    // TODO: After implementing execute_command in Rust:
    // const { executeCommand } from '../../lib/tauri-commands';
    // const output = await executeCommand(command, work_dir, timeout);

    console.log(`[Tool:Bash] Executing: ${command} in ${work_dir || 'default dir'}`);

    // Placeholder for now
    const output = `[Placeholder: Execute command "${command}" in Rust backend]`;

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

/**
 * Find files by glob pattern
 *
 * @param input - Tool input with pattern and optional path
 * @returns Tool result with list of matching files
 */
export async function toolGlob(input: GlobToolInput): Promise<ToolResult> {
  const { pattern, path = '.' } = input;

  try {
    // ⏳ NEEDS RUST IMPLEMENTATION
    // TODO: After implementing glob_files in Rust:
    // const { globFiles } from '../../lib/tauri-commands';
    // const files = await globFiles(pattern, path);

    console.log(`[Tool:Glob] Searching: ${pattern} in ${path}`);

    // Placeholder
    const files = [
      `${path}/example1.ts`,
      `${path}/example2.ts`,
    ];

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

/**
 * Search file contents with grep
 *
 * @param input - Tool input with pattern and options
 * @returns Tool result with matching lines
 */
export async function toolGrep(input: GrepToolInput): Promise<ToolResult> {
  const { pattern, path = '.', recursive = true, case_sensitive = false } = input;

  try {
    // ⏳ NEEDS RUST IMPLEMENTATION
    // TODO: After implementing grep_files in Rust:
    // const { grepFiles } from '../../lib/tauri-commands';
    // const matches = await grepFiles(pattern, path, recursive, case_sensitive);

    console.log(`[Tool:Grep] Searching for "${pattern}" in ${path}`);

    // Placeholder
    const matches = [
      `${path}/example.ts:10:const example = '${pattern}'`,
      `${path}/example.ts:20:return example;`,
    ];

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

// ============================================================================
// Tool Registry
// ============================================================================

/**
 * Tool registry maps tool names to their implementations
 */
export const TOOL_REGISTRY: Record<string, (input: unknown) => Promise<ToolResult>> = {
  Read: toolRead,
  Write: toolWrite,
  Edit: toolEdit,
  Bash: toolBash,
  Glob: toolGlob,
  Grep: toolGrep,
};

/**
 * Execute a tool by name
 *
 * @param toolName - Name of the tool to execute
 * @param toolInput - Input parameters for the tool
 * @returns Tool result
 */
export async function executeTool(
  toolName: string,
  toolInput: unknown
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    return {
      tool_name: toolName,
      tool_use_id: generateId(),
      output: '',
      error: `Unknown tool: ${toolName}`,
    };
  }

  return await tool(toolInput);
}

/**
 * Get list of available tools
 *
 * @returns Array of tool names
 */
export function getAvailableTools(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique tool use ID
 */
function generateId(): string {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate tool input
 *
 * TODO: Implement proper validation with schemas
 */
export function validateToolInput(toolName: string, input: unknown): boolean {
  // Basic validation for now
  if (!input || typeof input !== 'object') {
    return false;
  }

  switch (toolName) {
    case 'Read':
      return 'file_path' in input;
    case 'Write':
      return 'file_path' in input && 'content' in input;
    case 'Edit':
      return 'file_path' in input && 'old_string' in input && 'new_string' in input;
    case 'Bash':
      return 'command' in input;
    case 'Glob':
      return 'pattern' in input;
    case 'Grep':
      return 'pattern' in input;
    default:
      return false;
  }
}
