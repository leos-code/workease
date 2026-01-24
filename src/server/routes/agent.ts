/**
 * Agent Routes
 * Main endpoints for task execution with streaming support
 */

import { Hono } from 'hono';
import type { AgentStreamMessage, ExecuteTaskRequest } from '../../types';
import { executeTask } from '../services/agent-executor';
import { ValidationError } from '../middleware/error-handler';

const agentRoutes = new Hono();

/**
 * POST /agent/execute
 *
 * Execute a task with streaming responses via SSE
 *
 * Request body:
 * {
 *   "prompt": string,
 *   "work_dir?: string,
 *   "task_id": string,
 *   "model_config?: {...},
 *   "sandbox_config?: {...},
 *   "images?: [...],
 *   "conversation?: [...],
 *   "skills_path?: string
 * }
 *
 * Response: Server-Sent Events stream
 */
agentRoutes.post('/execute', async (c) => {
  // Parse request body
  const body = await c.req.json().catch(() => null);

  if (!body) {
    throw new ValidationError('Invalid request body');
  }

  // Validate required fields
  if (!body.prompt || typeof body.prompt !== 'string') {
    throw new ValidationError('prompt is required and must be a string', 'prompt');
  }

  if (!body.task_id || typeof body.task_id !== 'string') {
    throw new ValidationError('task_id is required and must be a string', 'task_id');
  }

  const request: ExecuteTaskRequest = {
    prompt: body.prompt,
    work_dir: body.work_dir,
    task_id: body.task_id,
    model_config: body.model_config,
    sandbox_config: body.sandbox_config,
    images: body.images,
    conversation: body.conversation,
    skills_path: body.skills_path,
  };

  // Set up SSE streaming
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Execute task and stream results
        const generator = executeTask(request);

        for await (const message of generator) {
          // Send SSE message
          const data = JSON.stringify(message);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          // If done signal, close stream
          if (message.type === 'done') {
            controller.close();
            break;
          }
        }
      } catch (error) {
        console.error('[Agent Execute Error]', error);

        // Send error message
        const errorMessage: AgentStreamMessage = {
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
        };

        const data = JSON.stringify(errorMessage);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

/**
 * POST /agent/stop
 *
 * Stop a running task execution
 *
 * Request body:
 * {
 *   "session_id": string
 * }
 */
agentRoutes.post('/stop', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !body.session_id) {
    throw new ValidationError('session_id is required', 'session_id');
  }

  // TODO: Implement task stopping logic
  // This would require tracking active executions and aborting them

  return c.json({
    success: true,
    message: `Task ${body.session_id} stopped`,
  });
});

/**
 * POST /agent/plan
 *
 * Generate an execution plan without executing
 * (Two-phase execution: plan then execute)
 *
 * Request body:
 * {
 *   "prompt": string,
 *   "model_config?: {...}
 * }
 */
agentRoutes.post('/plan', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !body.prompt) {
    throw new ValidationError('prompt is required', 'prompt');
  }

  // TODO: Implement planning phase
  // This would call the AI to generate a plan without executing

  return c.json({
    success: true,
    plan: {
      goal: body.prompt,
      steps: [
        // Plan steps would be generated here
      ],
    },
  });
});

/**
 * POST /agent/execute-plan
 *
 * Execute a previously approved plan
 *
 * Request body:
 * {
 *   "plan_id": string,
 *   "session_id": string
 * }
 */
agentRoutes.post('/execute-plan', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !body.plan_id) {
    throw new ValidationError('plan_id is required', 'plan_id');
  }

  // TODO: Implement plan execution
  // This would execute steps from an approved plan

  return c.json({
    success: true,
    message: 'Plan execution started',
  });
});

export { agentRoutes };
