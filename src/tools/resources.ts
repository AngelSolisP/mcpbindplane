import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerResourceTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'apply-resources',
    {
      description: 'Create or update BindPlane resources (like kubectl apply). Accepts a resource definition with apiVersion, kind, metadata, and spec. Use apiVersion "bindplane.observiq.com/v1". Supported kinds: Configuration, Source, Destination, Processor, Extension, Fleet, etc.',
      inputSchema: z.object({
        resources: z.array(z.record(z.string(), z.unknown())).describe(
          'Array of resource objects. Each must have apiVersion, kind, metadata.name, and spec.'
        ),
      }),
    },
    async ({ resources }) => {
      const result = await client.post('/v1/apply', { resources });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-resources',
    {
      description: 'Delete BindPlane resources by providing resource definitions',
      inputSchema: z.object({
        resources: z.array(z.record(z.string(), z.unknown())).describe(
          'Array of resource objects to delete. Each must have apiVersion, kind, and metadata.name.'
        ),
      }),
    },
    async ({ resources }) => {
      const result = await client.post('/v1/delete', { resources });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-resources-by-kind',
    {
      description: 'List all resources of a specific kind (e.g., Configuration, Source, Destination)',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind (e.g., Configuration, Source, Destination, Processor, Extension)'),
      }),
    },
    async ({ kind }) => {
      const result = await client.get(`/v1/resources/${encodeURIComponent(kind)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-resource',
    {
      description: 'Get a specific resource by kind and name',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind'),
        name: z.string().describe('Resource name'),
      }),
    },
    async ({ kind, name }) => {
      const result = await client.get(`/v1/resources/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-resource-history',
    {
      description: 'Get the change history of a resource',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind'),
        name: z.string().describe('Resource name'),
      }),
    },
    async ({ kind, name }) => {
      const result = await client.get(`/v1/${encodeURIComponent(kind)}/${encodeURIComponent(name)}/history`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
