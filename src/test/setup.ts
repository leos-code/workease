/**
 * Test Setup File
 * Runs before all tests
 */

// Mock Tauri API for testing (we're in Node environment)
global.mockInvoke = async (cmd: string, args?: unknown) => {
  console.log(`[Mock Tauri] ${cmd}`, args);

  // Mock implementations for testing
  switch (cmd) {
    case 'read_file':
      return 'mock file content';

    case 'write_file':
      return undefined;

    case 'execute_command':
      return 'mock command output';

    case 'glob_files':
      return ['file1.ts', 'file2.ts', 'file3.ts'];

    case 'grep_files':
      return ['file1.ts:mock match', 'file2.ts:another match'];

    case 'list_directory':
      return [
        { name: 'test.txt', path: '/test/test.txt', is_dir: false, size: 100 },
      ];

    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
};

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
process.env.TEST_TIMEOUT = '10000';

console.log('✅ Test environment initialized');
console.log('📊 Coverage target: 85%');
