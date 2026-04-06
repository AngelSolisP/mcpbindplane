import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { AuditLogger } from '../audit.js';

export function registerAuditTools(server: McpServer, logger: AuditLogger) {
  server.registerTool(
    'audit',
    {
      description: `Session audit trail — review or clear the log of all actions performed by the AI in this session.

Actions:
• get-report — Get a formatted report of all actions (tool name, params, status, duration, timestamp). Params: last? (number, return only last N entries)
• clear-report — Clear the action log. No params`,
      inputSchema: z.object({
        action: z.enum(['get-report', 'clear-report']).describe('Action to perform'),
        last: z.number().optional().describe('Return only the last N entries (for get-report)'),
      }),
    },
    async ({ action, last }) => {
      switch (action) {
        case 'get-report': {
          let entries = logger.getEntries();
          if (last !== undefined && last > 0) {
            entries = entries.slice(-last);
          }

          if (entries.length === 0) {
            return { content: [{ type: 'text' as const, text: 'No actions recorded in this session.' }] };
          }

          const lines: string[] = [`# Action Report — ${entries.length} operation(s)`, ''];

          for (const e of entries) {
            const icon = e.status === 'success' ? '[OK]' : '[ERROR]';
            const time = e.timestamp.replace('T', ' ').replace('Z', ' UTC');
            lines.push(`${icon} ${time} — ${e.tool} (${e.durationMs}ms)`);
            const paramKeys = Object.keys(e.params);
            if (paramKeys.length > 0) {
              lines.push(`    Params: ${JSON.stringify(e.params)}`);
            }
            if (e.error) {
              lines.push(`    Error: ${e.error}`);
            }
            lines.push('');
          }

          const successCount = entries.filter((e) => e.status === 'success').length;
          const errorCount = entries.filter((e) => e.status === 'error').length;
          lines.push(`Summary: ${successCount} successful, ${errorCount} errors`);

          return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
        }
        case 'clear-report': {
          const count = logger.getEntries().length;
          logger.clear();
          return { content: [{ type: 'text' as const, text: `Cleared ${count} entries from the action report.` }] };
        }
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
  );
}
