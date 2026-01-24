import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  MessageSquare,
  Folder,
  GitBranch,
  Settings,
  Plus,
  FileText,
  Database,
  Presentation,
  ChevronRight,
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || 
    (to === "/" && location.pathname === "/") ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-lg transition-colors",
        isActive
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      )}
    >
      <span className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-disabled)]"}>
        {icon}
      </span>
      <span className={cn("text-sm", isActive ? "font-medium" : "font-normal")}>
        {label}
      </span>
    </NavLink>
  );
}

interface RecentTaskProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function RecentTask({ icon, label, isActive }: RecentTaskProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-md transition-colors text-left",
        isActive
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
      )}
    >
      <span className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-disabled)]"}>
        {icon}
      </span>
      <span className="text-[13px] truncate">{label}</span>
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="w-[260px] h-full bg-[var(--bg-surface)] border-l-[3px] border-[var(--accent-primary)] flex flex-col">
      {/* Sidebar content wrapper */}
      <div className="flex flex-col h-full px-5 py-6 justify-between">
        {/* Top section */}
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pb-4">
            <span className="font-mono text-lg font-semibold tracking-[4px] text-[var(--text-primary)]">
              WORKEASE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            <NavItem to="/" icon={<MessageSquare size={18} />} label="Tasks" />
            <NavItem to="/files" icon={<Folder size={18} />} label="Files" />
            <NavItem to="/connectors" icon={<GitBranch size={18} />} label="Connectors" />
            <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
          </nav>

          {/* Recent Tasks */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-3.5 py-2">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--text-disabled)] uppercase">
                Recent Tasks
              </span>
              <button className="text-[var(--text-disabled)] hover:text-[var(--text-tertiary)]">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              <RecentTask
                icon={<FileText size={16} />}
                label="Quarterly Report"
                isActive
              />
              <RecentTask
                icon={<Database size={16} />}
                label="Data Analysis"
              />
              <RecentTask
                icon={<Presentation size={16} />}
                label="Pitch Deck"
              />
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-4">
          {/* Divider */}
          <div className="h-px bg-[var(--border-default)]" />

          {/* User section */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--bg-interactive)] flex items-center justify-center">
              <span className="text-xs font-semibold text-[var(--text-tertiary)]">BL</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Blake</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">blake@example.com</p>
            </div>
            <ChevronRight size={16} className="text-[var(--text-disabled)]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
