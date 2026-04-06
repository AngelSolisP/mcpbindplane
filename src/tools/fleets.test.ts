import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFleetTools } from './fleets.js';
import { BindPlaneClient } from '../client.js';

function createMockClient() {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  } as unknown as BindPlaneClient;
}

describe('fleet tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerFleetTools(server, client)).not.toThrow();
  });
});
