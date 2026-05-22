/**
 * Test Utilities
 * Helper functions for writing tests
 */

/**
 * Mock a successful tool result
 */
export function mockToolResult(toolName: string, output: string) {
  return {
    tool_name: toolName,
    tool_use_id: `mock_tool_${Date.now()}`,
    output,
    error: undefined,
  };
}

/**
 * Mock a failed tool result
 */
export function mockToolError(toolName: string, errorMessage: string) {
  return {
    tool_name: toolName,
    tool_use_id: `mock_tool_${Date.now()}`,
    output: '',
    error: errorMessage,
  };
}

/**
 * Wait for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a temporary file path for testing
 */
export function tempFilePath(name: string): string {
  return `/tmp/workease-test-${Date.now()}-${name}`;
}

/**
 * Mock file system state
 */
export interface MockFileSystem {
  files: Record<string, string>;
  directories: string[];
}

/**
 * Create a mock file system for testing
 */
export function createMockFileSystem(): MockFileSystem {
  return {
    files: {
      '/test/file1.ts': 'export function test() { return true; }',
      '/test/file2.ts': 'export const value = 42;',
      '/test/README.md': '# Test Project',
    },
    directories: ['/test', '/test/src'],
  };
}

/**
 * Assert that a tool result is successful
 */
export function assertToolSuccess(result: {
  error?: string;
  output?: string;
}): void {
  if (result.error) {
    throw new Error(`Tool failed: ${result.error}`);
  }
}

/**
 * Assert that a tool result failed
 */
export function assertToolError(result: {
  error?: string;
  output?: string;
}): void {
  if (!result.error) {
    throw new Error('Expected tool to fail but it succeeded');
  }
}

/**
 * Create a mock task request
 */
export function mockTaskRequest(prompt: string = 'Test task') {
  return {
    prompt,
    task_id: `test-task-${Date.now()}`,
    model_config: {
      provider: 'anthropic' as const,
      model: 'claude-sonnet-4-5-20250929',
    },
  };
}

/**
 * Create a mock session
 */
export function mockSession(id: string = 'test-session') {
  return {
    id,
    prompt: 'Test session',
    task_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Track test execution time
 */
export class TestTimer {
  private start: number;

  constructor() {
    this.start = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.start;
  }

  /**
   * Assert that execution time is within expected range
   */
  assertLessThan(maxMs: number, operation: string): void {
    const elapsed = this.elapsed();
    if (elapsed > maxMs) {
      throw new Error(
        `${operation} took ${elapsed}ms (expected < ${maxMs}ms)`
      );
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

/**
 * Mock console methods to reduce noise in tests
 */
export function mockConsole() {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.log = original.log;
    console.error = original.error;
    console.warn = original.warn;
  });
}
