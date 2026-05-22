/**
 * Task Page - Backend Integration
 * Connects to WorkEase backend agent execution system
 *
 * Features:
 * - Two-phase agent execution (plan + execute)
 * - Real-time SSE streaming
 * - Plan visualization
 * - Tool execution display
 * - Error handling
 */

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { MessageBubble, InputBox } from "../components/chat";
import { PlanDisplay, ToolExecutionList } from "../components/agent";
import { Button } from "../components/ui";
import { Pause, Square, AlertCircle, Settings, Loader } from "lucide-react";
import { useSettingsStore } from "../stores";
import {
  executeAgent,
  stopAgent,
  generateTaskId,
  healthCheck,
  type AgentCallbacks,
} from "../lib/backend-api";
import type { TaskPlan } from "../types";

interface Message {
  id: string;
  type: "user" | "assistant" | "system" | "plan";
  content: string;
  isStreaming?: boolean;
  plan?: TaskPlan;
}

interface ToolExecution {
  id: string;
  name: string;
  input: unknown;
  result?: string;
  status: "running" | "complete" | "error";
}

export function TaskPageBackend() {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiConfig } = useSettingsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [tools, setTools] = useState<ToolExecution[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("New Task");
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortExecutionRef = useRef<(() => void) | null>(null);
  const currentTaskIdRef = useRef<string | null>(null);

  // Get initial task from navigation state
  const initialTask = location.state?.task as string | undefined;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tools]);

  // Check backend health on mount
  useEffect(() => {
    healthCheck().then(setBackendHealthy);
  }, []);

  // Start task when component mounts with initial task
  useEffect(() => {
    if (initialTask && messages.length === 0 && backendHealthy === true) {
      handleSendMessage(initialTask);
    }
  }, [initialTask, backendHealthy]);

  const handleSendMessage = async (content: string) => {
    // Check backend health
    const healthy = await healthCheck();
    if (!healthy) {
      setError(
        "Backend server is not running. Please start the backend with 'npm run dev'."
      );
      return;
    }

    setError(null);
    const taskId = generateTaskId();
    currentTaskIdRef.current = taskId;

    // Reset execution state
    setPlan(null);
    setTools([]);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setTaskTitle(content.slice(0, 50) + (content.length > 50 ? "..." : ""));
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Build callbacks
    const callbacks: AgentCallbacks = {
      onSession: (sessionId) => {
        console.log("[TaskPage] Session started:", sessionId);
      },

      onText: (content) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: m.content + content }
              : m
          )
        );
      },

      onToolUse: (name, input, id) => {
        // Add new tool execution
        const newTool: ToolExecution = {
          id,
          name,
          input,
          status: "running",
        };
        setTools((prev) => [...prev, newTool]);
      },

      onToolResult: (toolUseId, output) => {
        // Update tool execution with result
        setTools((prev) =>
          prev.map((t) =>
            t.id === toolUseId
              ? { ...t, result: output, status: "complete" }
              : t
          )
        );
      },

      onPlan: (plan) => {
        setPlan(plan);

        // Add plan message
        const planMessage: Message = {
          id: Date.now().toString(),
          type: "plan",
          content: "",
          plan,
        };

        setMessages((prev) => [...prev, planMessage]);
      },

      onError: (message) => {
        setError(message);
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `Error: ${message}`,
                  isStreaming: false,
                }
              : m
          )
        );
      },

      onDone: () => {
        setIsLoading(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
      },
    };

    // Start execution
    abortExecutionRef.current = executeAgent(
      {
        prompt: content,
        task_id: taskId,
      },
      callbacks
    );
  };

  const handleStop = async () => {
    // Abort SSE connection
    abortExecutionRef.current?.();

    // If we have a task ID, try to stop it on the backend
    if (currentTaskIdRef.current) {
      try {
        await stopAgent(currentTaskIdRef.current);
      } catch (err) {
        console.error("[TaskPage] Failed to stop agent:", err);
      }
    }

    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      )
    );

    // Mark all running tools as error
    setTools((prev) =>
      prev.map((t) =>
        t.status === "running" ? { ...t, status: "error" } : t
      )
    );
  };

  // Show API key prompt if not configured
  if (!apiConfig) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
              <AlertCircle size={32} className="text-[var(--warning)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              API Key Required
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              To use WorkEase, you need to configure your API key. We support
              Anthropic, OpenAI, and OpenRouter.
            </p>
            <Button
              variant="primary"
              icon={Settings}
              onClick={() => navigate("/settings")}
            >
              Go to Settings
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show backend health warning
  if (backendHealthy === false && !isLoading) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
              <AlertCircle size={32} className="text-[var(--warning)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Backend Server Not Running
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              The WorkEase backend server is not running. Please start it with:
            </p>
            <pre className="text-xs bg-[var(--bg-elevated)] p-3 rounded-md text-[var(--text-secondary)]">
              npm run dev
            </pre>
            <Button
              variant="outline"
              icon={Loader}
              onClick={() => healthCheck().then(setBackendHealthy)}
            >
              Retry
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showTaskPanel={messages.length > 0 || plan !== null}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              {taskTitle}
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              {isLoading ? "Processing..." : `${messages.length} messages`}
              {plan && ` • Plan with ${plan.steps?.length || 0} steps`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <Button
                variant="outline"
                icon={Pause}
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button
              variant="destructive"
              icon={Square}
              onClick={handleStop}
              disabled={!isLoading}
            >
              Stop
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-10 mt-4 p-4 bg-[#EF444418] border border-[var(--error)] rounded-lg flex items-center gap-3">
            <AlertCircle size={18} className="text-[var(--error)]" />
            <span className="text-sm text-[var(--error)]">{error}</span>
            <button
              className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-6 px-10 py-8">
            {/* Plan Display */}
            {plan && <PlanDisplay plan={plan} isComplete={!isLoading} />}

            {/* Tool Executions */}
            {tools.length > 0 && <ToolExecutionList tools={tools} />}

            {/* Messages */}
            {messages.map((message) => {
              // Render plan messages separately
              if (message.type === "plan" && message.plan) {
                return <PlanDisplay key={message.id} plan={message.plan} />;
              }

              return (
                <MessageBubble
                  key={message.id}
                  type={message.type}
                  content={message.content || (message.isStreaming ? "Thinking..." : "")}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="px-10 py-6 border-t border-[var(--border-subtle)]">
          <InputBox
            onSend={handleSendMessage}
            disabled={isLoading || isPaused}
          />
        </div>
      </div>
    </MainLayout>
  );
}
