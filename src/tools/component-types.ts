import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerComponentTypeTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'component-types',
    {
      description: `Browse available BindPlane component type definitions (source types, destination types, processor types, extension types, recommendation types).

Actions:
• list-source-types — List all available source types (e.g. syslog, windowsevents, macOS). No params
• get-source-type — Get details/parameters of a source type. Params: name (e.g. "macOS", "syslog")
• list-destination-types — List all destination types (e.g. chronicle, datadog). No params
• get-destination-type — Get details of a destination type. Params: name
• list-processor-types — List all processor types. No params
• get-processor-type — Get details of a processor type. Params: name
• list-extension-types — List all extension types. No params
• get-extension-type — Get details of an extension type. Params: name
• list-recommendation-types — List all recommendation types. No params
• get-recommendation-type — Get details of a recommendation type. Params: name`,
      inputSchema: z.object({
        action: z.enum([
          'list-source-types', 'get-source-type',
          'list-destination-types', 'get-destination-type',
          'list-processor-types', 'get-processor-type',
          'list-extension-types', 'get-extension-type',
          'list-recommendation-types', 'get-recommendation-type',
        ]).describe('Action to perform'),
        name: z.string().optional().describe('Component type name (for get-* actions)'),
      }),
    },
    async ({ action, name }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
      const enc = encodeURIComponent;

      const routes: Record<string, string> = {
        'list-source-types': '/v1/source-types',
        'list-destination-types': '/v1/destination-types',
        'list-processor-types': '/v1/processor-types',
        'list-extension-types': '/v1/extension-types',
        'list-recommendation-types': '/v1/recommendation-types',
      };

      if (routes[action]) {
        return json(await client.get(routes[action]));
      }

      const getRoutes: Record<string, string> = {
        'get-source-type': '/v1/source-types',
        'get-destination-type': '/v1/destination-types',
        'get-processor-type': '/v1/processor-types',
        'get-extension-type': '/v1/extension-types',
        'get-recommendation-type': '/v1/recommendation-types',
      };

      if (getRoutes[action]) {
        return json(await client.get(`${getRoutes[action]}/${enc(name!)}`));
      }

      throw new Error(`Unknown action: ${action}`);
    }
  );
}
