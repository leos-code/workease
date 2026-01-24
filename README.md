# WorkEase

An open-source desktop application inspired by Anthropic's Cowork, built with modern technologies.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Hono, Claude Agent SDK, MCP SDK (planned) |
| Desktop | Tauri 2, SQLite |

## Features

- **Task Execution** - Natural language task input with real-time streaming
- **Agent Runtime** - Powered by Claude
- **Sub-Agent System** - Parallel task execution with progress tracking
- **File Management** - Local file access with granular permissions
- **Connectors** - Integration with external services (Chrome, Google Sheets, Slack, GitHub)
- **MCP Support** - Model Context Protocol server integration (planned)
- **Multi-provider** - Support for OpenRouter, Anthropic, OpenAI (planned)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

3. **Build for production:**
   ```bash
   npm run tauri build
   ```

## Project Structure

```
workease/
├── src/                          # React Frontend
│   ├── components/               # UI Components
│   │   ├── layout/              # MainLayout, Sidebar, TaskPanel
│   │   ├── chat/                # MessageBubble, InputBox
│   │   ├── files/               # FolderCard
│   │   ├── connectors/          # ConnectorCard
│   │   └── ui/                  # Button, Badge, Toggle
│   ├── pages/                   # Page Components
│   │   ├── NewTaskPage.tsx      # Welcome/New Task
│   │   ├── TaskPage.tsx         # Task Execution
│   │   ├── FilesPage.tsx        # File Management
│   │   └── ConnectorsPage.tsx   # Connectors
│   ├── stores/                  # Zustand State Management
│   ├── lib/                     # Utilities & Tauri API
│   └── styles/                  # Global CSS
├── src-tauri/                   # Tauri Backend (Rust)
│   ├── src/
│   │   └── lib.rs              # IPC Commands
│   └── tauri.conf.json         # Tauri Configuration
└── package.json
```

## Design System

The UI follows a dark theme with orange accents:

- **Background**: `#0A0A0B` (page), `#111113` (surface)
- **Accent**: `#FF5C00` (primary), `#FF8A4C` (light)
- **Typography**: Inter (body), Instrument Serif (display), DM Mono (code)

## Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend
- `npm run tauri dev` - Start Tauri in development mode
- `npm run tauri build` - Build Tauri application

## License

MIT
