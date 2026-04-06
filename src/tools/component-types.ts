import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerComponentTypeTools(server: McpServer, client: BindPlaneClient) {
  const typeEndpoints = [
    { prefix: 'source-type', path: '/v1/source-types', singular: '/v1/source-types', label: 'source type' },
    { prefix: 'destination-type', path: '/v1/destination-types', singular: '/v1/destination-types', label: 'destination type' },
    { prefix: 'processor-type', path: '/v1/processor-types', singular: '/v1/processor-types', label: 'processor type' },
    { prefix: 'extension-type', path: '/v1/extension-types', singular: '/v1/extension-types', label: 'extension type' },
    { prefix: 'recommendation-type', path: '/v1/recommendation-types', singular: '/v1/recommendation-types', label: 'recommendation type' },
  ];

  for (const { prefix, path, singular, label } of typeEndpoints) {
    server.registerTool(
      `list-${prefix}s`,
      {
        description: `List all available ${label}s (component definitions)`,
        inputSchema: z.object({}),
      },
      async () => {
        const result = await client.get(path);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.registerTool(
      `get-${prefix}`,
      {
        description: `Get details of a specific ${label} by name`,
        inputSchema: z.object({
          name: z.string().describe(`${label} name`),
        }),
      },
      async ({ name }) => {
        const result = await client.get(`${singular}/${encodeURIComponent(name)}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      }
    );
  }
}
