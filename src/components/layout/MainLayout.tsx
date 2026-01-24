import { Sidebar } from "./Sidebar";
import { TaskPanel } from "./TaskPanel";

interface MainLayoutProps {
  children: React.ReactNode;
  showTaskPanel?: boolean;
}

export function MainLayout({ children, showTaskPanel = false }: MainLayoutProps) {
  return (
    <div className="flex h-full w-full bg-[var(--bg-page)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
      {showTaskPanel && <TaskPanel />}
    </div>
  );
}
