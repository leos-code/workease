import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { MessageBubble, InputBox } from "../components/chat";
import { Button } from "../components/ui";
import { Pause, Square, AlertCircle, Settings } from "lucide-react";
import { useSettingsStore } from "../stores";
import { streamChat, WORKEASE_SYSTEM_PROMPT, type ChatMessage } from "../lib/api";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function TaskPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiConfig } = useSettingsStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("New Task");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get initial task from navigation state
  const initialTask = location.state?.task as string | undefined;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start task when component mounts with initial task
  useEffect(() => {
    if (initialTask && messages.length === 0) {
      handleSendMessage(initialTask);
    }
  }, [initialTask]);

  const handleSendMessage = async (content: string) => {
    if (!apiConfig) {
      setError("Please configure your API key in Settings first.");
      return;
    }

    setError(null);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setTaskTitle(content.slice(0, 50) + (content.length > 50 ? "..." : ""));
    
    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: "assistant",
      content: "",
      isStreaming: true,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);

    // Build chat history for API
    const chatHistory: ChatMessage[] = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({
        role: m.type as "user" | "assistant",
        content: m.content,
      }));
    
    chatHistory.push({ role: "user", content });

    try {
      await streamChat(apiConfig, chatHistory, WORKEASE_SYSTEM_PROMPT, {
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        onComplete: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, isStreaming: false }
                : m
            )
          );
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: "Error: " + err.message, isStreaming: false }
                : m
            )
          );
          setIsLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
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
              To use WorkEase, you need to configure your API key. We support Anthropic, OpenAI, and OpenRouter.
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

  return (
    <MainLayout showTaskPanel={messages.length > 0}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              {taskTitle}
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              {isLoading ? "Processing..." : `${messages.length} messages`}
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
            <Button variant="destructive" icon={Square} onClick={handleStop} disabled={!isLoading}>
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
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                type={message.type}
                content={message.content || (message.isStreaming ? "Thinking..." : "")}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="px-10 py-6 border-t border-[var(--border-subtle)]">
          <InputBox onSend={handleSendMessage} disabled={isLoading || isPaused} />
        </div>
      </div>
    </MainLayout>
  );
}
