import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { APIConfig } from "../lib/api";

export interface Connector {
  id: string;
  name: string;
  description: string;
  iconColor: string;
  connected: boolean;
  config?: Record<string, unknown>;
}

interface SettingsStore {
  // API Configuration
  apiConfig: APIConfig | null;
  setApiConfig: (config: APIConfig) => void;
  clearApiConfig: () => void;
  
  // Connectors
  connectors: Connector[];
  connectConnector: (id: string) => void;
  disconnectConnector: (id: string) => void;
  updateConnectorConfig: (id: string, config: Record<string, unknown>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // API Config
      apiConfig: null,
      
      setApiConfig: (config) => set({ apiConfig: config }),
      
      clearApiConfig: () => set({ apiConfig: null }),

      // Connectors
      connectors: [
        {
          id: "chrome",
          name: "Chrome Extension",
          description: "Browse and interact with web pages",
          iconColor: "#4285F4",
          connected: false,
        },
        {
          id: "sheets",
          name: "Google Sheets",
          description: "Read and write spreadsheet data",
          iconColor: "#00A67E",
          connected: false,
        },
        {
          id: "slack",
          name: "Slack",
          description: "Send messages and notifications",
          iconColor: "#7B68EE",
          connected: false,
        },
        {
          id: "github",
          name: "GitHub",
          description: "Access repositories and issues",
          iconColor: "#24292E",
          connected: false,
        },
      ],

      connectConnector: (id) =>
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id ? { ...c, connected: true } : c
          ),
        })),

      disconnectConnector: (id) =>
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id ? { ...c, connected: false, config: undefined } : c
          ),
        })),

      updateConnectorConfig: (id, config) =>
        set((state) => ({
          connectors: state.connectors.map((c) =>
            c.id === id ? { ...c, config } : c
          ),
        })),
    }),
    {
      name: "workease-settings",
    }
  )
);
