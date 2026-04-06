#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getAuthHeaders } from './auth.js';
import { BindPlaneClient } from './client.js';
import { registerSystemTools } from './tools/system.js';
import { registerAgentTools } from './tools/agents.js';
import { registerConfigurationTools } from './tools/configurations.js';
import { registerComponentTypeTools } from './tools/component-types.js';
import { registerRolloutTools } from './tools/rollouts.js';
import { registerFleetTools } from './tools/fleets.js';
import { registerResourceTools } from './tools/resources.js';
import { registerAdminTools } from './tools/admin.js';

const name = 'mcp-bindplane';
const version = '0.1.0';

function main() {
  const baseUrl = process.env.BINDPLANE_URL;
  if (!baseUrl) {
    console.error('BINDPLANE_URL environment variable is required');
    process.exit(1);
  }

  if (process.env.BINDPLANE_TLS_SKIP_VERIFY === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const authHeaders = getAuthHeaders();
  const timeout = process.env.BINDPLANE_TIMEOUT
    ? parseInt(process.env.BINDPLANE_TIMEOUT, 10)
    : undefined;

  const client = new BindPlaneClient(baseUrl, authHeaders, { timeout });
  const server = new McpServer({ name, version });

  registerSystemTools(server, client);
  registerAgentTools(server, client);
  registerConfigurationTools(server, client);
  registerComponentTypeTools(server, client);
  registerRolloutTools(server, client);
  registerFleetTools(server, client);
  registerResourceTools(server, client);
  registerAdminTools(server, client);

  const transport = new StdioServerTransport();
  server.connect(transport);
}

main();
