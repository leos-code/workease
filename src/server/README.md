# WorkEase Backend Server

Hono-based API server for WorkEase AI agent application.

## Overview

The backend server provides RESTful API endpoints with Server-Sent Events (SSE) streaming for real-time agent execution. It handles task execution, tool orchestration, session management, and file operations.

## Architecture

```
src/server/
├── index.ts              # Main server entry point
├── types.ts              # TypeScript type definitions
├── middleware/
│   └── error-handler.ts  # Error handling middleware
├── routes/
│   ├── agent.ts          # Agent execution endpoints
│   ├── sessions.ts       # Session management
│   ├── tasks.ts          # Task management
│   └── files.ts          # File & artifact operations
└── services/
    └── agent-executor.ts # Core task execution logic
```

## API Endpoints

### Health Check

- `GET /` - Server info
- `GET /health` - Health status

### Agent Execution

- `POST /agent/execute` - Execute task with SSE streaming
- `POST /agent/stop` - Stop a running task
- `POST /agent/plan` - Generate execution plan
- `POST /agent/execute-plan` - Execute approved plan

### Sessions

- `GET /sessions` - List all sessions
- `GET /sessions/:id` - Get specific session
- `POST /sessions` - Create new session
- `DELETE /sessions/:id` - Delete session

### Tasks

- `GET /tasks` - List tasks with filters
- `GET /tasks/:id` - Get specific task
- `GET /tasks/:id/messages` - Get task messages
- `PATCH /tasks/:id/favorite` - Toggle favorite
- `DELETE /tasks/:id` - Delete task

### Files

- `GET /files/artifacts` - List artifacts
- `GET /files/artifacts/:id` - Get artifact
- `GET /files/artifacts/:id/preview` - Get artifact preview
- `POST /files/upload` - Upload file attachment
- `GET /files/tree` - Get workspace file tree
- `GET /files/content` - Read file content

## Installation

Required dependencies:

```bash
npm install hono @hono/server
```

## Running the Server

Development mode:

```bash
npm run dev:server
```

Production mode:

```bash
npm run server
```

The server runs on port 3001 by default (configurable via `PORT` environment variable).

## SSE Streaming Example

The `/agent/execute` endpoint uses Server-Sent Events for real-time streaming:

```typescript
const response = await fetch('http://localhost:3001/agent/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Build a todo app',
    task_id: 'task-123',
    model_config: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    },
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Received:', data);
    }
  }
}
```

## Stream Message Types

Messages sent during execution:

```typescript
// Session started
{ type: 'session', session_id: string }

// Planning phase
{ type: 'plan', plan: TaskPlan }

// Text response
{ type: 'text', content: string }

// Tool use
{ type: 'tool_use', name: string, input: unknown, id: string }

// Tool result
{ type: 'tool_result', tool_use_id: string, output: string }

// Error
{ type: 'error', message: string }

// Done
{ type: 'done' }
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENAI_API_KEY` - OpenAI API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `DATABASE_PATH` - SQLite database path
- `WORK_DIR` - Workspace directory
- `SESSIONS_DIR` - Sessions directory
- `SANDBOX_ENABLED` - Enable sandbox execution (true/false)
- `MCP_ENABLED` - Enable MCP servers (true/false)

## Error Handling

All errors follow a consistent format:

```typescript
{
  success: false,
  error: string,        // Error type
  message?: string,     // Human-readable message
  stack?: string        // Stack trace (dev only)
}
```

## TODO: Implementation Status

### ✅ Completed

- [x] Server structure and routing
- [x] Error handling middleware
- [x] SSE streaming endpoint structure
- [x] Route definitions for all endpoints
- [x] TypeScript type definitions

### ⚠️ In Progress

- [ ] Actual Claude SDK integration
- [ ] Tool execution implementation
- [ ] Database connection
- [ ] File operations
- [ ] Session persistence

### ❌ Not Started

- [ ] MCP server integration
- [ ] Sandbox execution
- [ ] Artifact preview generation
- [ ] File upload handling
- [ ] Authentication/authorization

## Integration with Frontend

The frontend communicates with the backend via:

1. **Tauri commands** (preferred for desktop app)
   - Direct Rust backend integration
   - Better security and performance

2. **HTTP API** (development/fallback)
   - Standard REST endpoints
   - SSE streaming for real-time updates

## Development Notes

1. **SSE Connections**: Keep alive with heartbeats if needed
2. **Task Cancellation**: Implement AbortController for stopping tasks
3. **Rate Limiting**: Add rate limiting for production
4. **CORS**: Configured for Tauri (localhost:1420, tauri://localhost)
5. **Logging**: Request logging enabled via Hono logger middleware

## Testing

To test the server:

```bash
# Health check
curl http://localhost:3001/health

# Execute task (requires SSE client)
curl -X POST http://localhost:3001/agent/execute \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","task_id":"123"}'
```

## Future Enhancements

- WebSocket support for bidirectional communication
- Task queue management
- Parallel execution support
- Result caching
- Metrics and monitoring
- API versioning
