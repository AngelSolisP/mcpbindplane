import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuditLogger } from '../audit.js';
import { registerAuditTools } from './audit.js';

describe('audit tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const logger = new AuditLogger();
    expect(() => registerAuditTools(server, logger)).not.toThrow();
  });
});
