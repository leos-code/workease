import { useState } from "react";
import { MainLayout } from "../components/layout";
import { ConnectorCard } from "../components/connectors";
import { Globe, FileSpreadsheet, Hash, Github } from "lucide-react";

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: typeof Globe;
  iconColor: string;
  connected: boolean;
}

const initialConnectors: Connector[] = [
  {
    id: "chrome",
    name: "Chrome Extension",
    description: "Browse and interact with web pages",
    icon: Globe,
    iconColor: "#4285F4",
    connected: true,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description: "Read and write spreadsheet data",
    icon: FileSpreadsheet,
    iconColor: "#00A67E",
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and notifications",
    icon: Hash,
    iconColor: "#7B68EE",
    connected: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Access repositories and issues",
    icon: Github,
    iconColor: "#24292E",
    connected: false,
  },
];

export function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);

  const handleConnect = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: true } : c))
    );
  };

  const handleDisconnect = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, connected: false } : c))
    );
  };

  const handleConfigure = (id: string) => {
    console.log("Configure", id);
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              Connectors
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Connect external services to extend WorkEase capabilities
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-10 pb-8">
          <div className="grid grid-cols-2 gap-4">
            {connectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                name={connector.name}
                description={connector.description}
                icon={connector.icon}
                iconColor={connector.iconColor}
                connected={connector.connected}
                onConnect={() => handleConnect(connector.id)}
                onDisconnect={() => handleDisconnect(connector.id)}
                onConfigure={
                  connector.connected
                    ? () => handleConfigure(connector.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
