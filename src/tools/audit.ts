import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { AuditLogger } from '../audit.js';

export function registerAuditTools(server: McpServer, logger: AuditLogger) {
  server.registerTool(
    'get-action-report',
    {
      description:
        'Get a report of all actions performed in this session. Shows tool name, parameters, status, duration, and timestamp for every operation.',
      inputSchema: z.object({
        last: z
          .number()
          .optional()
          .describe('Return only the last N entries (default: all)'),
      }),
    },
    async ({ last }) => {
      let entries = logger.getEntries();
      if (last !== undefined && last > 0) {
        entries = entries.slice(-last);
      }

      if (entries.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: 'No actions recorded in this session.' },
          ],
        };
      }

      const lines: string[] = [
        `# Action Report — ${entries.length} operation(s)`,
        '',
      ];

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

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    }
  );

  server.registerTool(
    'clear-action-report',
    {
      description: 'Clear the action report log for this session',
      inputSchema: z.object({}),
    },
    async () => {
      const count = logger.getEntries().length;
      logger.clear();
      return {
        content: [
          {
            type: 'text' as const,
            text: `Cleared ${count} entries from the action report.`,
          },
        ],
      };
    }
  );
}
