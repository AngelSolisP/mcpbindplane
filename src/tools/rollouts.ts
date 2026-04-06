import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerRolloutTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'list-rollouts',
    {
      description: 'List all rollouts',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/rollouts');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-rollout',
    {
      description: 'Create a new rollout for a configuration',
      inputSchema: z.object({
        name: z.string().describe('Configuration name to create rollout for'),
      }),
    },
    async ({ name }) => {
      const result = await client.post('/v1/rollouts', { name });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-rollout',
    {
      description: 'Get details of a specific rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/rollouts/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-rollout-status',
    {
      description: 'Get the status of a rollout (how many agents updated, errors, etc.)',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/rollouts/${encodeURIComponent(name)}/status`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'start-rollout',
    {
      description: 'Start deploying a rollout to agents. Rolls out incrementally: 3 agents first, then batches of 5x more every 5 seconds, up to 100.',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/rollouts/${encodeURIComponent(name)}/start`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-rollout',
    {
      description: 'Update a rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/rollouts/${encodeURIComponent(name)}/update`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'pause-rollout',
    {
      description: 'Pause an in-progress rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/rollouts/${encodeURIComponent(name)}/pause`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'resume-rollout',
    {
      description: 'Resume a paused rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/rollouts/${encodeURIComponent(name)}/resume`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
