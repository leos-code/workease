import { create } from "zustand";

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  tasks?: TaskItem[];
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  status: "done" | "running" | "pending";
  progress: number;
  color: string;
  currentTask?: string;
  filesProcessed?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "running" | "paused" | "completed" | "failed";
  messages: Message[];
  agents: Agent[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskStore {
  currentTask: Task | null;
  recentTasks: Task[];
  
  // Actions
  setCurrentTask: (task: Task | null) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateAgentStatus: (agentId: string, status: Agent["status"], progress: number) => void;
  pauseTask: () => void;
  resumeTask: () => void;
  stopTask: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  currentTask: null,
  recentTasks: [],

  setCurrentTask: (task) => set({ currentTask: task }),

  addMessage: (message) =>
    set((state) => {
      if (!state.currentTask) return state;
      const newMessage: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      return {
        currentTask: {
          ...state.currentTask,
          messages: [...state.currentTask.messages, newMessage],
          updatedAt: new Date(),
        },
      };
    }),

  updateAgentStatus: (agentId, status, progress) =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          agents: state.currentTask.agents.map((agent) =>
            agent.id === agentId ? { ...agent, status, progress } : agent
          ),
          updatedAt: new Date(),
        },
      };
    }),

  pauseTask: () =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          status: "paused",
          updatedAt: new Date(),
        },
      };
    }),

  resumeTask: () =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          status: "running",
          updatedAt: new Date(),
        },
      };
    }),

  stopTask: () =>
    set((state) => {
      if (!state.currentTask) return state;
      return {
        currentTask: {
          ...state.currentTask,
          status: "completed",
          updatedAt: new Date(),
        },
        recentTasks: [state.currentTask, ...state.recentTasks].slice(0, 10),
      };
    }),
}));
