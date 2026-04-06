import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerConfigurationTools(server: McpServer, client: BindPlaneClient) {
  // --- Configurations ---

  server.registerTool(
    'list-configurations',
    {
      description: 'List all configurations',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/configurations');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-configuration',
    {
      description: 'Get a configuration by name',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/configurations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'copy-configuration',
    {
      description: 'Make a copy of a configuration',
      inputSchema: z.object({
        name: z.string().describe('Source configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/configurations/${encodeURIComponent(name)}/copy`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'revert-configuration',
    {
      description: 'Revert a configuration to its last deployed version',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/configurations/${encodeURIComponent(name)}/revert`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-configuration',
    {
      description: 'Delete a configuration',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/configurations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Sources ---

  server.registerTool(
    'list-sources',
    {
      description: 'List all source instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/sources');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-source',
    {
      description: 'Get a source instance by name',
      inputSchema: z.object({
        name: z.string().describe('Source name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/sources/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-source',
    {
      description: 'Delete a source instance',
      inputSchema: z.object({
        name: z.string().describe('Source name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/sources/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Destinations ---

  server.registerTool(
    'list-destinations',
    {
      description: 'List all destination instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/destinations');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-destination',
    {
      description: 'Get a destination instance by name',
      inputSchema: z.object({
        name: z.string().describe('Destination name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/destinations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-destination',
    {
      description: 'Delete a destination instance',
      inputSchema: z.object({
        name: z.string().describe('Destination name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/destinations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Processors ---

  server.registerTool(
    'list-processors',
    {
      description: 'List all processor instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/processors');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-processor',
    {
      description: 'Get a processor instance by name',
      inputSchema: z.object({
        name: z.string().describe('Processor name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/processors/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-processor',
    {
      description: 'Delete a processor instance',
      inputSchema: z.object({
        name: z.string().describe('Processor name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/processors/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Extensions ---

  server.registerTool(
    'list-extensions',
    {
      description: 'List all extension instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/extensions');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-extension',
    {
      description: 'Get an extension instance by name',
      inputSchema: z.object({
        name: z.string().describe('Extension name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/extensions/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-extension',
    {
      description: 'Delete an extension instance',
      inputSchema: z.object({
        name: z.string().describe('Extension name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/extensions/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
