import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerRolloutTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'rollouts',
    {
      description: `Manage BindPlane rollouts — incremental configuration deployments to agents.

Actions:
• list — List all rollouts. No params
• create — Create a new rollout for a configuration. Params: name (configuration name)
• get — Get rollout details. Params: name
• get-status — Get rollout progress (agents updated, errors, etc). Params: name
• start — Start deploying a rollout. Deploys incrementally: 3 agents first, then 5x batches every 5s up to 100. Params: name
• update — Update a rollout. Params: name
• pause — Pause an in-progress rollout. Params: name
• resume — Resume a paused rollout. Params: name`,
      inputSchema: z.object({
        action: z.enum([
          'list', 'create', 'get', 'get-status',
          'start', 'update', 'pause', 'resume',
        ]).describe('Action to perform'),
        name: z.string().optional().describe('Configuration or rollout name'),
      }),
    },
    async ({ action, name }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
      const enc = encodeURIComponent;

      switch (action) {
        case 'list':
          return json(await client.get('/v1/rollouts'));
        case 'create':
          return json(await client.post('/v1/rollouts', { name }));
        case 'get':
          return json(await client.get(`/v1/rollouts/${enc(name!)}`));
        case 'get-status':
          return json(await client.get(`/v1/rollouts/${enc(name!)}/status`));
        case 'start':
          return json(await client.post(`/v1/rollouts/${enc(name!)}/start`));
        case 'update':
          return json(await client.post(`/v1/rollouts/${enc(name!)}/update`));
        case 'pause':
          return json(await client.put(`/v1/rollouts/${enc(name!)}/pause`));
        case 'resume':
          return json(await client.put(`/v1/rollouts/${enc(name!)}/resume`));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
