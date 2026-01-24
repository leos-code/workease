import { cn } from "../../lib/utils";
import { Button, Badge } from "../ui";
import { Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ConnectorCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onConfigure?: () => void;
}

export function ConnectorCard({
  name,
  description,
  icon: Icon,
  iconColor,
  connected,
  onConnect,
  onDisconnect,
  onConfigure,
}: ConnectorCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-5 rounded-xl bg-[var(--bg-surface)]",
        connected
          ? "border border-[var(--success)]"
          : "border border-[var(--border-subtle)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[10px] flex items-center justify-center"
            style={{ backgroundColor: iconColor }}
          >
            <Icon size={24} className="text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {name}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {description}
            </span>
          </div>
        </div>
        {connected ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span className="text-[11px] text-[var(--success)]">Connected</span>
          </div>
        ) : (
          <Badge variant="default">Not connected</Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {connected ? (
          <>
            {onConfigure && (
              <button
                onClick={onConfigure}
                className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-default)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Settings size={14} className="text-[var(--text-tertiary)]" />
                <span className="text-xs">Configure</span>
              </button>
            )}
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-3 py-2 border border-[var(--error)] rounded-md text-[var(--error)] hover:bg-[var(--error)] hover:text-white transition-colors"
            >
              <span className="text-xs">Disconnect</span>
            </button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={onConnect}>
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
