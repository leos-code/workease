import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import {
  FileSearch,
  TrendingUp,
  Image,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: "done" | "running" | "pending";
  progress: number;
  color: string;
  icon: React.ReactNode;
  currentTask?: string;
  filesProcessed?: string;
}

interface FileActivity {
  id: string;
  name: string;
  status: "created" | "modified" | "creating";
  time: string;
  icon: React.ReactNode;
  iconColor: string;
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Data Reader",
    status: "done",
    progress: 100,
    color: "#3B82F6",
    icon: <FileSearch size={14} />,
    filesProcessed: "revenue_q3.xlsx, expenses_q3.csv, +10 more files",
  },
  {
    id: "2",
    name: "Analyst",
    status: "running",
    progress: 60,
    color: "#FF5C00",
    icon: <TrendingUp size={14} />,
    currentTask: "Calculating YoY growth rates and identifying key trends...",
  },
  {
    id: "3",
    name: "Visualizer",
    status: "running",
    progress: 35,
    color: "#8B5CF6",
    icon: <Image size={14} />,
    currentTask: "Generating revenue chart with quarterly comparison...",
  },
];

const mockFileActivity: FileActivity[] = [
  {
    id: "1",
    name: "Q3_Report.xlsx",
    status: "created",
    time: "Just now",
    icon: <FileSpreadsheet size={16} />,
    iconColor: "var(--success)",
  },
  {
    id: "2",
    name: "revenue_analysis.md",
    status: "modified",
    time: "2 min ago",
    icon: <FileText size={16} />,
    iconColor: "var(--info)",
  },
  {
    id: "3",
    name: "revenue_chart.png",
    status: "creating",
    time: "",
    icon: <Image size={16} />,
    iconColor: "#8B5CF6",
  },
];

function AgentCard({ agent }: { agent: Agent }) {
  const statusColors = {
    done: "var(--success)",
    running: "var(--accent-primary)",
    pending: "var(--text-disabled)",
  };

  const statusLabels = {
    done: "Done",
    running: "Running",
    pending: "Pending",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-elevated)]",
        agent.status === "running"
          ? "border border-[var(--accent-primary)]"
          : "border border-[var(--border-subtle)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white"
            style={{
              background: `linear-gradient(135deg, ${agent.color}, ${agent.color}99)`,
            }}
          >
            {agent.icon}
          </div>
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            {agent.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: statusColors[agent.status] }}
          />
          <span
            className="text-[11px]"
            style={{ color: statusColors[agent.status] }}
          >
            {statusLabels[agent.status]}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full bg-[var(--bg-interactive)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${agent.progress}%`,
            backgroundColor:
              agent.status === "done" ? "var(--success)" : agent.color,
          }}
        />
      </div>

      {/* Task info */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[var(--text-disabled)]">
          {agent.status === "done" ? "Files processed:" : "Current task:"}
        </span>
        <span
          className={cn(
            "text-[11px] font-mono leading-relaxed",
            agent.status === "done"
              ? "text-[var(--text-tertiary)]"
              : "text-[var(--accent-light)]"
          )}
          style={{
            color: agent.status === "running" ? `${agent.color}CC` : undefined,
          }}
        >
          {agent.status === "done" ? agent.filesProcessed : agent.currentTask}
        </span>
      </div>
    </div>
  );
}

function FileActivityItem({ file }: { file: FileActivity }) {
  const statusText = {
    created: "Created",
    modified: "Modified",
    creating: "Creating...",
  };

  return (
    <div className="flex items-center gap-2.5 p-2.5 px-3 rounded-lg bg-[var(--bg-elevated)]">
      <span style={{ color: file.iconColor }}>{file.icon}</span>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-xs font-medium text-[var(--text-primary)] truncate">
          {file.name}
        </span>
        <span
          className={cn(
            "text-[10px]",
            file.status === "created"
              ? "text-[var(--success)]"
              : file.status === "creating"
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-tertiary)]"
          )}
        >
          {statusText[file.status]}
          {file.time && ` · ${file.time}`}
        </span>
      </div>
    </div>
  );
}

export function TaskPanel() {
  return (
    <aside className="w-[360px] h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col">
      <div className="flex flex-col gap-6 p-6 overflow-y-auto scrollbar-thin">
        {/* Sub-Agents section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Sub-Agents
            </h3>
            <Badge variant="success">3 Active</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {mockAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* File Activity section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              File Activity
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">24 files</span>
          </div>
          <div className="flex flex-col gap-2">
            {mockFileActivity.map((file) => (
              <FileActivityItem key={file.id} file={file} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
