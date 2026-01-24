import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { Button } from "../components/ui";
import {
  Sparkles,
  Paperclip,
  FolderOpen,
  Play,
  FileText,
  Table,
  Search,
  Presentation,
} from "lucide-react";

const suggestions = [
  { icon: FileText, label: "Summarize documents" },
  { icon: Table, label: "Analyze spreadsheet" },
  { icon: Search, label: "Research topic" },
  { icon: Presentation, label: "Create presentation" },
];

export function NewTaskPage() {
  const [taskInput, setTaskInput] = useState("");
  const navigate = useNavigate();

  const handleStartTask = () => {
    if (taskInput.trim()) {
      navigate("/task/new", { state: { task: taskInput } });
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
        {/* Welcome section */}
        <div className="flex flex-col items-center gap-4 mb-12">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-light)] flex items-center justify-center">
            <Sparkles size={40} className="text-white" />
          </div>
          
          {/* Title */}
          <h1 className="font-display text-4xl text-[var(--text-primary)] tracking-tight">
            What can I help you accomplish?
          </h1>
          
          {/* Subtitle */}
          <p className="text-base text-[var(--text-tertiary)]">
            Describe a task, and I'll break it down and work through it step by step
          </p>
        </div>

        {/* Input section */}
        <div className="w-full max-w-[720px] flex flex-col gap-4">
          {/* Task input */}
          <div className="flex flex-col gap-3 p-5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl">
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g., Analyze my Q3 financial data and create a comprehensive report with visualizations..."
              className="w-full bg-transparent text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] resize-none outline-none leading-relaxed min-h-[60px]"
              rows={2}
            />
            
            {/* Actions row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Paperclip size={14} className="text-[var(--text-tertiary)]" />
                  <span className="text-xs">Attach files</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <FolderOpen size={14} className="text-[var(--text-tertiary)]" />
                  <span className="text-xs">Select folder</span>
                </button>
              </div>
              
              <Button
                variant="primary"
                icon={Play}
                onClick={handleStartTask}
                disabled={!taskInput.trim()}
              >
                Start Task
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-[var(--text-disabled)]">
              Quick suggestions
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => setTaskInput(suggestion.label)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
                >
                  <suggestion.icon size={14} className="text-[var(--accent-primary)]" />
                  <span className="text-xs">{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
