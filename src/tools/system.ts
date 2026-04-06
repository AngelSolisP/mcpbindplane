import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerSystemTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'get-version',
    {
      description: 'Get the BindPlane server version',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/version');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-audit-events',
    {
      description: 'List audit events. Filterable by configuration, user, and date range.',
      inputSchema: z.object({
        configuration: z.string().optional().describe('Filter by configuration name'),
        user: z.string().optional().describe('Filter by user display name'),
        minDate: z.string().optional().describe('Minimum date (YYYYMMDDHHMMSS)'),
        maxDate: z.string().optional().describe('Maximum date (YYYYMMDDHHMMSS)'),
      }),
    },
    async ({ configuration, user, minDate, maxDate }) => {
      const params: Record<string, string> = {};
      if (configuration) params.configuration = configuration;
      if (user) params.user = user;
      if (minDate) params.minDate = minDate;
      if (maxDate) params.maxDate = maxDate;
      const result = await client.get('/v1/audit-events', Object.keys(params).length > 0 ? params : undefined);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'download-audit-events',
    {
      description: 'Download audit events as CSV',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/audit-events/download');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-available-components',
    {
      description: 'List available components for collector distributions',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/available-components');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
