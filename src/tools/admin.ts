import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerAdminTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'admin',
    {
      description: `Manage BindPlane accounts, organizations, projects, users, and secret keys.

Actions — Accounts:
• list-accounts — List all accounts. No params
• get-account — Get an account. Params: id
• create-account — Create an account. Params: data (account object)
• update-account — Update an account. Params: data (account object with updates)
• delete-account — Delete an account. Params: id

Actions — Organizations:
• list-organizations — List all organizations. No params
• get-organization — Get an organization. Params: name
• create-organization — Create an organization. Params: data (organization object)
• delete-organization — Delete an organization. Params: id
• get-organization-accounts — Get accounts in current org. No params
• get-organization-projects — Get projects in current org. No params
• get-organization-users — Get users in current org. No params

Actions — Projects:
• list-projects — List all projects. No params
• get-project — Get a project. Params: id
• create-project — Create a project. Params: data (project object)
• delete-project — Delete a project. Params: id

Actions — Users:
• list-users — List all users. No params
• create-user — Create a user. Params: data (user object)
• delete-user — Delete a user. Params: id

Actions — Secret Keys:
• list-secret-keys — List all API secret keys. No params
• create-secret-key — Create a new secret key. Params: data? (optional secret key config)
• delete-secret-key — Delete a secret key. Params: key (key identifier)`,
      inputSchema: z.object({
        action: z.enum([
          'list-accounts', 'get-account', 'create-account', 'update-account', 'delete-account',
          'list-organizations', 'get-organization', 'create-organization', 'delete-organization',
          'get-organization-accounts', 'get-organization-projects', 'get-organization-users',
          'list-projects', 'get-project', 'create-project', 'delete-project',
          'list-users', 'create-user', 'delete-user',
          'list-secret-keys', 'create-secret-key', 'delete-secret-key',
        ]).describe('Action to perform'),
        id: z.string().optional().describe('Resource ID (for get-account, delete-account, delete-organization, get-project, delete-project, delete-user)'),
        name: z.string().optional().describe('Organization name (for get-organization)'),
        key: z.string().optional().describe('Secret key identifier (for delete-secret-key)'),
        data: z.record(z.string(), z.unknown()).optional().describe('Resource data object (for create/update actions)'),
      }),
    },
    async ({ action, id, name, key, data }) => {
      const json = (d: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(d, null, 2) }] });
      const enc = encodeURIComponent;

      switch (action) {
        case 'list-accounts':
          return json(await client.get('/v1/accounts'));
        case 'get-account':
          return json(await client.get(`/v1/accounts/${enc(id!)}`));
        case 'create-account':
          return json(await client.post('/v1/accounts', data));
        case 'update-account':
          return json(await client.patch('/v1/accounts', data));
        case 'delete-account':
          return json(await client.delete(`/v1/accounts/${enc(id!)}`));
        case 'list-organizations':
          return json(await client.get('/v1/organizations'));
        case 'get-organization':
          return json(await client.get(`/v1/organizations/${enc(name!)}`));
        case 'create-organization':
          return json(await client.post('/v1/organizations', data));
        case 'delete-organization':
          return json(await client.delete(`/v1/organizations/${enc(id!)}`));
        case 'get-organization-accounts':
          return json(await client.get('/v1/organizations/accounts'));
        case 'get-organization-projects':
          return json(await client.get('/v1/organizations/projects'));
        case 'get-organization-users':
          return json(await client.get('/v1/organizations/users'));
        case 'list-projects':
          return json(await client.get('/v1/projects'));
        case 'get-project':
          return json(await client.get(`/v1/projects/${enc(id!)}`));
        case 'create-project':
          return json(await client.post('/v1/projects', data));
        case 'delete-project':
          return json(await client.delete(`/v1/projects/${enc(id!)}`));
        case 'list-users':
          return json(await client.get('/v1/users'));
        case 'create-user':
          return json(await client.post('/v1/users', data));
        case 'delete-user':
          return json(await client.delete(`/v1/users/${enc(id!)}`));
        case 'list-secret-keys':
          return json(await client.get('/v1/secret-keys'));
        case 'create-secret-key':
          return json(await client.post('/v1/secret-keys', data));
        case 'delete-secret-key':
          return json(await client.delete(`/v1/secret-keys/${enc(key!)}`));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
