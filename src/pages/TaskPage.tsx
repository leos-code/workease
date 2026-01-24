import { useState } from "react";
import { MainLayout } from "../components/layout";
import { MessageBubble, InputBox } from "../components/chat";
import { Button } from "../components/ui";
import { Pause, Square } from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending";
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  tasks?: TaskItem[];
}

// Mock data
const mockMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content:
      "Please analyze the Q3 financial data in ~/Documents/Finance and create a comprehensive report with charts. Also check the competitor analysis in ~/Documents/Research and incorporate relevant insights.",
  },
  {
    id: "2",
    type: "assistant",
    content:
      "I'll analyze the Q3 financial data and create a comprehensive report. I'm breaking this down into parallel tasks:",
    tasks: [
      {
        id: "t1",
        title: "Reading financial data files",
        description: "Completed · Found 12 files",
        status: "completed",
      },
      {
        id: "t2",
        title: "Analyzing revenue trends",
        description: "In progress · Processing Q3 data...",
        status: "in_progress",
      },
      {
        id: "t3",
        title: "Creating visualizations",
        description: "In progress · Generating charts...",
        status: "in_progress",
      },
      {
        id: "t4",
        title: "Incorporating competitor insights",
        description: "Pending · Waiting for data analysis",
        status: "pending",
      },
    ],
  },
];

export function TaskPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isPaused, setIsPaused] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <MainLayout showTaskPanel>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              Quarterly Report Analysis
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Started 10 minutes ago · 3 sub-agents active
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Pause}
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button variant="destructive" icon={Square}>
              Stop
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-6 px-10 py-8">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                type={message.type}
                content={message.content}
                tasks={message.tasks}
              />
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="px-10 py-6 border-t border-[var(--border-subtle)]">
          <InputBox onSend={handleSendMessage} disabled={isPaused} />
        </div>
      </div>
    </MainLayout>
  );
}
