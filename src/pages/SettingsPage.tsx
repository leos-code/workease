import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout";
import { Button, Badge } from "../components/ui";
import { useSettingsStore } from "../stores";
import type { APIConfig } from "../lib/api";
import {
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Globe,
  Server,
} from "lucide-react";

type Provider = "anthropic" | "openai" | "openrouter" | "openai-compatible";

const PROVIDERS: {
  id: Provider;
  name: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  defaultModel: string;
  models: string[];
  customEndpoint?: boolean;
}[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models - Recommended",
    icon: Sparkles,
    color: "#D97706",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models",
    icon: Zap,
    color: "#10B981",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Multiple providers, one API",
    icon: Globe,
    color: "#6366F1",
    defaultModel: "anthropic/claude-sonnet-4-20250514",
    models: [
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-pro-1.5",
      "meta-llama/llama-3.1-405b-instruct",
    ],
  },
  {
    id: "openai-compatible",
    name: "OpenAI 兼容",
    description: "自定义 Base URL、模型名、API Key",
    icon: Server,
    color: "#8B5CF6",
    defaultModel: "",
    models: [],
    customEndpoint: true,
  },
];

export function SettingsPage() {
  const { apiConfig, setApiConfig, clearApiConfig } = useSettingsStore();
  
  const [selectedProvider, setSelectedProvider] = useState<Provider>(
    (apiConfig?.provider as Provider) || "anthropic"
  );
  const [apiKey, setApiKey] = useState(apiConfig?.apiKey || "");
  const [baseUrl, setBaseUrl] = useState(apiConfig?.baseUrl || "");
  const [selectedModel, setSelectedModel] = useState(
    apiConfig?.model ?? PROVIDERS[0].defaultModel
  );
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProvider)!;
  const isOpenAICompatible = selectedProvider === "openai-compatible";

  // Update model when provider changes (skip for custom endpoint)
  useEffect(() => {
    const provider = PROVIDERS.find((p) => p.id === selectedProvider);
    if (provider && !provider.customEndpoint) {
      setSelectedModel(provider.defaultModel);
    }
  }, [selectedProvider]);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    if (isOpenAICompatible && (!baseUrl.trim() || !selectedModel.trim())) return;

    setTestStatus("testing");
    setTestError(null);

    try {
      const config: APIConfig = {
        provider: selectedProvider,
        apiKey: apiKey.trim(),
        model: selectedModel.trim() || undefined,
        baseUrl: isOpenAICompatible ? baseUrl.trim().replace(/\/+$/, "") : undefined,
      };

      let testUrl: string;
      let headers: Record<string, string>;
      let body: string;

      if (selectedProvider === "anthropic") {
        testUrl = "https://api.anthropic.com/v1/messages";
        headers = {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        };
        body = JSON.stringify({
          model: selectedModel,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
      } else if (selectedProvider === "openai-compatible") {
        const base = (config.baseUrl || "").trim();
        testUrl = base.includes("/chat/completions") ? base : `${base}/chat/completions`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        };
        body = JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
      } else {
        testUrl = selectedProvider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        };
        if (selectedProvider === "openrouter") {
          headers["HTTP-Referer"] = "https://workease.app";
        }
        body = JSON.stringify({
          model: selectedModel,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
      }

      const response = await fetch(testUrl, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error.slice(0, 200)}`);
      }

      setTestStatus("success");
      setApiConfig(config);
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleClear = () => {
    clearApiConfig();
    setApiKey("");
    setBaseUrl("");
    setSelectedModel(PROVIDERS[0].defaultModel);
    setTestStatus("idle");
    setTestError(null);
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] text-[var(--text-primary)] tracking-tight">
              Settings
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Configure your AI provider and preferences
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-10 pb-8">
          <div className="max-w-2xl flex flex-col gap-8">
            {/* Provider Selection */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                AI Provider
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROVIDERS.map((provider) => {
                  const Icon = provider.icon;
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors ${
                        isSelected
                          ? "bg-[var(--bg-elevated)] border-[var(--accent-primary)]"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${provider.color}20` }}
                        >
                          <Icon size={16} style={{ color: provider.color }} />
                        </div>
                        {apiConfig?.provider === provider.id && (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 text-left">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {provider.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {provider.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base URL (OpenAI-compatible only) */}
            {isOpenAICompatible && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  Base URL
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1 或你的兼容端点"
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--accent-primary)]"
                />
                <p className="text-xs text-[var(--text-tertiary)]">
                  兼容 OpenAI 格式的 API 根地址，如 OpenRouter、本地 LLM 等。无需包含 /chat/completions。
                </p>
              </div>
            )}

            {/* Model */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[var(--text-primary)]">
                {isOpenAICompatible ? "模型名" : "Model"}
              </label>
              {isOpenAICompatible ? (
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="例如 gpt-4o、qwen-plus、deepseek-chat"
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--accent-primary)]"
                />
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  {currentProvider.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[var(--text-primary)]">
                API Key
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Key
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]"
                  />
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={isOpenAICompatible ? "输入 API Key" : `Enter your ${currentProvider.name} API key`}
                    className="w-full pl-11 pr-12 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--accent-primary)]"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] hover:text-[var(--text-tertiary)]"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                API Key 仅存储在本地，不会发送到我们的服务器。
              </p>
            </div>

            {/* Test Result */}
            {testStatus === "error" && testError && (
              <div className="flex items-center gap-3 p-4 bg-[#EF444418] border border-[var(--error)] rounded-lg">
                <AlertCircle size={18} className="text-[var(--error)]" />
                <span className="text-sm text-[var(--error)]">{testError}</span>
              </div>
            )}

            {testStatus === "success" && (
              <div className="flex items-center gap-3 p-4 bg-[var(--success-tint)] border border-[var(--success)] rounded-lg">
                <Check size={18} className="text-[var(--success)]" />
                <span className="text-sm text-[var(--success)]">
                  API key verified and saved!
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleTest}
                disabled={
                  !apiKey.trim() ||
                  testStatus === "testing" ||
                  (isOpenAICompatible && (!baseUrl.trim() || !selectedModel.trim()))
                }
              >
                {testStatus === "testing" ? "Testing..." : "Test & Save"}
              </Button>
              {apiConfig && (
                <Button variant="outline" onClick={handleClear}>
                  Clear Configuration
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
