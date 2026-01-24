import { useState } from "react";
import { MainLayout } from "../components/layout";
import { FolderCard, AddFolderCard } from "../components/files";
import { Button } from "../components/ui";
import { FolderPlus, ShieldCheck, ExternalLink } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  lastAccessed: string;
  permissions: ("Read" | "Write")[];
  enabled: boolean;
}

const initialFolders: Folder[] = [
  {
    id: "1",
    name: "Documents",
    path: "~/Documents",
    fileCount: 1247,
    lastAccessed: "2 min ago",
    permissions: ["Read", "Write"],
    enabled: true,
  },
  {
    id: "2",
    name: "Finance",
    path: "~/Documents/Finance",
    fileCount: 342,
    lastAccessed: "10 min ago",
    permissions: ["Read", "Write"],
    enabled: true,
  },
  {
    id: "3",
    name: "Research",
    path: "~/Documents/Research",
    fileCount: 89,
    lastAccessed: "1 hour ago",
    permissions: ["Read"],
    enabled: false,
  },
];

export function FilesPage() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);

  const handleToggleFolder = (id: string, enabled: boolean) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === id ? { ...folder, enabled } : folder
      )
    );
  };

  const handleAddFolder = () => {
    // TODO: Implement folder picker using Tauri dialog
    console.log("Add folder");
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              File Access
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Manage folders that WorkEase can access on your computer
            </p>
          </div>
          <Button variant="primary" icon={FolderPlus} onClick={handleAddFolder}>
            Add Folder
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-10 pb-8">
          <div className="flex flex-col gap-7">
            {/* Folder grid */}
            <div className="grid grid-cols-2 gap-4">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  name={folder.name}
                  path={folder.path}
                  fileCount={folder.fileCount}
                  lastAccessed={folder.lastAccessed}
                  permissions={folder.permissions}
                  enabled={folder.enabled}
                  onToggle={(enabled) => handleToggleFolder(folder.id, enabled)}
                />
              ))}
              <AddFolderCard onClick={handleAddFolder} />
            </div>

            {/* Security banner */}
            <div className="flex items-center gap-3 p-4 px-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-[var(--info-tint)] flex items-center justify-center">
                <ShieldCheck size={18} className="text-[var(--info)]" />
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-[var(--text-primary)]">
                  Your files stay on your computer
                </span>
                <span className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                  WorkEase only reads files in folders you explicitly grant access to.
                  Files are processed locally and never uploaded.
                </span>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline">
                Learn more
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
