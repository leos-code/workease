import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/',
        'dist/',
        'build/',
      ],
      // Target: 85% coverage per AGENT.md requirements
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
    // Split tests into workers for faster execution
    threads: true,
    // Increase timeout for integration tests
    testTimeout: 10000,
    hookTimeout: 10000,
    // Show verbose output
    reporters: ['verbose'],
    // Output format
    outputFile: './test-results/results.json',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@server': path.resolve(__dirname, './src/server'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
