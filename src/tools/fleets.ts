import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerFleetTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'fleets',
    {
      description: `List BindPlane fleets. Fleets group agents by labels and assign them a shared configuration automatically.

Actions:
• list — List all fleets with their agent counts and configurations. No params`,
      inputSchema: z.object({
        action: z.enum(['list']).describe('Action to perform'),
      }),
    },
    async ({ action }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

      switch (action) {
        case 'list':
          return json(await client.get('/v1/fleets'));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
