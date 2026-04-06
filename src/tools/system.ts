import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerSystemTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'system',
    {
      description: `BindPlane system information: server version, audit events, and available components.

Actions:
• get-version — Get the BindPlane server version. No params
• list-audit-events — List audit events with optional filters. Params: configuration?, user?, minDate? (YYYYMMDDHHMMSS), maxDate? (YYYYMMDDHHMMSS)
• download-audit-events — Download audit events as CSV. No params
• list-available-components — List available collector components/plugins. No params`,
      inputSchema: z.object({
        action: z.enum([
          'get-version', 'list-audit-events', 'download-audit-events', 'list-available-components',
        ]).describe('Action to perform'),
        configuration: z.string().optional().describe('Filter audit events by configuration name'),
        user: z.string().optional().describe('Filter audit events by user display name'),
        minDate: z.string().optional().describe('Minimum date filter (YYYYMMDDHHMMSS)'),
        maxDate: z.string().optional().describe('Maximum date filter (YYYYMMDDHHMMSS)'),
      }),
    },
    async ({ action, configuration, user, minDate, maxDate }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

      switch (action) {
        case 'get-version':
          return json(await client.get('/v1/version'));
        case 'list-audit-events': {
          const params: Record<string, string> = {};
          if (configuration) params.configuration = configuration;
          if (user) params.user = user;
          if (minDate) params.minDate = minDate;
          if (maxDate) params.maxDate = maxDate;
          return json(await client.get('/v1/audit-events', Object.keys(params).length > 0 ? params : undefined));
        }
        case 'download-audit-events':
          return json(await client.get('/v1/audit-events/download'));
        case 'list-available-components':
          return json(await client.get('/v1/available-components'));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
