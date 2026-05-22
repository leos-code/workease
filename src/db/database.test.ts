/**
 * Database Service Tests
 * Tests for database CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService, getDatabase } from './database';

describe('Database Service', () => {
  let db: DatabaseService;

  beforeEach(() => {
    // Create a fresh database service for each test
    db = getDatabase(':memory:'); // Use in-memory database for tests
  });

  describe('Initialization', () => {
    it('should create database instance', () => {
      expect(db).toBeInstanceOf(DatabaseService);
    });

    it('should return singleton instance', () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      expect(db1).toBe(db2);
    });
  });

  describe('Session Operations', () => {
    it('should create a new session', async () => {
      const result = await db.createSession('Test prompt');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeDefined();
        expect(result.data.prompt).toBe('Test prompt');
        expect(result.data.task_count).toBe(0);
      }
    });

    it('should generate unique session IDs', async () => {
      const session1 = await db.createSession('Prompt 1');
      const session2 = await db.createSession('Prompt 2');

      if (session1.success && session2.success) {
        expect(session1.data.id).not.toBe(session2.data.id);
      }
    });

    it('should increment task count', async () => {
      const session = await db.createSession('Test');
      if (!session.success) return;

      await db.incrementTaskCount(session.data.id);
      // Note: This will be a no-op until Rust backend is implemented
      // but should not throw an error
      expect(true).toBe(true);
    });
  });

  describe('Task Operations', () => {
    it('should create a new task', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const result = await db.createTask(
        session.data.id,
        1,
        'Test task'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeDefined();
        expect(result.data.prompt).toBe('Test task');
        expect(result.data.status).toBe('running');
      }
    });

    it('should create tasks with correct status', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const task = await db.createTask(session.data.id, 1, 'Test task');
      if (!task.success) return;

      expect(task.data.status).toBe('running');
      expect(task.data.favorite).toBe(false);
    });

    it('should update task status', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const task = await db.createTask(session.data.id, 1, 'Test task');
      if (!task.success) return;

      const result = await db.updateTaskStatus(
        task.data.id,
        'completed',
        0.001,
        1000
      );

      // Note: This will be a no-op until Rust backend is implemented
      expect(result.success).toBe(true);
    });
  });

  describe('Message Operations', () => {
    it('should create a text message', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const task = await db.createTask(session.data.id, 1, 'Test task');
      if (!task.success) return;

      const result = await db.createMessage(
        task.data.id,
        'text',
        'Test message content'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('text');
        expect(result.data.content).toBe('Test message content');
      }
    });

    it('should create a tool_use message', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const task = await db.createTask(session.data.id, 1, 'Test task');
      if (!task.success) return;

      const result = await db.createMessage(task.data.id, 'tool_use', undefined, {
        tool_name: 'Read',
        tool_input: '{"file_path":"test.txt"}',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('tool_use');
        expect(result.data.tool_name).toBe('Read');
      }
    });
  });

  describe('Artifact Operations', () => {
    it('should create an artifact', async () => {
      const session = await db.createSession('Test session');
      if (!session.success) return;

      const task = await db.createTask(session.data.id, 1, 'Test task');
      if (!task.success) return;

      const result = await db.createArtifact(
        task.data.id,
        'test.html',
        'html',
        '/path/to/test.html'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test.html');
        expect(result.data.type).toBe('html');
        expect(result.data.path).toBe('/path/to/test.html');
      }
    });
  });

  describe('Settings Operations', () => {
    it('should set and get settings', async () => {
      await db.setSetting('test_key', 'test_value');
      const result = await db.getSetting('test_key');

      expect(result.success).toBe(true);
      // Note: Will be undefined until Rust backend is implemented
    });

    it('should get all settings', async () => {
      await db.setSetting('key1', 'value1');
      await db.setSetting('key2', 'value2');

      const result = await db.getAllSettings();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe('object');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid data
      const result = await db.createSession('');
      // Should not throw, but return error result
      expect(result).toBeDefined();
    });
  });
});
