/**
 * Tool Execution Display Component
 * Shows tool use and results in real-time
 */

import { ChevronDown, ChevronRight, Terminal, File, Search, Edit } from "lucide-react";
import { useState } from "react";
import { formatToolInput, formatToolOutput } from "../../lib/backend-api";

interface ToolExecutionDisplayProps {
  name: string;
  input: unknown;
  result?: string;
  status: "running" | "complete" | "error";
}

export function ToolExecutionDisplay({
  name,
  input,
  result,
  status,
}: ToolExecutionDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get icon for tool type
  const getToolIcon = () => {
    switch (name.toLowerCase()) {
      case "read":
        return <File size={16} />;
      case "write":
      case "edit":
        return <Edit size={16} />;
      case "bash":
        return <Terminal size={16} />;
      case "grep":
      case "glob":
        return <Search size={16} />;
      default:
        return <Terminal size={16} />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case "running":
        return "text-[var(--warning)]";
      case "complete":
        return "text-[var(--success)]";
      case "error":
        return "text-[var(--error)]";
    }
  };

  // Get status dot
  const getStatusDot = () => {
    switch (status) {
      case "running":
        return "●";
      case "complete":
        return "✓";
      case "error":
        return "✕";
    }
  };

  return (
    <div className="bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span className="text-[var(--text-tertiary)]">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className={getStatusColor()}>{getStatusDot()}</span>
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          {getToolIcon()}
        </span>
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
          {name}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] capitalize">
          {status}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border-subtle)]">
          {/* Input */}
          <div className="px-3 py-2">
            <p className="text-xs text-[var(--text-tertiary)] mb-1.5">Input</p>
            <pre className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {formatToolInput(input)}
            </pre>
          </div>

          {/* Output (if available) */}
          {result && (
            <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-tertiary)] mb-1.5">Output</p>
              <pre
                className={`text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap ${
                  status === "error"
                    ? "text-[var(--error)] bg-[#EF444418]"
                    : "text-[var(--text-secondary)] bg-[var(--bg-secondary)]"
                }`}
              >
                {formatToolOutput(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ToolExecutionListProps {
  tools: Array<{
    id: string;
    name: string;
    input: unknown;
    result?: string;
    status: "running" | "complete" | "error";
  }>;
}

export function ToolExecutionList({ tools }: ToolExecutionListProps) {
  if (tools.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-medium mb-2">
        Tool Execution
      </p>
      {tools.map((tool) => (
        <ToolExecutionDisplay
          key={tool.id}
          name={tool.name}
          input={tool.input}
          result={tool.result}
          status={tool.status}
        />
      ))}
    </div>
  );
}
