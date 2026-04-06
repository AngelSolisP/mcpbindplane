import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerConfigurationTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'configurations',
    {
      description: `Manage BindPlane configurations, sources, destinations, processors, and extensions.

Actions — Configurations:
• list-configurations — List all configurations. No params
• get-configuration — Get a configuration by name. Params: name
• copy-configuration — Duplicate a configuration. Params: name (source config to copy)
• revert-configuration — Revert to last deployed version. Params: name
• delete-configuration — Delete a configuration. Params: name

Actions — Sources:
• list-sources — List all source instances. No params
• get-source — Get a source by name. Params: name
• delete-source — Delete a source. Params: name

Actions — Destinations:
• list-destinations — List all destination instances. No params
• get-destination — Get a destination by name. Params: name
• delete-destination — Delete a destination. Params: name

Actions — Processors:
• list-processors — List all processor instances. No params
• get-processor — Get a processor by name. Params: name
• delete-processor — Delete a processor. Params: name

Actions — Extensions:
• list-extensions — List all extension instances. No params
• get-extension — Get an extension by name. Params: name
• delete-extension — Delete an extension. Params: name`,
      inputSchema: z.object({
        action: z.enum([
          'list-configurations', 'get-configuration', 'copy-configuration',
          'revert-configuration', 'delete-configuration',
          'list-sources', 'get-source', 'delete-source',
          'list-destinations', 'get-destination', 'delete-destination',
          'list-processors', 'get-processor', 'delete-processor',
          'list-extensions', 'get-extension', 'delete-extension',
        ]).describe('Action to perform'),
        name: z.string().optional().describe('Resource name (configuration, source, destination, processor, or extension)'),
      }),
    },
    async ({ action, name }) => {
      const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
      const enc = encodeURIComponent;

      switch (action) {
        case 'list-configurations':
          return json(await client.get('/v1/configurations'));
        case 'get-configuration':
          return json(await client.get(`/v1/configurations/${enc(name!)}`));
        case 'copy-configuration':
          return json(await client.post(`/v1/configurations/${enc(name!)}/copy`));
        case 'revert-configuration':
          return json(await client.put(`/v1/configurations/${enc(name!)}/revert`));
        case 'delete-configuration':
          return json(await client.delete(`/v1/configurations/${enc(name!)}`));
        case 'list-sources':
          return json(await client.get('/v1/sources'));
        case 'get-source':
          return json(await client.get(`/v1/sources/${enc(name!)}`));
        case 'delete-source':
          return json(await client.delete(`/v1/sources/${enc(name!)}`));
        case 'list-destinations':
          return json(await client.get('/v1/destinations'));
        case 'get-destination':
          return json(await client.get(`/v1/destinations/${enc(name!)}`));
        case 'delete-destination':
          return json(await client.delete(`/v1/destinations/${enc(name!)}`));
        case 'list-processors':
          return json(await client.get('/v1/processors'));
        case 'get-processor':
          return json(await client.get(`/v1/processors/${enc(name!)}`));
        case 'delete-processor':
          return json(await client.delete(`/v1/processors/${enc(name!)}`));
        case 'list-extensions':
          return json(await client.get('/v1/extensions'));
        case 'get-extension':
          return json(await client.get(`/v1/extensions/${enc(name!)}`));
        case 'delete-extension':
          return json(await client.delete(`/v1/extensions/${enc(name!)}`));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
