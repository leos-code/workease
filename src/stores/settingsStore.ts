import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { APIConfig } from "../lib/api";

export interface FolderPermission {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  lastAccessed: string;
  permissions: ("Read" | "Write")[];
  enabled: boolean;
}

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
  
  // Folders
  folders: FolderPermission[];
  addFolder: (folder: Omit<FolderPermission, "id">) => void;
  removeFolder: (id: string) => void;
  toggleFolder: (id: string, enabled: boolean) => void;
  updateFolderPermissions: (id: string, permissions: ("Read" | "Write")[]) => void;
  
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

      // Folders
      folders: [],

      addFolder: (folder) =>
        set((state) => ({
          folders: [
            ...state.folders,
            { ...folder, id: Date.now().toString() },
          ],
        })),

      removeFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        })),

      toggleFolder: (id, enabled) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, enabled } : f
          ),
        })),

      updateFolderPermissions: (id, permissions) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, permissions } : f
          ),
        })),

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
