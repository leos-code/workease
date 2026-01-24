/**
 * Agent Executor Service (Updated)
 * Core task execution logic with streaming responses
 *
 * This service handles:
 * - AI model communication
 * - Tool execution orchestration (NOW CONNECTED)
 * - Response streaming
 * - Error handling
 */

import type {
  AgentStreamMessage,
  ExecuteTaskRequest,
  TaskPlan,
} from '../../types';
import { executeTool as executeToolService, validateToolInput } from './tools';

/**
 * Execute a task and yield streaming messages
 *
 * @param request - Task execution request
 * @yields AgentStreamMessage - Streaming updates
 */
export async function* executeTask(
  request: ExecuteTaskRequest
): AsyncGenerator<AgentStreamMessage> {
  const { prompt, task_id, model_config, work_dir } = request;

  // Send initial session info
  yield {
    type: 'session',
    session_id: task_id,
  };

  try {
    // TODO: Implement two-phase execution
    // Phase 1: Generate plan (if enabled)
    // Phase 2: Execute plan with tools

    // For now, implement a simple execution flow
    yield* executeSimpleFlow(prompt, task_id, model_config);

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

/**
 * Simple execution flow
 * Connects to AI API and streams responses
 *
 * TODO: Replace with actual Claude SDK integration
 */
async function* executeSimpleFlow(
  prompt: string,
  taskId: string,
  modelConfig?: ExecuteTaskRequest['model_config']
): AsyncGenerator<AgentStreamMessage> {
  // TODO: Integrate with Claude SDK
  // For now, this is a placeholder that demonstrates the streaming structure

  // Example: Simulate planning phase
  const plan: TaskPlan = {
    goal: prompt,
    steps: [
      {
        id: '1',
        description: 'Analyze the request',
        status: 'pending',
      },
      {
        id: '2',
        description: 'Execute necessary tools',
        status: 'pending',
      },
      {
        id: '3',
        description: 'Generate response',
        status: 'pending',
      },
    ],
  };

  yield {
    type: 'plan',
    plan,
  };

  // Example: Execute a real tool (now connected!)
  const toolUseId = generateId();

  yield {
    type: 'tool_use',
    name: 'Read',
    input: { file_path: 'README.md' },
    id: toolUseId,
  };

  // Actually execute the tool using the tools service
  const toolResult = await executeToolService('Read', { file_path: 'README.md' });

  yield {
    type: 'tool_result',
    tool_use_id: toolUseId,
    output: toolResult.output,
  };

  if (toolResult.error) {
    yield {
      type: 'error',
      message: `Tool execution failed: ${toolResult.error}`,
    };
  }

  // Example: Simulate text response
  yield {
    type: 'text',
    content: `I understand you want to: ${prompt}`,
  };

  yield {
    type: 'text',
    content: 'This is a placeholder response. The actual implementation will integrate with Claude SDK.',
  };
}

/**
 * Execute a tool and return the result
 * NOW CONNECTED TO TOOL EXECUTION SERVICE
 */
export async function executeTool(toolName: string, toolInput: unknown) {
  console.log(`[Agent Executor] Executing tool: ${toolName}`);

  // Validate input
  if (!validateToolInput(toolName, toolInput)) {
    throw new Error(`Invalid input for tool: ${toolName}`);
  }

  // Execute via tool service
  return await executeToolService(toolName, toolInput);
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
