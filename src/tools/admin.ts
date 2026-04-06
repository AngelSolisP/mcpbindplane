import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerAdminTools(server: McpServer, client: BindPlaneClient) {
  // --- Accounts ---

  server.registerTool(
    'list-accounts',
    {
      description: 'List all accounts',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/accounts');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-account',
    {
      description: 'Get an account by ID',
      inputSchema: z.object({ id: z.string().describe('Account ID') }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/accounts/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-account',
    {
      description: 'Create a new account',
      inputSchema: z.object({
        account: z.record(z.string(), z.unknown()).describe('Account data'),
      }),
    },
    async ({ account }) => {
      const result = await client.post('/v1/accounts', account);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-account',
    {
      description: 'Update an account',
      inputSchema: z.object({
        account: z.record(z.string(), z.unknown()).describe('Account data with updates'),
      }),
    },
    async ({ account }) => {
      const result = await client.patch('/v1/accounts', account);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-account',
    {
      description: 'Delete an account by ID',
      inputSchema: z.object({ id: z.string().describe('Account ID') }),
    },
    async ({ id }) => {
      const result = await client.delete(`/v1/accounts/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Organizations ---

  server.registerTool(
    'list-organizations',
    {
      description: 'List all organizations',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/organizations');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-organization',
    {
      description: 'Get an organization by name',
      inputSchema: z.object({ name: z.string().describe('Organization name') }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/organizations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-organization',
    {
      description: 'Create a new organization',
      inputSchema: z.object({
        organization: z.record(z.string(), z.unknown()).describe('Organization data'),
      }),
    },
    async ({ organization }) => {
      const result = await client.post('/v1/organizations', organization);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-organization',
    {
      description: 'Delete an organization by ID',
      inputSchema: z.object({ id: z.string().describe('Organization ID') }),
    },
    async ({ id }) => {
      const result = await client.delete(`/v1/organizations/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-organization-accounts',
    {
      description: 'Get accounts for the current organization',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/organizations/accounts');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-organization-projects',
    {
      description: 'Get projects for the current organization',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/organizations/projects');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-organization-users',
    {
      description: 'Get users for the current organization',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/organizations/users');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Projects ---

  server.registerTool(
    'list-projects',
    {
      description: 'List all projects',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/projects');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-project',
    {
      description: 'Get a project by ID',
      inputSchema: z.object({ id: z.string().describe('Project ID') }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/projects/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-project',
    {
      description: 'Create a new project',
      inputSchema: z.object({
        project: z.record(z.string(), z.unknown()).describe('Project data'),
      }),
    },
    async ({ project }) => {
      const result = await client.post('/v1/projects', project);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-project',
    {
      description: 'Delete a project by ID',
      inputSchema: z.object({ id: z.string().describe('Project ID') }),
    },
    async ({ id }) => {
      const result = await client.delete(`/v1/projects/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Users ---

  server.registerTool(
    'list-users',
    {
      description: 'List all users',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/users');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-user',
    {
      description: 'Create a new user',
      inputSchema: z.object({
        user: z.record(z.string(), z.unknown()).describe('User data'),
      }),
    },
    async ({ user }) => {
      const result = await client.post('/v1/users', user);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-user',
    {
      description: 'Delete a user by ID',
      inputSchema: z.object({ id: z.string().describe('User ID') }),
    },
    async ({ id }) => {
      const result = await client.delete(`/v1/users/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Secret Keys ---

  server.registerTool(
    'list-secret-keys',
    {
      description: 'List all secret keys',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/secret-keys');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-secret-key',
    {
      description: 'Create a new secret key',
      inputSchema: z.object({
        secretKey: z.record(z.string(), z.unknown()).optional().describe('Secret key data'),
      }),
    },
    async ({ secretKey }) => {
      const result = await client.post('/v1/secret-keys', secretKey);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-secret-key',
    {
      description: 'Delete a secret key',
      inputSchema: z.object({
        key: z.string().describe('Secret key identifier'),
      }),
    },
    async ({ key }) => {
      const result = await client.delete(`/v1/secret-keys/${encodeURIComponent(key)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
