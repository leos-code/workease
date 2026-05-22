# Testing Guide for WorkEase

## Overview

This guide covers testing practices, procedures, and guidelines for the WorkEase project.

**Test Framework**: Vitest
**Coverage Target**: 85% per AGENT.md requirements
**Philosophy**: Test essential functionality, focus on core features first

---

## Test Framework Setup

### Installation

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
```

### Configuration

Test configuration is in `vitest.config.ts`:
- Environment: Node.js
- Coverage: v8 provider with 85% thresholds
- Timeout: 10 seconds for integration tests
- Parallel execution: Enabled

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run UI (Interactive)

```bash
npm run test:ui
```

### Run Specific Test File

```bash
npx vitest src/server/services/tools.test.ts
```

---

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test setup and globals
│   └── utils.ts          # Test utilities and helpers
├── server/
│   └── services/
│       ├── tools.ts      # Implementation
│       └── tools.test.ts # Tests
└── db/
    ├── database.ts       # Implementation
    └── database.test.ts  # Tests
```

### Naming Convention

- Test files: `*.test.ts` or `*.spec.ts`
- Test suites: `describe('FeatureName', ...)`
- Test cases: `it('should do something', ...)`

---

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Mocking Tauri Commands

```typescript
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// In your test
const { invoke } = await import('@tauri-apps/api/core');
vi.mocked(invoke).mockResolvedValue('mock result');
```

---

## Test Categories

### Unit Tests

Test individual functions and classes in isolation.

**Example: Tool Validation**

```typescript
describe('Tool Input Validation', () => {
  it('should validate Read tool input', () => {
    const valid = validateToolInput('Read', { file_path: 'test.txt' });
    expect(valid).toBe(true);
  });
});
```

### Integration Tests

Test multiple components working together.

**Example: Tool Execution**

```typescript
describe('Tool Execution Integration', () => {
  it('should execute Read tool end-to-end', async () => {
    const result = await executeTool('Read', { file_path: 'test.txt' });
    expect(result.tool_name).toBe('Read');
    expect(result.output).toBeDefined();
  });
});
```

### Error Handling Tests

Test error conditions and edge cases.

**Example: Tool Errors**

```typescript
it('should handle Read tool errors', async () => {
  vi.mocked(invoke).mockRejectedValue(new Error('File not found'));
  const result = await executeTool('Read', { file_path: 'bad.txt' });
  expect(result.error).toContain('File not found');
});
```

---

## Coverage Guidelines

### Target: 85% Coverage

We aim for 85% code coverage across:
- **Lines**: 85%
- **Functions**: 85%
- **Branches**: 85%
- **Statements**: 85%

### What to Test

**DO Test:**
- ✅ Core business logic
- ✅ Tool execution functions
- ✅ Data transformations
- ✅ Error handling paths
- ✅ Critical user flows

**DON'T Test:**
- ❌ Trivial getters/setters
- ❌ Type definitions
- ❌ Third-party library code
- ❌ Configuration files
- ❌ Mock/stub implementations

### Coverage Reports

```bash
npm run test:coverage
```

Results in:
- Console output
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - Machine-readable report

---

## Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:
```typescript
it('should call invoke with read_file', () => {
  expect(invoke).toHaveBeenCalledWith('read_file', { path: 'test.txt' });
});
```

✅ **Good**:
```typescript
it('should read file contents', async () => {
  const result = await toolRead({ file_path: 'test.txt' });
  expect(result.output).toContain('expected content');
});
```

### 2. Use Descriptive Test Names

❌ **Bad**:
```typescript
it('works', () => {});
```

✅ **Good**:
```typescript
it('should read file and return contents', () => {});
```

### 3. Arrange, Act, Assert

Organize tests clearly:

```typescript
it('should write file to disk', async () => {
  // Arrange
  const filePath = 'test.txt';
  const content = 'Hello, World!';

  // Act
  const result = await toolWrite({ file_path: filePath, content });

  // Assert
  expect(result.output).toContain('Successfully wrote');
  expect(result.error).toBeUndefined();
});
```

### 4. Test One Thing Per Test

❌ **Bad**:
```typescript
it('should handle all tools', () => {
  // Tests Read, Write, Edit, Bash, Glob, Grep all in one test
});
```

✅ **Good**:
```typescript
it('should read file correctly', () => {});
it('should write file correctly', () => {});
it('should edit file correctly', () => {});
```

### 5. Mock External Dependencies

Mock Tauri API, file system, network calls:

```typescript
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
```

---

## Test Utilities

### Available Utilities

Located in `src/test/utils.ts`:

- `mockToolResult()` - Create mock tool result
- `mockToolError()` - Create mock tool error
- `delay()` - Wait for async operations
- `tempFilePath()` - Generate temp file path
- `createMockFileSystem()` - Create mock file system
- `assertToolSuccess()` - Assert tool succeeded
- `assertToolError()` - Assert tool failed
- `mockTaskRequest()` - Create mock task
- `mockSession()` - Create mock session
- `TestTimer` - Measure test execution time
- `retry()` - Retry flaky operations

### Example Usage

```typescript
import { mockToolResult, assertToolSuccess, TestTimer } from '../test/utils';

it('should execute tool quickly', async () => {
  const timer = new TestTimer();
  const result = await executeTool('Read', { file_path: 'test.txt' });

  assertToolSuccess(result);
  timer.assertLessThan(1000, 'Read tool');
});
```

---

## Current Test Suite

### Tools Tests (`src/server/services/tools.test.ts`)

Covers:
- ✅ Tool registry validation
- ✅ Input validation for all 6 tools
- ✅ Tool execution (Read, Write, Edit, Bash, Glob, Grep)
- ✅ Error handling
- ✅ Result format consistency

**Tests**: 15+
**Coverage**: ~80% of tool service

### Database Tests (`src/db/database.test.ts`)

Covers:
- ✅ Session CRUD operations
- ✅ Task CRUD operations
- ✅ Message creation
- ✅ Artifact creation
- ✅ Settings management
- ✅ Error handling

**Tests**: 12+
**Coverage**: ~70% of database service

---

## Testing Checklist

Before committing code, ensure:

- [ ] All new functions have tests
- [ ] All error paths are tested
- [ ] Coverage is at least 85%
- [ ] Tests are deterministic (no random failures)
- [ ] Test names are descriptive
- [ ] Mocks are properly cleaned up
- [ ] No `console.log` in tests (use expect instead)

---

## Continuous Integration

### Pre-Commit Hook

```bash
# Run tests before commit
npm test

# Skip if you must (not recommended)
git commit --no-verify -m "WIP"
```

### Pre-Push Hook

```bash
# Run full test suite with coverage
npm run test:coverage
```

---

## Troubleshooting

### Tests Time Out

**Problem**: Tests exceed 10 second timeout

**Solution**:
```typescript
it('should handle slow operation', async () => {
  // Increase timeout for this test
  vi.advanceTimersByTime(15000);
}, { timeout: 15000 });
```

### Mock Not Working

**Problem**: Mock isn't being used

**Solution**:
```typescript
// Mock BEFORE importing
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Then import
import { invoke } from '@tauri-apps/api/core';
```

### Coverage Not Calculating

**Problem**: Coverage shows 0%

**Solution**:
```bash
# Clear cache
npx vitest --clearCache

# Recalculate coverage
npm run test:coverage
```

---

## Next Steps

### Immediate

1. ✅ Install Vitest
2. ✅ Configure vitest.config.ts
3. ✅ Write initial tests
4. ✅ Create test utilities

### Short Term

5. Add tests for:
   - Agent executor service
   - Hono server routes
   - Frontend components
   - Tauri commands (once deployed)

6. Increase coverage to 85%
7. Add CI/CD integration

### Long Term

8. Add E2E tests
9. Add performance tests
10. Add visual regression tests

---

**Status**: Test framework complete, initial tests written
**Next**: Add tests for remaining services, increase coverage to 85%
