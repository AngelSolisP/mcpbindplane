import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface AuditEntry {
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  status: 'success' | 'error';
  durationMs: number;
  error?: string;
}

export class AuditLogger {
  private entries: AuditEntry[] = [];

  log(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}

const AUDIT_SKIP = new Set(['audit']);

export function createAuditedServer(
  server: McpServer,
  logger: AuditLogger
): McpServer {
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === 'registerTool') {
        return (name: string, config: unknown, handler: (params: Record<string, unknown>) => Promise<unknown>) => {
          if (AUDIT_SKIP.has(name)) {
            return target.registerTool(name, config as never, handler as never);
          }

          const wrappedHandler = async (params: Record<string, unknown>) => {
            const start = Date.now();
            try {
              const result = await handler(params);
              logger.log({
                timestamp: new Date().toISOString(),
                tool: name,
                params: sanitizeParams(params),
                status: 'success',
                durationMs: Date.now() - start,
              });
              return result;
            } catch (err) {
              logger.log({
                timestamp: new Date().toISOString(),
                tool: name,
                params: sanitizeParams(params),
                status: 'error',
                durationMs: Date.now() - start,
                error: err instanceof Error ? err.message : String(err),
              });
              throw err;
            }
          };

          return target.registerTool(name, config as never, wrappedHandler as never);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 500) {
      clean[key] = value.slice(0, 500) + '...(truncated)';
    } else {
      clean[key] = value;
    }
  }
  return clean;
}
