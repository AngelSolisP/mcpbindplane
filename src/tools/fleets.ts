import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerFleetTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'list-fleets',
    {
      description: 'List all fleets. Fleets group agents and assign shared configurations.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/fleets');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
