/**
 * API service for AI model calls
 * Supports multiple providers: Anthropic, OpenAI, OpenRouter
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface APIConfig {
  provider: "anthropic" | "openai" | "openrouter";
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  openrouter: "anthropic/claude-sonnet-4-20250514",
};

const API_URLS = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

/**
 * Stream chat completion from AI provider
 */
export async function streamChat(
  config: APIConfig,
  messages: ChatMessage[],
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { provider, apiKey, model, baseUrl } = config;
  const selectedModel = model || DEFAULT_MODELS[provider];
  const url = baseUrl || API_URLS[provider];

  try {
    if (provider === "anthropic") {
      await streamAnthropic(url, apiKey, selectedModel, messages, systemPrompt, callbacks);
    } else {
      await streamOpenAICompatible(url, apiKey, selectedModel, messages, systemPrompt, callbacks, provider);
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

async function streamAnthropic(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            const token = parsed.delta.text;
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}

async function streamOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  callbacks: StreamCallbacks,
  provider: string
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://workease.app";
    headers["X-Title"] = "WorkEase";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider} API error: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  callbacks.onComplete(fullText);
}

/**
 * System prompt for WorkEase task assistant
 */
export const WORKEASE_SYSTEM_PROMPT = `You are WorkEase, an AI assistant that helps users accomplish complex tasks by breaking them down into manageable sub-tasks.

When a user describes a task:
1. Acknowledge the task and provide a brief overview of your approach
2. Break down the task into logical sub-tasks
3. Execute each sub-task, providing updates on progress
4. Summarize results and next steps

Format your response clearly with:
- Use markdown for formatting
- List sub-tasks with status indicators
- Provide actionable insights

Be concise but thorough. Focus on delivering value and results.`;
