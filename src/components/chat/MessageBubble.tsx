import { cn } from "../../lib/utils";
import { Sparkles, Check, Loader } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
}

interface MessageProps {
  type: "user" | "assistant";
  content: string;
  tasks?: TaskItem[];
  timestamp?: string;
}

function TaskListItem({ task }: { task: TaskItem }) {
  const statusStyles = {
    completed: {
      bg: "bg-[var(--success-tint)]",
      icon: <Check size={12} className="text-[var(--success)]" />,
      textColor: "text-[var(--success)]",
    },
    in_progress: {
      bg: "bg-[var(--accent-tint)]",
      icon: <Loader size={12} className="text-[var(--accent-primary)] animate-spin" />,
      textColor: "text-[var(--accent-primary)]",
    },
    pending: {
      bg: "bg-[var(--bg-elevated)]",
      icon: null,
      textColor: "text-[var(--text-disabled)]",
    },
  };

  const style = statusStyles[task.status];

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center",
          style.bg,
          task.status === "pending" && "border border-[var(--border-default)]"
        )}
      >
        {style.icon}
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <span
          className={cn(
            "text-[13px] font-medium",
            task.status === "pending"
              ? "text-[var(--text-secondary)]"
              : "text-[var(--text-primary)]"
          )}
        >
          {task.title}
        </span>
        <span className={cn("text-xs", style.textColor)}>
          {task.description}
        </span>
      </div>
    </div>
  );
}

export function MessageBubble({ type, content, tasks }: MessageProps) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      {type === "user" ? (
        <div className="w-8 h-8 rounded-full bg-[var(--bg-interactive)] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">B</span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
          {content}
        </p>

        {/* Task list for assistant messages */}
        {tasks && tasks.length > 0 && (
          <div className="flex flex-col gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
            {tasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
