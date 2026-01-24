import { useState } from "react";
import { MessageSquare, ArrowUp } from "lucide-react";

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBox({
  onSend,
  disabled,
  placeholder = "Send a message to guide the task...",
}: InputBoxProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-3">
      {/* Input container */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
        <MessageSquare size={18} className="text-[var(--text-disabled)] flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none"
        />
        <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded">
          <span className="text-[11px] font-mono text-[var(--text-disabled)]">
            ⌘ Enter
          </span>
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-12 h-12 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        <ArrowUp size={20} className="text-white" />
      </button>
    </div>
  );
}
