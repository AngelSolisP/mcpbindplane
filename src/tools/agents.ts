import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerAgentTools(server: McpServer, client: BindPlaneClient) {
  // --- Agents ---

  server.registerTool(
    'list-agents',
    {
      description: 'List agents. Supports BindPlane query syntax for filtering (e.g., status:Connected platform:linux environment:production).',
      inputSchema: z.object({
        query: z.string().optional().describe('BindPlane query syntax filter (e.g., "status:Connected platform:linux")'),
      }),
    },
    async ({ query }) => {
      const params = query ? { query } : undefined;
      const result = await client.get('/v1/agents', params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent',
    {
      description: 'Get details of a specific agent by ID',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-configuration',
    {
      description: 'Get the current configuration assigned to an agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}/configuration`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-labels',
    {
      description: 'Get labels for a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}/labels`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-agent-labels',
    {
      description: 'Update labels for a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
        labels: z.record(z.string(), z.string()).describe('Labels to set as key-value pairs'),
        overwrite: z.boolean().optional().describe('If true, replace all labels. If false, merge with existing.'),
      }),
    },
    async ({ id, labels, overwrite }) => {
      const result = await client.patch(`/v1/agents/${encodeURIComponent(id)}/labels`, { labels, overwrite });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'bulk-update-agent-labels',
    {
      description: 'Update labels for multiple agents at once',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs'),
        labels: z.record(z.string(), z.string()).describe('Labels to set as key-value pairs'),
        overwrite: z.boolean().optional().describe('If true, replace all labels. If false, merge.'),
      }),
    },
    async ({ agentIds, labels, overwrite }) => {
      const result = await client.patch('/v1/agents/labels', { ids: agentIds, labels, overwrite });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-agent-version',
    {
      description: 'Upgrade a specific agent to a new version',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
        version: z.string().describe('Target version'),
      }),
    },
    async ({ id, version }) => {
      const result = await client.post(`/v1/agents/${encodeURIComponent(id)}/version`, { version });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'bulk-update-agent-version',
    {
      description: 'Upgrade multiple agents to a new version',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs'),
        version: z.string().describe('Target version'),
      }),
    },
    async ({ agentIds, version }) => {
      const result = await client.patch('/v1/agents/version', { ids: agentIds, version });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'disconnect-agent',
    {
      description: 'Disconnect a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.post(`/v1/agents/${encodeURIComponent(id)}/disconnect`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-agents',
    {
      description: 'Delete one or more agents',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs to delete'),
      }),
    },
    async ({ agentIds }) => {
      const result = await client.delete('/v1/agents', { ids: agentIds });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Agent Types ---

  server.registerTool(
    'list-agent-types',
    {
      description: 'List available agent types',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/agent-types');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-type',
    {
      description: 'Get details of a specific agent type',
      inputSchema: z.object({
        name: z.string().describe('Agent type name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/agent-type/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Agent Versions ---

  server.registerTool(
    'list-agent-versions',
    {
      description: 'List available agent versions',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/agent-versions');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-version',
    {
      description: 'Get details of a specific agent version',
      inputSchema: z.object({
        name: z.string().describe('Agent version name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/agent-version/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-install-command',
    {
      description: 'Get the install command for a specific agent type and version',
      inputSchema: z.object({
        type: z.string().describe('Agent type (e.g., observiq-otel-collector)'),
        version: z.string().describe('Agent version'),
      }),
    },
    async ({ type, version }) => {
      const result = await client.get(`/v1/agent-versions/${encodeURIComponent(type)}/${encodeURIComponent(version)}/install-command`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
