import { cn } from "../../lib/utils";
import { Toggle, Badge } from "../ui";
import { Folder, Plus } from "lucide-react";

interface FolderCardProps {
  name: string;
  path: string;
  fileCount: number;
  lastAccessed: string;
  permissions: ("Read" | "Write")[];
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FolderCard({
  name,
  path,
  fileCount,
  lastAccessed,
  permissions,
  enabled,
  onToggle,
}: FolderCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
        !enabled && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-[10px] flex items-center justify-center",
              enabled
                ? "bg-[var(--accent-tint)]"
                : "bg-[var(--bg-elevated)]"
            )}
          >
            <Folder
              size={20}
              className={
                enabled
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-disabled)]"
              }
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                "text-sm font-semibold",
                enabled
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {name}
            </span>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {path}
            </span>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[var(--text-disabled)]">Files</span>
          <span
            className={cn(
              "text-sm font-mono font-medium",
              enabled
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            {fileCount.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-[var(--text-disabled)]">
            {enabled ? "Last accessed" : "Status"}
          </span>
          <span className="text-[13px] text-[var(--text-secondary)]">
            {enabled ? lastAccessed : "Disabled"}
          </span>
        </div>
      </div>

      {/* Permissions */}
      <div className="flex gap-2">
        {enabled ? (
          permissions.map((perm) => (
            <Badge key={perm} variant="success" size="sm">
              {perm}
            </Badge>
          ))
        ) : (
          <Badge variant="default" size="sm">
            Read Only
          </Badge>
        )}
      </div>
    </div>
  );
}

export function AddFolderCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 h-[180px] rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--text-disabled)] transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
        <Plus size={24} className="text-[var(--text-disabled)]" />
      </div>
      <span className="text-sm font-medium text-[var(--text-tertiary)]">
        Add New Folder
      </span>
    </button>
  );
}
