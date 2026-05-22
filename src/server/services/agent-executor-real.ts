/**
 * Agent Executor Service (REAL AI Integration)
 * Core task execution logic with streaming responses
 *
 * This service handles:
 * - AI model communication (using existing API service)
 * - Two-phase execution (planning + execution)
 * - Tool execution orchestration
 * - Response streaming
 * - Error handling
 */

import type {
  AgentStreamMessage,
  ExecuteTaskRequest,
  TaskPlan,
  PlanStep,
} from '../../types';
import { streamChat, type ChatMessage } from '../../lib/api';
import { executeTool as executeToolService, validateToolInput } from './tools-v2';

// ============================================================================
// System Prompts
// ============================================================================

const PLANNING_SYSTEM_PROMPT = `You are an AI task planner. Analyze the user's request and create a detailed execution plan.

Break down complex tasks into specific steps. For each step:
- Describe what needs to be done
- Specify which tool to use (if applicable)
- Keep steps focused and achievable

Available tools:
- Read: Read file contents
- Write: Create or overwrite files
- Edit: Replace text in files
- Bash: Execute shell commands
- Glob: Find files by pattern
- Grep: Search file contents

Format your response as a JSON plan with this structure:
{
  "goal": "overall objective",
  "steps": [
    {"id": "1", "description": "step description", "status": "pending"}
  ]
}

Think step by step about what needs to be done to accomplish the user's goal.`;

const EXECUTION_SYSTEM_PROMPT = `You are an AI task executor. Follow the plan step by step.

For each step:
1. Use tools when needed
2. Read tool outputs carefully
3. Make decisions based on results
4. Move to the next step when complete

IMPORTANT:
- Always verify tool outputs
- Handle errors gracefully
- Explain your actions
- Ask for user input if uncertain

The user's goal is: {goal}

Current step: {current_step}

Execute the plan and report results.`;

// ============================================================================
// Agent State
// ============================================================================

interface AgentState {
  plan: TaskPlan | null;
  currentStepIndex: number;
  toolResults: Map<string, unknown>;
}

// ============================================================================
// Main Execution Function
// ============================================================================

/**
 * Execute a task with two-phase execution (plan + execute)
 *
 * @param request - Task execution request
 * @yields AgentStreamMessage - Streaming updates
 */
export async function* executeTask(
  request: ExecuteTaskRequest
): AsyncGenerator<AgentStreamMessage> {
  const { prompt, task_id, model_config, conversation = [] } = request;

  // Send initial session info
  yield {
    type: 'session',
    session_id: task_id,
  };

  const state: AgentState = {
    plan: null,
    currentStepIndex: 0,
    toolResults: new Map(),
  };

  try {
    // ========================================================================
    // PHASE 1: Planning
    // ========================================================================

    yield {
      type: 'text',
      content: 'Analyzing your request...',
    };

    // Build conversation history with system prompt
    const planningMessages: ChatMessage[] = [
      ...conversation,
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Collect the plan
    const plan = await generatePlan(planningMessages, model_config);
    state.plan = plan;

    // Yield the plan to user
    yield {
      type: 'plan',
      plan,
    };

    // ========================================================================
    // PHASE 2: Execution
    // ========================================================================

    // Note: In a real system, we'd wait for user approval here
    // For now, proceed automatically
    yield {
      type: 'text',
      content: 'Executing plan...',
    };

    yield* executePlan(state, request);

  } catch (error) {
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  // Send completion signal
  yield {
    type: 'done',
  };
}

// ============================================================================
// Phase 1: Generate Plan
// ============================================================================

/**
 * Generate execution plan using AI
 */
async function generatePlan(
  messages: ChatMessage[],
  config?: ExecuteTaskRequest['model_config']
): Promise<TaskPlan> {
  return new Promise((resolve, reject) => {
    let planText = '';
    let toolUseCount = 0;

    const callbacks = {
      onToken: (token: string) => {
        planText += token;
      },
      onComplete: (fullText: string) => {
        try {
          // Parse JSON plan from response
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            resolve({
              goal: plan.goal || prompt,
              steps: plan.steps || [],
            });
          } else {
            // Fallback: parse plain text plan
            resolve(parseTextPlan(fullText));
          }
        } catch (error) {
          reject(new Error(`Failed to parse plan: ${error}`));
        }
      },
      onError: (error: Error) => {
        reject(error);
      },
    };

    const systemPrompt = PLANNING_SYSTEM_PROMPT;
    const apiConfig = config || {
      provider: 'anthropic' as const,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-sonnet-4-20250514',
    };

    streamChat(apiConfig, messages, systemPrompt, callbacks);
  });
}

/**
 * Parse plain text plan into structured format
 */
function parseTextPlan(text: string): TaskPlan {
  const lines = text.split('\n').filter(line => line.trim());
  const steps: PlanStep[] = [];

  lines.forEach((line, index) => {
    if (line.match(/^\d+\./) || line.match(/^-\s*\*\d+\./)) {
      // Numbered step
      const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*\d+\.\s*/, '');
      steps.push({
        id: String(index + 1),
        description: cleanLine.trim(),
        status: 'pending' as const,
      });
    } else if (line.trim() && !steps.some(s => s.status === 'pending')) {
      // First non-empty line is the goal
      steps.push({
        id: '1',
        description: line.trim(),
        status: 'pending' as const,
      });
    }
  });

  // If no steps found, treat entire text as goal
  if (steps.length === 0 && lines.length > 0) {
    return {
      goal: lines.join(' '),
      steps: [],
    };
  }

  return {
    goal: steps[0]?.description || 'Execute task',
    steps,
  };
}

// ============================================================================
// Phase 2: Execute Plan
// ============================================================================

/**
 * Execute the plan step by step
 */
async function* executePlan(
  state: AgentState,
  request: ExecuteTaskRequest
): AsyncGenerator<AgentStreamMessage> {
  const { prompt, model_config } = request;
  const { plan } = state;

  if (!plan) {
    yield {
      type: 'error',
      message: 'No plan available',
    };
    return;
  }

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    state.currentStepIndex = i;

    // Update step status
    step.status = 'in_progress';
    yield {
      type: 'plan',
      plan,
    };

    yield {
      type: 'text',
      content: `Step ${i + 1}/${plan.steps.length}: ${step.description}`,
    };

    // Execute the step
    yield* executeStep(step, state, request);

    // Mark step complete
    step.status = 'completed';
  }
}

/**
 * Execute a single step
 */
async function* executeStep(
  step: PlanStep,
  state: AgentState,
  request: ExecuteTaskRequest
): AsyncGenerator<AgentStreamMessage> {
  const { plan } = state;
  const { prompt, model_config } = request;

  // Build execution context
  const context = `Goal: ${plan?.goal}\n` +
    `Current Step: ${step.description}\n` +
    `Available Tools: Read, Write, Edit, Bash, Glob, Grep`;

  // Check if step requires a tool
  const toolMatch = step.description.match(/\b(Read|Write|Edit|Bash|Glob|Grep)\b/i);

  if (toolMatch && shouldUseTool(step.description)) {
    // Let AI decide which tool to use and how
    const executionMessages: ChatMessage[] = [
      {
        role: 'user' as const,
        content: `Context: ${context}\n\n` +
        `I need to: ${step.description}\n\n` +
        `Available tools: Read, Write, Edit, Bash, Glob, Grep\n\n` +
        `Determine which tool to use and provide the input in JSON format:\n` +
        `For Read/Write/Edit: { "file_path": "path" } or { "file_path": "path", "content": "..." }\n` +
        `For Bash: { "command": "command" }\n` +
        `For Glob: { "pattern": "*.ts", "path": "." }\n` +
        `For Grep: { "pattern": "function", "path": ".", "recursive": true }`,
      },
    ];

    yield* executeWithAI(executionMessages, model_config);
  } else {
    // Direct execution without tools
    yield* executeWithAI(
      [
        {
          role: 'user' as const,
          content: step.description,
        },
      ],
      model_config
    );
  }
}

/**
 * Execute with AI (tool use loop)
 */
async function* executeWithAI(
  messages: ChatMessage[],
  config?: ExecuteTaskRequest['model_config']
): AsyncGenerator<AgentStreamMessage> {
  const systemPrompt = EXECUTION_SYSTEM_PROMPT.replace('{goal}', messages[messages.length - 1].content);

  let currentContent = '';
  let toolUseId: string | null = null;

  const callbacks = {
    onToken: (token: string) => {
      currentContent += token;

      // Check if this is a tool use block
      if (token.includes('<tool_use>')) {
        // Start collecting tool use
      } else if (token.includes('</tool_use>')) {
        // End tool use - execute it
        if (toolUseId) {
          const toolUse = parseToolUse(currentContent);
          if (toolUse) {
            yield {
              type: 'tool_use',
              name: toolUse.name,
              input: toolUse.input,
              id: toolUseId,
            };

            // Execute the tool
            const result = await executeToolService(toolUse.name, toolUse.input);

            yield {
              type: 'tool_result',
              tool_use_id: toolUseId,
              output: result.output || '',
            };

            if (result.error) {
              yield {
                type: 'error',
                message: result.error,
              };
            }

            currentContent = '';
            toolUseId = null;
          }
        }
      }

      // Stream text tokens to user
      if (token && !token.includes('<') && !token.includes('>')) {
        yield {
          type: 'text',
          content: token,
        };
      }
    },
    onComplete: () => {
      // AI finished
    },
    onError: (error: Error) => {
      yield {
        type: 'error',
        message: error.message,
      };
    },
  };

  const apiConfig = config || {
    provider: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-sonnet-4-20250514',
  };

  await streamChat(apiConfig, messages, systemPrompt, callbacks);
}

/**
 * Check if a step description indicates tool usage
 */
function shouldUseTool(description: string): boolean {
  const toolKeywords = ['read', 'write', 'edit', 'file', 'run', 'execute', 'search', 'list'];
  const lower = description.toLowerCase();
  return toolKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Parse tool_use block from AI response
 */
function parseToolUse(content: string): { name: string; input: unknown } | null {
  try {
    // Extract name
    const nameMatch = content.match(/<tool_use[^>]*name="([^"]+)"/);
    const toolName = nameMatch?.[1];

    if (!toolName) {
      return null;
    }

    // Extract input (entire JSON object)
    const inputMatch = content.match(/<tool_use[^>]*>([\s\S]*?)<\/tool_use>/);
    const inputText = inputMatch?.[1];

    if (!inputText) {
      return null;
    }

    // Parse input as JSON
    let input: unknown;
    try {
      input = JSON.parse(inputText.trim());
    } catch {
      input = { raw: inputText };
    }

    return { name: toolName, input };
  } catch {
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Execute a tool and return the result
 */
export async function executeTool(toolName: string, toolInput: unknown) {
  console.log(`[Agent Executor] Executing tool: ${toolName}`, toolInput);

  // Validate input
  if (!validateToolInput(toolName, toolInput)) {
    throw new Error(`Invalid input for tool: ${toolName}`);
  }

  // Execute via tool service
  return await executeToolService(toolName, toolInput);
}
