import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerResourceTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'resources',
    {
      description: `Manage BindPlane resources generically (like kubectl apply/delete). Works with any resource kind: Configuration, Source, Destination, Processor, Extension, Fleet, etc.

Actions:
• apply — Create or update resources. Params: resources (array of resource objects with apiVersion, kind, metadata.name, spec). Use apiVersion "bindplane.observiq.com/v1" or "bindplane.observiq.com/v2"
• delete — Delete resources by definition. Params: resources (array with apiVersion, kind, metadata.name)
• list-by-kind — List all resources of a specific kind. Params: kind (e.g. "Configuration", "Source", "Destination")
• get — Get one resource by kind and name. Params: kind, name
• get-history — Get the change history of a resource. Params: kind, name`,
      inputSchema: z.object({
        action: z.enum([
          'apply', 'delete', 'list-by-kind', 'get', 'get-history',
        ]).describe('Action to perform'),
        resources: z.array(z.record(z.string(), z.unknown())).optional().describe('Array of resource objects (for apply/delete). Each needs apiVersion, kind, metadata.name, and spec for apply'),
        kind: z.string().optional().describe('Resource kind (for list-by-kind, get, get-history). E.g. "Configuration", "Source", "Destination"'),
        name: z.string().optional().describe('Resource name (for get, get-history)'),
      }),
    },
    async ({ action, resources, kind, name }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
      const enc = encodeURIComponent;

      switch (action) {
        case 'apply':
          return json(await client.post('/v1/apply', { resources }));
        case 'delete':
          return json(await client.post('/v1/delete', { resources }));
        case 'list-by-kind':
          return json(await client.get(`/v1/resources/${enc(kind!)}`));
        case 'get':
          return json(await client.get(`/v1/resources/${enc(kind!)}/${enc(name!)}`));
        case 'get-history':
          return json(await client.get(`/v1/${enc(kind!)}/${enc(name!)}/history`));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
