import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerAgentTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'agents',
    {
      description: `Manage BindPlane agents, agent types, and agent versions.

Actions:
• list — List agents with optional filtering. Params: query? (BindPlane query syntax, e.g. "status:Connected platform:linux")
• get — Get full details of one agent. Params: id
• get-configuration — Get the configuration currently assigned to an agent. Params: id
• get-labels — Get all labels for an agent. Params: id
• update-labels — Set or merge labels on one agent. Params: id, labels, overwrite? (true=replace all, false=merge)
• bulk-update-labels — Set or merge labels on multiple agents. Params: agentIds, labels, overwrite?
• update-version — Upgrade one agent to a new collector version. Params: id, version
• bulk-update-version — Upgrade multiple agents at once. Params: agentIds, version
• disconnect — Disconnect a running agent. Params: id
• delete — Delete one or more agents permanently. Params: agentIds
• list-types — List available agent types (e.g. observiq-otel-collector). No params
• get-type — Get details of a specific agent type. Params: name
• list-versions — List all available agent collector versions. No params
• get-version — Get details of a specific agent version. Params: name
• get-install-command — Get the shell command to install an agent. Params: agentType, version`,
      inputSchema: z.object({
        action: z.enum([
          'list', 'get', 'get-configuration', 'get-labels', 'update-labels',
          'bulk-update-labels', 'update-version', 'bulk-update-version',
          'disconnect', 'delete', 'list-types', 'get-type',
          'list-versions', 'get-version', 'get-install-command',
        ]).describe('Action to perform'),
        id: z.string().optional().describe('Agent ID (for get, get-configuration, get-labels, update-labels, update-version, disconnect)'),
        name: z.string().optional().describe('Agent type or version name (for get-type, get-version)'),
        query: z.string().optional().describe('BindPlane query filter (for list). Example: "status:Connected platform:linux"'),
        labels: z.record(z.string(), z.string()).optional().describe('Labels as key-value pairs (for update-labels, bulk-update-labels)'),
        overwrite: z.boolean().optional().describe('true = replace all labels, false = merge (for update-labels, bulk-update-labels)'),
        agentIds: z.array(z.string()).optional().describe('List of agent IDs (for bulk-update-labels, bulk-update-version, delete)'),
        version: z.string().optional().describe('Target collector version (for update-version, bulk-update-version, get-install-command)'),
        agentType: z.string().optional().describe('Agent type name (for get-install-command, e.g. "observiq-otel-collector")'),
      }),
    },
    async ({ action, id, name, query, labels, overwrite, agentIds, version, agentType }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
      const enc = encodeURIComponent;

      switch (action) {
        case 'list':
          return json(await client.get('/v1/agents', query ? { query } : undefined));
        case 'get':
          return json(await client.get(`/v1/agents/${enc(id!)}`));
        case 'get-configuration':
          return json(await client.get(`/v1/agents/${enc(id!)}/configuration`));
        case 'get-labels':
          return json(await client.get(`/v1/agents/${enc(id!)}/labels`));
        case 'update-labels':
          return json(await client.patch(`/v1/agents/${enc(id!)}/labels`, { labels, overwrite }));
        case 'bulk-update-labels':
          return json(await client.patch('/v1/agents/labels', { ids: agentIds, labels, overwrite }));
        case 'update-version':
          return json(await client.post(`/v1/agents/${enc(id!)}/version`, { version }));
        case 'bulk-update-version':
          return json(await client.patch('/v1/agents/version', { ids: agentIds, version }));
        case 'disconnect':
          return json(await client.post(`/v1/agents/${enc(id!)}/disconnect`));
        case 'delete':
          return json(await client.delete('/v1/agents', { ids: agentIds }));
        case 'list-types':
          return json(await client.get('/v1/agent-types'));
        case 'get-type':
          return json(await client.get(`/v1/agent-type/${enc(name!)}`));
        case 'list-versions':
          return json(await client.get('/v1/agent-versions'));
        case 'get-version':
          return json(await client.get(`/v1/agent-version/${enc(name!)}`));
        case 'get-install-command':
          return json(await client.get(`/v1/agent-versions/${enc(agentType!)}/${enc(version!)}/install-command`));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
