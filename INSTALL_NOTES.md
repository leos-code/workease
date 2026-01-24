# WorkEase Installation Notes

## Required Backend Dependencies

To run the Hono backend server, install these dependencies:

```bash
npm install hono @hono/server
```

### Full dependency list for current implementation:

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/server": "^1.0.0"
  }
}
```

## After Installation

Once dependencies are installed, you can:

1. **Run the development server**:
   ```bash
   npm run dev
   ```

2. **Run the backend server only**:
   ```bash
   node --import tsx src/server/index.ts
   ```

   (Note: Add this script to package.json as `"server": "node --import tsx src/server/index.ts"`)

## TODO: Add to package.json scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "server": "node --import tsx src/server/index.ts",
    "dev:server": "node --import tsx watch src/server/index.ts",
    "tauri": "tauri",
    "test": "vitest"
  }
}
```

## Current Project Status

### ✅ Implemented

1. **Core Types** (`src/types/index.ts`)
   - All data models defined
   - API request/response types
   - SSE streaming types

2. **Database Schema** (`src/db/schema.sql`)
   - Complete SQLite schema
   - Migration tracking
   - Proper indexes and constraints

3. **Database Service** (`src/db/database.ts`)
   - Type-safe API
   - CRUD operations for all entities
   - Ready for Rust backend integration

4. **Backend Server** (`src/server/`)
   - Hono server structure
   - All route definitions
   - SSE streaming endpoint
   - Error handling middleware
   - Comprehensive documentation

### ⚠️ Needs Dependencies

1. **Hono** - Web framework for backend server
2. **Database drivers** - For Rust backend (rusqlite or tauri-plugin-sql)
3. **Claude SDK** - When available, for actual AI integration

### 📋 Next Steps

1. Install Hono dependencies
2. Implement actual tool execution logic
3. Integrate with Claude SDK (when available)
4. Complete Rust database backend
5. Add comprehensive tests
6. Implement MCP server integration

## Development Workflow

1. **Start Tauri dev server**:
   ```bash
   npm run tauri dev
   ```

2. **Start backend server** (separate terminal):
   ```bash
   npm run server
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

## Architecture Notes

The project uses a hybrid backend approach:

1. **Tauri (Rust)** - Native desktop features
   - File system operations
   - Database (SQLite)
   - OS integration

2. **Hono (Node.js)** - AI agent execution
   - Task execution endpoints
   - Tool orchestration
   - SSE streaming
   - External API integration

This separation provides:
- Better security (Tauri for system operations)
- Flexibility (Node.js for AI/external APIs)
- Performance (Native Rust for file I/O)
- Maintainability (Clear separation of concerns)
