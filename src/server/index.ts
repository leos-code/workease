/**
 * WorkEase Backend Server
 * Hono-based API server for AI agent execution
 *
 * This server provides:
 * - Agent execution endpoints with SSE streaming
 * - Tool execution (Read, Write, Edit, Bash)
 * - Session and task management
 * - File operations and artifact generation
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { agentRoutes } from './routes/agent';
import { sessionRoutes } from './routes/sessions';
import { taskRoutes } from './routes/tasks';
import { fileRoutes } from './routes/files';
import { errorHandler } from './middleware/error-handler';
import type { Env } from './types';

// Create Hono app with typed environment
const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// Middleware
// ============================================================================

// CORS for frontend communication
app.use('*', cors({
  origin: ['http://localhost:1420', 'tauri://localhost'], // Tauri defaults
  credentials: true,
}));

// Request logging
app.use('*', logger());

// Error handling (must be last)
app.use('*', errorHandler);

// ============================================================================
// Health Check
// ============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'WorkEase API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.route('/agent', agentRoutes);
app.route('/sessions', sessionRoutes);
app.route('/tasks', taskRoutes);
app.route('/files', fileRoutes);

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

// ============================================================================
// Server Startup
// ============================================================================

const PORT = parseInt(process.env.PORT || '3001', 10);

console.log(`
╔═══════════════════════════════════════════════════════╗
║           WorkEase Backend Server                     ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(44)}║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(35)}║
║  Time: ${new Date().toISOString().padEnd(39)}║
╚═══════════════════════════════════════════════════════╝
`);

export default app;
