# WorkEase 产品需求文档 (PRD)

**版本**: 1.0  
**日期**: 2026-01-24  
**项目**: WorkEase Desktop AI Agent Application

---

## 1. 产品概述

### 1.1 产品定位

WorkEase 是一款基于桌面端的 AI 代理应用，通过自然语言交互执行复杂任务。它集成了 Claude Agent SDK，提供实时代码生成、工具执行、工作区管理和多模态内容预览能力。

### 1.2 核心价值主张

- **自然语言任务执行**：用户通过自然语言描述任务，AI 代理自动规划并执行
- **实时流式响应**：任务执行过程实时反馈，支持流式输出
- **多模态内容生成**：支持生成文档、表格、演示文稿、代码、网站等多种格式
- **安全沙箱执行**：代码在隔离环境中执行，确保系统安全
- **可扩展架构**：支持 MCP 协议、自定义 Skills、多模型提供商

### 1.3 目标用户

- **开发者**：需要快速生成代码、搭建项目原型
- **内容创作者**：需要生成文档、演示文稿、数据表格
- **数据分析师**：需要处理数据、生成报告
- **技术爱好者**：探索 AI 代理能力的早期采用者

---

## 2. 技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────┐
│         Tauri Desktop Shell              │
│  (Rust + WebView + Native APIs)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Frontend      │    │  Backend API    │
│  (React 19)    │◄───┤  (Hono Server)  │
│  TypeScript    │    │  Node.js        │
│  Tailwind CSS  │    │  Claude SDK     │
└────────────────┘    └────────────────┘
        │                       │
        │              ┌────────▼────────┐
        │              │  External       │
        │              │  Services       │
        │              │  - Claude API   │
        │              │  - Codex CLI    │
        │              │  - MCP Servers  │
        │              └────────────────┘
        │
┌───────▼────────────────────────────────┐
│  Local Storage                          │
│  - SQLite (Tasks, Messages, Files)     │
│  - File System (Sessions, Attachments)  │
└─────────────────────────────────────────┘
```

### 2.2 技术栈

#### 前端层
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 4
- **UI 组件**: Radix UI + 自定义组件
- **路由**: React Router v7
- **状态管理**: React Hooks + Context API
- **国际化**: 自定义 i18n 系统（支持中英文）

#### 后端层
- **框架**: Hono (轻量级 Web 框架)
- **运行时**: Node.js 20+
- **AI SDK**: Claude Agent SDK
- **沙箱**: Codex CLI / Claude Code
- **协议支持**: MCP (Model Context Protocol)

#### 桌面层
- **框架**: Tauri 2
- **语言**: Rust
- **数据库**: SQLite (via Tauri SQL Plugin)
- **文件系统**: Tauri FS Plugin

---

## 3. 核心功能模块

### 3.1 任务管理

#### 3.1.1 任务创建与执行
- **功能描述**: 用户通过自然语言输入任务，系统创建任务并开始执行
- **输入方式**:
  - 文本输入
  - 图片附件（支持多张）
  - 文件附件
- **执行流程**:
  1. 接收用户输入
  2. 创建任务记录（Task）
  3. 生成会话 ID（Session）
  4. 两阶段执行：
     - **阶段 1**: 规划（Planning）- 生成执行计划
     - **阶段 2**: 执行（Execution）- 执行计划中的步骤
  5. 实时流式返回执行结果

#### 3.1.2 任务状态管理
- **状态类型**:
  - `running`: 执行中
  - `completed`: 已完成
  - `error`: 执行错误
  - `stopped`: 用户停止
- **状态持久化**: 所有状态保存在 SQLite 数据库

#### 3.1.3 任务列表与搜索
- **功能**: 任务库页面展示所有历史任务
- **特性**:
  - 按时间倒序排列
  - 支持搜索（按任务描述）
  - 支持收藏（Favorite）
  - 支持删除
  - 显示任务状态和运行指示器

### 3.2 Agent 执行引擎

#### 3.2.1 两阶段执行模式

**阶段 1: 规划（Planning）**
- 接收用户任务描述
- AI 分析任务复杂度
- 简单任务：直接回答（Direct Answer）
- 复杂任务：生成执行计划（Plan）
- 计划包含：
  - 目标（Goal）
  - 步骤列表（Steps）
  - 每个步骤的描述和状态

**阶段 2: 执行（Execution）**
- 用户批准计划后开始执行
- 按步骤顺序执行
- 实时更新步骤状态：
  - `pending`: 待执行
  - `in_progress`: 执行中
  - `completed`: 已完成
  - `failed`: 执行失败

#### 3.2.2 工具执行系统

**内置工具**:
- `Read`: 读取文件
- `Write`: 写入文件
- `Edit`: 编辑文件
- `Bash`: 执行 Shell 命令
- `Glob`: 文件搜索
- `Grep`: 文本搜索
- `WebSearch`: 网络搜索
- `WebFetch`: 获取网页内容
- `Task`: 子任务执行
- `AskUserQuestion`: 向用户提问

**工具执行流程**:
1. Agent 决定使用工具
2. 发送 `tool_use` 消息
3. 后端执行工具
4. 返回 `tool_result` 消息
5. Agent 根据结果继续执行

#### 3.2.3 会话管理
- **会话（Session）**: 一个会话可以包含多个相关任务
- **任务索引**: 每个任务在会话中有唯一索引
- **工作目录**: 每个会话有独立的工作目录
- **文件隔离**: 不同会话的文件互不干扰

### 3.3 内容预览系统

#### 3.3.1 工件（Artifact）管理
- **工件类型**:
  - `html`: HTML 网页
  - `jsx`: React 组件
  - `code`: 代码文件（多种语言）
  - `document`: 文档（PDF, DOCX）
  - `spreadsheet`: 表格（XLSX）
  - `presentation`: 演示文稿（PPTX）
  - `image`: 图片
  - `text`: 文本文件
  - `markdown`: Markdown 文件

#### 3.3.2 预览功能
- **代码预览**: 语法高亮、行号显示
- **文档预览**: PDF、DOCX、PPTX、XLSX 预览
- **图片预览**: 支持多种图片格式
- **实时预览**: HTML/React 文件支持 Vite 实时预览
- **预览切换**: 支持在多个工件间切换

#### 3.3.3 工作区文件树
- **功能**: 显示会话工作目录的文件结构
- **特性**:
  - 实时更新（文件变化时自动刷新）
  - 文件类型图标
  - 文件大小显示
  - 支持打开文件

### 3.4 沙箱执行环境

#### 3.4.1 沙箱配置
- **提供商选择**:
  - Claude Code (默认)
  - Codex CLI
  - Native (本地执行，需谨慎)
- **配置项**:
  - 启用/禁用沙箱
  - 选择沙箱提供商
  - API 端点配置

#### 3.4.2 安全隔离
- 代码在隔离环境中执行
- 防止恶意代码影响系统
- 资源限制（CPU、内存、网络）

### 3.5 MCP 集成

#### 3.5.1 MCP 协议支持
- **功能**: 集成 Model Context Protocol 服务器
- **配置**: 通过配置文件管理 MCP 服务器
- **工具暴露**: MCP 服务器提供的工具自动暴露给 Agent

#### 3.5.2 MCP 服务器管理
- 添加/删除 MCP 服务器
- 配置服务器参数
- 查看可用工具列表

### 3.6 Skills 系统

#### 3.6.1 自定义技能
- **功能**: 用户可添加自定义 Agent 技能
- **技能目录**: 指定技能文件目录
- **技能格式**: 支持多种技能格式

#### 3.6.2 技能执行
- Agent 可调用自定义技能
- 技能输出自动识别和保存

### 3.7 模型提供商管理

#### 3.7.1 支持的提供商
- **默认提供商**: 使用环境变量配置
- **OpenRouter**: 支持多种模型
- **Anthropic**: Claude 系列模型
- **OpenAI**: GPT 系列模型
- **自定义提供商**: 支持自定义 API 端点

#### 3.7.2 模型配置
- API Key 管理
- Base URL 配置
- 模型选择
- 默认模型设置

### 3.8 设置系统

#### 3.8.1 账户设置
- 用户信息管理
- API Key 配置

#### 3.8.2 通用设置
- 语言选择（中文/英文）
- 主题设置（亮色/暗色）
- 自动保存

#### 3.8.3 工作区设置
- 工作目录配置
- 会话目录管理

#### 3.8.4 模型设置
- 默认模型提供商
- 模型参数配置
- API 端点设置

#### 3.8.5 MCP 设置
- MCP 服务器列表
- 配置文件路径

#### 3.8.6 Skills 设置
- 技能目录配置
- 技能列表管理

#### 3.8.7 数据设置
- 数据导出
- 数据清理
- 缓存管理

#### 3.8.8 关于
- 版本信息
- 许可证信息
- 更新检查

### 3.9 初始化设置（Setup）

#### 3.9.1 依赖检查
- **Claude Code**: 必需依赖
- **Codex CLI**: 可选依赖（用于沙箱执行）
- 自动检测已安装的依赖

#### 3.9.2 依赖安装
- **自动安装**: 通过 API 自动安装
- **手动安装**: 提供安装命令和链接
- **安装状态**: 实时显示安装进度

#### 3.9.3 首次运行引导
- 检查必需依赖
- 引导用户完成配置
- 跳过选项（可稍后配置）

---

## 4. 用户界面设计

### 4.1 页面结构

#### 4.1.1 首页（Home）
- **布局**: 居中输入框，简洁设计
- **功能**: 任务输入，支持附件
- **交互**: 输入后跳转到任务详情页

#### 4.1.2 任务详情页（TaskDetail）
- **布局**: 三栏布局
  - **左栏**: 聊天消息区域
  - **中栏**: 工件预览区域（可选）
  - **右栏**: 侧边栏（工件列表、工作区文件、工具列表）
- **功能**:
  - 显示任务执行过程
  - 实时消息流
  - 工具执行详情
  - 工件预览
  - 继续对话

#### 4.1.3 任务库（Library）
- **布局**: 列表视图
- **功能**:
  - 任务列表
  - 搜索功能
  - 收藏管理
  - 批量选择（未来功能）

#### 4.1.4 设置页（Settings）
- **布局**: 侧边栏导航 + 内容区域
- **功能**: 所有设置选项

### 4.2 组件设计

#### 4.2.1 消息组件
- **用户消息**: 右对齐，显示附件
- **Agent 消息**: 左对齐，Markdown 渲染
- **工具消息**: 可折叠的任务组
- **计划消息**: 计划审批组件

#### 4.2.2 工具执行组件
- **工具名称**: 显示工具类型
- **输入参数**: 可展开查看
- **执行结果**: 显示输出内容
- **状态指示**: 执行中/完成/失败

#### 4.2.3 工件预览组件
- **代码预览**: 语法高亮
- **文档预览**: 内嵌预览器
- **图片预览**: 图片查看器
- **实时预览**: Vite 预览窗口

### 4.3 交互设计

#### 4.3.1 实时反馈
- 执行状态指示器
- 流式消息更新
- 工具执行进度

#### 4.3.2 错误处理
- 友好的错误提示
- API Key 错误自动引导到设置
- 网络错误重试机制

#### 4.3.3 响应式设计
- 支持窗口大小调整
- 侧边栏可折叠
- 移动端适配（未来）

---

## 5. 数据模型

### 5.1 数据库设计

#### 5.1.1 Sessions 表
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  task_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### 5.1.2 Tasks 表
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  task_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL, -- 'running' | 'completed' | 'error' | 'stopped'
  cost REAL,
  duration INTEGER,
  favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

#### 5.1.3 Messages 表
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'text' | 'tool_use' | 'tool_result' | 'result' | 'error' | 'user' | 'plan'
  content TEXT,
  tool_name TEXT,
  tool_input TEXT,
  tool_output TEXT,
  tool_use_id TEXT,
  subtype TEXT,
  error_message TEXT,
  attachments TEXT, -- JSON string
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

#### 5.1.4 Files 表
```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' | 'text' | 'code' | 'document' | 'website' | 'presentation' | 'spreadsheet'
  path TEXT NOT NULL,
  preview TEXT,
  thumbnail TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

#### 5.1.5 Settings 表
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 5.2 文件系统结构

```
{AppDataDir}/
├── sessions/
│   └── {sessionId}/
│       ├── task-1/
│       ├── task-2/
│       └── attachments/
│           ├── image-1.png
│           └── file-1.pdf
├── database.sqlite
└── config/
    └── mcp.json
```

---

## 6. API 设计

### 6.1 后端 API 端点

#### 6.1.1 Agent 相关
- `POST /agent` - 直接执行任务（带图片时）
- `POST /agent/plan` - 生成执行计划
- `POST /agent/execute` - 执行已批准的计划
- `POST /agent/stop/:sessionId` - 停止执行
- `POST /agent/permission` - 响应权限请求

#### 6.1.2 健康检查
- `GET /health` - 服务健康状态
- `GET /health/dependencies` - 检查依赖
- `GET /health/dependencies/:id/install-commands` - 获取安装命令
- `POST /health/dependencies/:id/install` - 安装依赖

#### 6.1.3 预览相关
- `POST /preview/start` - 启动预览服务器
- `POST /preview/stop` - 停止预览服务器
- `GET /preview/status` - 预览状态

#### 6.1.4 沙箱相关
- `POST /sandbox/execute` - 执行沙箱命令
- `GET /sandbox/status` - 沙箱状态

#### 6.1.5 文件相关
- `GET /files/list` - 列出文件
- `GET /files/read` - 读取文件
- `POST /files/write` - 写入文件

#### 6.1.6 MCP 相关
- `GET /mcp/servers` - 获取 MCP 服务器列表
- `GET /mcp/tools` - 获取可用工具

#### 6.1.7 提供商相关
- `GET /providers` - 获取提供商列表
- `POST /providers/validate` - 验证提供商配置

### 6.2 消息格式

#### 6.2.1 SSE 流式消息
所有 Agent 执行通过 Server-Sent Events (SSE) 流式返回：

```typescript
// 消息类型
type AgentMessage = 
  | { type: 'session', sessionId: string }
  | { type: 'text', content: string }
  | { type: 'tool_use', name: string, input: object, id: string }
  | { type: 'tool_result', toolUseId: string, output: string }
  | { type: 'plan', plan: TaskPlan }
  | { type: 'direct_answer', content: string }
  | { type: 'permission_request', permission: PermissionRequest }
  | { type: 'error', message: string }
  | { type: 'done' }
```

#### 6.2.2 请求格式
```typescript
// 执行任务请求
{
  prompt: string;
  workDir?: string;
  taskId: string;
  modelConfig?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  sandboxConfig?: {
    enabled: boolean;
    provider?: string;
  };
  images?: Array<{ data: string; mimeType: string }>;
  conversation?: ConversationMessage[];
  skillsPath?: string;
}
```

---

## 7. 安全与隐私

### 7.1 数据安全
- **本地存储**: 所有数据存储在本地，不上传到服务器
- **API Key 加密**: API Key 存储在本地数据库，不传输
- **文件隔离**: 不同会话的文件完全隔离

### 7.2 沙箱安全
- **代码隔离**: 所有代码在沙箱中执行
- **资源限制**: CPU、内存、网络限制
- **权限控制**: 需要用户批准的危险操作

### 7.3 隐私保护
- **无数据收集**: 不收集用户数据
- **本地处理**: 所有 AI 请求由用户配置的 API 处理
- **可配置**: 用户可选择使用自己的 API Key

---

## 8. 性能要求

### 8.1 响应时间
- **任务创建**: < 100ms
- **消息流式输出**: 实时（延迟 < 1s）
- **文件预览**: < 500ms
- **页面切换**: < 200ms

### 8.2 资源占用
- **内存**: < 500MB（空闲时）
- **CPU**: 低占用（空闲时）
- **磁盘**: 根据会话和文件数量

### 8.3 并发处理
- **多任务执行**: 支持后台任务
- **任务切换**: 无缝切换，不中断执行

---

## 9. 错误处理

### 9.1 错误类型
- **网络错误**: 连接失败、超时
- **API 错误**: API Key 无效、配额不足
- **执行错误**: 工具执行失败、代码错误
- **系统错误**: 文件系统错误、数据库错误

### 9.2 错误处理策略
- **重试机制**: 网络错误自动重试（最多 3 次）
- **友好提示**: 用户友好的错误消息
- **错误恢复**: 保存错误状态，支持恢复
- **日志记录**: 详细错误日志用于调试

---

## 10. 国际化

### 10.1 支持语言
- **中文（简体）**: 默认语言
- **英文**: 完整支持

### 10.2 国际化范围
- 所有用户界面文本
- 错误消息
- 设置选项
- 帮助文档

---

## 11. 未来规划

### 11.1 短期（3-6 个月）
- [ ] 任务模板系统
- [ ] 批量任务执行
- [ ] 任务导出/导入
- [ ] 更多预览格式支持
- [ ] 性能优化

### 11.2 中期（6-12 个月）
- [ ] 插件系统
- [ ] 任务协作
- [ ] 云端同步（可选）
- [ ] 移动端应用
- [ ] 更多 AI 模型支持

### 11.3 长期（12+ 个月）
- [ ] 企业版功能
- [ ] 团队协作
- [ ] 任务市场
- [ ] 自定义 UI 主题
- [ ] 语音交互

---

## 12. 技术债务与已知问题

### 12.1 技术债务
- 消息历史管理需要优化（大量消息时的性能）
- 文件预览需要更好的错误处理
- 沙箱执行需要更完善的资源监控

### 12.2 已知限制
- 大文件预览可能较慢
- 长时间运行的任务可能占用较多资源
- 某些文件格式预览需要外部依赖

---

## 13. 附录

### 13.1 术语表
- **Agent**: AI 代理，执行任务的 AI 系统
- **Session**: 会话，包含多个相关任务的上下文
- **Task**: 任务，用户提交的单个执行单元
- **Artifact**: 工件，任务执行产生的文件
- **MCP**: Model Context Protocol，模型上下文协议
- **Sandbox**: 沙箱，隔离的执行环境
- **Skill**: 技能，自定义的 Agent 能力

### 13.2 参考文档
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code](https://github.com/anthropics/claude-code)
- [Codex CLI](https://github.com/openai/codex)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Tauri Documentation](https://tauri.app/)

---

**文档维护**: 本文档应随产品迭代持续更新  
**最后更新**: 2026-01-24
