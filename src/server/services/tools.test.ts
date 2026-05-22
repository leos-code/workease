/**
 * Tool Execution Service Tests
 * Tests for all 6 tools (Read, Write, Edit, Bash, Glob, Grep)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  toolRead,
  toolWrite,
  toolEdit,
  toolBash,
  toolGlob,
  toolGrep,
  executeTool,
  validateToolInput,
  getAvailableTools,
} from './tools';
import type { ToolResult } from '../../types';

// Mock Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('Tool Execution Service', () => {
  describe('Tool Registry', () => {
    it('should list all available tools', () => {
      const tools = getAvailableTools();

      expect(tools).toContain('Read');
      expect(tools).toContain('Write');
      expect(tools).toContain('Edit');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Glob');
      expect(tools).toContain('Grep');
      expect(tools).toHaveLength(6);
    });
  });

  describe('Tool Input Validation', () => {
    it('should validate Read tool input', () => {
      const valid = validateToolInput('Read', { file_path: 'test.txt' });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Read', {});
      expect(invalid).toBe(false);
    });

    it('should validate Write tool input', () => {
      const valid = validateToolInput('Write', {
        file_path: 'test.txt',
        content: 'content',
      });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Write', { file_path: 'test.txt' });
      expect(invalid).toBe(false);
    });

    it('should validate Edit tool input', () => {
      const valid = validateToolInput('Edit', {
        file_path: 'test.txt',
        old_string: 'old',
        new_string: 'new',
      });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Edit', { file_path: 'test.txt' });
      expect(invalid).toBe(false);
    });

    it('should validate Bash tool input', () => {
      const valid = validateToolInput('Bash', { command: 'echo test' });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Bash', {});
      expect(invalid).toBe(false);
    });

    it('should validate Glob tool input', () => {
      const valid = validateToolInput('Glob', { pattern: '*.ts' });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Glob', {});
      expect(invalid).toBe(false);
    });

    it('should validate Grep tool input', () => {
      const valid = validateToolInput('Grep', { pattern: 'function' });
      expect(valid).toBe(true);

      const invalid = validateToolInput('Grep', {});
      expect(invalid).toBe(false);
    });
  });

  describe('executeTool', () => {
    it('should execute Read tool', async () => {
      // Mock the Tauri command
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('mock file content');

      const result = await executeTool('Read', { file_path: 'test.txt' });

      expect(result.tool_name).toBe('Read');
      expect(result.output).toBe('mock file content');
      expect(result.error).toBeUndefined();
    });

    it('should handle Read tool errors', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValue(new Error('File not found'));

      const result = await executeTool('Read', { file_path: 'nonexistent.txt' });

      expect(result.tool_name).toBe('Read');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('File not found');
    });

    it('should execute Write tool', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue(undefined);

      const result = await executeTool('Write', {
        file_path: 'test.txt',
        content: 'test content',
      });

      expect(result.tool_name).toBe('Write');
      expect(result.output).toContain('Successfully wrote');
      expect(result.error).toBeUndefined();
    });

    it('should execute Edit tool', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke)
        .mockResolvedValueOnce('old content here') // read
        .mockResolvedValue(undefined); // write

      const result = await executeTool('Edit', {
        file_path: 'test.txt',
        old_string: 'old',
        new_string: 'new',
      });

      expect(result.tool_name).toBe('Edit');
      expect(result.output).toContain('Successfully replaced');
      expect(result.error).toBeUndefined();
    });

    it('should handle Edit when string not found', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('different content');

      const result = await executeTool('Edit', {
        file_path: 'test.txt',
        old_string: 'not found',
        new_string: 'new',
      });

      expect(result.tool_name).toBe('Edit');
      expect(result.error).toContain('not found');
    });

    it('should execute Bash tool', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('command output');

      const result = await executeTool('Bash', {
        command: 'echo test',
      });

      expect(result.tool_name).toBe('Bash');
      expect(result.output).toBe('command output');
      expect(result.error).toBeUndefined();
    });

    it('should execute Glob tool', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue(['file1.ts', 'file2.ts']);

      const result = await executeTool('Glob', {
        pattern: '*.ts',
        path: './src',
      });

      expect(result.tool_name).toBe('Glob');
      expect(result.output).toContain('file1.ts');
      expect(result.output).toContain('file2.ts');
      expect(result.error).toBeUndefined();
    });

    it('should execute Grep tool', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue([
        'file1.ts:export function',
        'file2.ts:const value',
      ]);

      const result = await executeTool('Grep', {
        pattern: 'function',
        path: './src',
        recursive: true,
      });

      expect(result.tool_name).toBe('Grep');
      expect(result.output).toContain('export function');
      expect(result.output).toContain('const value');
      expect(result.error).toBeUndefined();
    });

    it('should handle unknown tool', async () => {
      const result = await executeTool('UnknownTool' as any, {});

      expect(result.tool_name).toBe('UnknownTool');
      expect(result.error).toContain('Unknown tool');
    });
  });

  describe('Tool Result Format', () => {
    it('should return consistent tool result format', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue('test');

      const result = await executeTool('Read', { file_path: 'test.txt' });

      // Verify all required fields exist
      expect(result).toHaveProperty('tool_name');
      expect(result).toHaveProperty('tool_use_id');
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('error');

      // Verify types
      expect(typeof result.tool_name).toBe('string');
      expect(typeof result.tool_use_id).toBe('string');
      expect(typeof result.output).toBe('string');
      expect(typeof result.error === 'undefined' || typeof result.error === 'string').toBe(true);
    });
  });
});
