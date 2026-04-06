# MCP BindPlane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP server that exposes the full BindPlane REST API (~67 tools) to AI assistants.

**Architecture:** TypeScript MCP server using stdio transport. Modular design with one file per API domain in `src/tools/`. A central `BindPlaneClient` handles HTTP + auth. Each tool module exports a `register(server, client)` function.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk`, `zod/v4`, `vitest`

**Spec:** `docs/superpowers/specs/2026-04-06-mcp-bindplane-design.md`

**BindPlane API docs:** `bindplane-docs-complete.md` (local file, 127 pages)

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/angels/Documents/Projects/mcpbindplane
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "mcp-bindplane",
  "version": "0.1.0",
  "description": "MCP server for BindPlane observability pipeline management",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "mcp-bindplane": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["mcp", "bindplane", "observability", "opentelemetry"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.tgz
.env
```

- [ ] **Step 5: Install dependencies**

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D typescript tsx @types/node vitest
```

Note: If `@modelcontextprotocol/sdk` does not export `McpServer` and `StdioServerTransport` directly, try `@modelcontextprotocol/server` instead. Check with:
```bash
node -e "import('@modelcontextprotocol/sdk').then(m => console.log(Object.keys(m)))"
```

- [ ] **Step 6: Create src directory structure**

```bash
mkdir -p src/tools
```

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: project scaffolding"
```

---

### Task 2: Authentication module

**Files:**
- Create: `src/auth.ts`
- Create: `src/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAuthHeaders } from './auth.js';

describe('getAuthHeaders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BINDPLANE_API_KEY;
    delete process.env.BINDPLANE_USERNAME;
    delete process.env.BINDPLANE_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns API key header when BINDPLANE_API_KEY is set', () => {
    process.env.BINDPLANE_API_KEY = 'test-key-123';
    const headers = getAuthHeaders();
    expect(headers).toEqual({ 'X-Bindplane-Api-Key': 'test-key-123' });
  });

  it('returns Basic auth header when username and password are set', () => {
    process.env.BINDPLANE_USERNAME = 'admin';
    process.env.BINDPLANE_PASSWORD = 'secret';
    const headers = getAuthHeaders();
    const expected = Buffer.from('admin:secret').toString('base64');
    expect(headers).toEqual({ 'Authorization': `Basic ${expected}` });
  });

  it('prefers API key when both methods are configured', () => {
    process.env.BINDPLANE_API_KEY = 'test-key-123';
    process.env.BINDPLANE_USERNAME = 'admin';
    process.env.BINDPLANE_PASSWORD = 'secret';
    const headers = getAuthHeaders();
    expect(headers).toEqual({ 'X-Bindplane-Api-Key': 'test-key-123' });
  });

  it('throws when no auth is configured', () => {
    expect(() => getAuthHeaders()).toThrow('No authentication configured');
  });

  it('throws when only username is set without password', () => {
    process.env.BINDPLANE_USERNAME = 'admin';
    expect(() => getAuthHeaders()).toThrow('BINDPLANE_PASSWORD is required');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/auth.test.ts
```

Expected: FAIL — module `./auth.js` not found.

- [ ] **Step 3: Write the implementation**

Create `src/auth.ts`:

```typescript
export function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.BINDPLANE_API_KEY;
  const username = process.env.BINDPLANE_USERNAME;
  const password = process.env.BINDPLANE_PASSWORD;

  if (apiKey) {
    return { 'X-Bindplane-Api-Key': apiKey };
  }

  if (username) {
    if (!password) {
      throw new Error(
        'BINDPLANE_PASSWORD is required when BINDPLANE_USERNAME is set'
      );
    }
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  throw new Error(
    'No authentication configured. Set BINDPLANE_API_KEY or BINDPLANE_USERNAME + BINDPLANE_PASSWORD'
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/auth.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/auth.ts src/auth.test.ts
git commit -m "feat: add authentication module with API key and basic auth support"
```

---

### Task 3: HTTP client module

**Files:**
- Create: `src/client.ts`
- Create: `src/client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BindPlaneClient } from './client.js';

describe('BindPlaneClient', () => {
  let client: BindPlaneClient;

  beforeEach(() => {
    client = new BindPlaneClient('http://localhost:3001', {
      'X-Bindplane-Api-Key': 'test-key',
    });
  });

  it('makes GET requests with correct URL and headers', async () => {
    const mockResponse = { agents: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await client.get('/v1/agents');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/agents',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Bindplane-Api-Key': 'test-key',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('appends query params to GET requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    await client.get('/v1/agents', { query: 'status:Connected' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/agents?query=status%3AConnected',
      expect.anything()
    );
  });

  it('makes POST requests with JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      })
    );

    const body = { name: 'test' };
    await client.post('/v1/apply', body);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/apply',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws on non-2xx responses with error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('{"error":"invalid api key"}'),
      })
    );

    await expect(client.get('/v1/agents')).rejects.toThrow(
      'BindPlane API error 401'
    );
  });

  it('strips trailing slash from base URL', () => {
    const c = new BindPlaneClient('http://localhost:3001/', {});
    // Internal state check via a request
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );
    c.get('/v1/version');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/v1/version',
      expect.anything()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/client.test.ts
```

Expected: FAIL — module `./client.js` not found.

- [ ] **Step 3: Write the implementation**

Create `src/client.ts`:

```typescript
export class BindPlaneClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(
    baseUrl: string,
    authHeaders: Record<string, string>,
    options?: { timeout?: number }
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.headers = {
      ...authHeaders,
      'Content-Type': 'application/json',
    };
    this.timeout = options?.timeout ?? 30_000;
  }

  async get<T = unknown>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>('GET', url);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', `${this.baseUrl}${path}`, body);
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', `${this.baseUrl}${path}`, body);
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', `${this.baseUrl}${path}`, body);
  }

  async delete<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('DELETE', `${this.baseUrl}${path}`, body);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `BindPlane API error ${response.status} (${response.statusText}): ${errorBody}`
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/client.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client.ts src/client.test.ts
git commit -m "feat: add HTTP client with timeout and error handling"
```

---

### Task 4: Entry point (index.ts)

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create minimal entry point**

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getAuthHeaders } from './auth.js';
import { BindPlaneClient } from './client.js';

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

  // Tool modules will be registered here as they are implemented
  // registerSystemTools(server, client);
  // registerAgentTools(server, client);
  // ...

  const transport = new StdioServerTransport();
  server.connect(transport);
}

main();
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. If the import paths for `@modelcontextprotocol/sdk` differ, check with:
```bash
ls node_modules/@modelcontextprotocol/sdk/dist/
```
Adjust the import subpaths accordingly (e.g., `@modelcontextprotocol/sdk/server/mcp.js`).

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with env validation and server setup"
```

---

### Task 5: System tools (validate pattern)

**Files:**
- Create: `src/tools/system.ts`
- Create: `src/tools/system.test.ts`

This is the simplest module (4 tools). It validates the tool registration pattern before we build the rest.

- [ ] **Step 1: Write the failing test**

Create `src/tools/system.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSystemTools } from './system.js';
import { BindPlaneClient } from '../client.js';

function createMockClient() {
  return {
    get: vi.fn().mockResolvedValue({ version: '1.98.2' }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  } as unknown as BindPlaneClient;
}

describe('system tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerSystemTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/tools/system.test.ts
```

Expected: FAIL — module `./system.js` not found.

- [ ] **Step 3: Write the implementation**

Create `src/tools/system.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerSystemTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'get-version',
    {
      description: 'Get the BindPlane server version',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/version');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-audit-events',
    {
      description: 'List audit events. Filterable by configuration, user, and date range.',
      inputSchema: z.object({
        configuration: z.string().optional().describe('Filter by configuration name'),
        user: z.string().optional().describe('Filter by user display name'),
        minDate: z.string().optional().describe('Minimum date (YYYYMMDDHHMMSS)'),
        maxDate: z.string().optional().describe('Maximum date (YYYYMMDDHHMMSS)'),
      }),
    },
    async ({ configuration, user, minDate, maxDate }) => {
      const params: Record<string, string> = {};
      if (configuration) params.configuration = configuration;
      if (user) params.user = user;
      if (minDate) params.minDate = minDate;
      if (maxDate) params.maxDate = maxDate;
      const result = await client.get('/v1/audit-events', Object.keys(params).length > 0 ? params : undefined);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'download-audit-events',
    {
      description: 'Download audit events as CSV',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/audit-events/download');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-available-components',
    {
      description: 'List available components for collector distributions',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/available-components');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 4: Wire into index.ts**

Update `src/index.ts` — uncomment the system tools import and add:

```typescript
import { registerSystemTools } from './tools/system.js';
```

And inside `main()`, replace the comment with:

```typescript
registerSystemTools(server, client);
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/tools/system.test.ts
```

Expected: PASS.

- [ ] **Step 6: Verify full build compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/tools/system.ts src/tools/system.test.ts src/index.ts
git commit -m "feat: add system tools (version, audit-events, available-components)"
```

---

### Task 6: Agent tools

**Files:**
- Create: `src/tools/agents.ts`
- Create: `src/tools/agents.test.ts`
- Modify: `src/index.ts` (add import + registration)

- [ ] **Step 1: Write the test**

Create `src/tools/agents.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAgentTools } from './agents.js';
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

describe('agent tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerAgentTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/agents.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerAgentTools(server: McpServer, client: BindPlaneClient) {
  // --- Agents ---

  server.registerTool(
    'list-agents',
    {
      description: 'List agents. Supports BindPlane query syntax for filtering (e.g., status:Connected platform:linux environment:production).',
      inputSchema: z.object({
        query: z.string().optional().describe('BindPlane query syntax filter (e.g., "status:Connected platform:linux")'),
      }),
    },
    async ({ query }) => {
      const params = query ? { query } : undefined;
      const result = await client.get('/v1/agents', params);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent',
    {
      description: 'Get details of a specific agent by ID',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-configuration',
    {
      description: 'Get the current configuration assigned to an agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}/configuration`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-labels',
    {
      description: 'Get labels for a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.get(`/v1/agents/${encodeURIComponent(id)}/labels`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-agent-labels',
    {
      description: 'Update labels for a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
        labels: z.record(z.string(), z.string()).describe('Labels to set as key-value pairs'),
        overwrite: z.boolean().optional().describe('If true, replace all labels. If false, merge with existing.'),
      }),
    },
    async ({ id, labels, overwrite }) => {
      const result = await client.patch(`/v1/agents/${encodeURIComponent(id)}/labels`, { labels, overwrite });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'bulk-update-agent-labels',
    {
      description: 'Update labels for multiple agents at once',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs'),
        labels: z.record(z.string(), z.string()).describe('Labels to set as key-value pairs'),
        overwrite: z.boolean().optional().describe('If true, replace all labels. If false, merge.'),
      }),
    },
    async ({ agentIds, labels, overwrite }) => {
      const result = await client.patch('/v1/agents/labels', { ids: agentIds, labels, overwrite });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-agent-version',
    {
      description: 'Upgrade a specific agent to a new version',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
        version: z.string().describe('Target version'),
      }),
    },
    async ({ id, version }) => {
      const result = await client.post(`/v1/agents/${encodeURIComponent(id)}/version`, { version });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'bulk-update-agent-version',
    {
      description: 'Upgrade multiple agents to a new version',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs'),
        version: z.string().describe('Target version'),
      }),
    },
    async ({ agentIds, version }) => {
      const result = await client.patch('/v1/agents/version', { ids: agentIds, version });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'disconnect-agent',
    {
      description: 'Disconnect a specific agent',
      inputSchema: z.object({
        id: z.string().describe('Agent ID'),
      }),
    },
    async ({ id }) => {
      const result = await client.post(`/v1/agents/${encodeURIComponent(id)}/disconnect`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-agents',
    {
      description: 'Delete one or more agents',
      inputSchema: z.object({
        agentIds: z.array(z.string()).describe('List of agent IDs to delete'),
      }),
    },
    async ({ agentIds }) => {
      const result = await client.delete('/v1/agents', { ids: agentIds });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Agent Types ---

  server.registerTool(
    'list-agent-types',
    {
      description: 'List available agent types',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/agent-types');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-type',
    {
      description: 'Get details of a specific agent type',
      inputSchema: z.object({
        name: z.string().describe('Agent type name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/agent-type/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Agent Versions ---

  server.registerTool(
    'list-agent-versions',
    {
      description: 'List available agent versions',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/agent-versions');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-agent-version',
    {
      description: 'Get details of a specific agent version',
      inputSchema: z.object({
        name: z.string().describe('Agent version name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/agent-version/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-install-command',
    {
      description: 'Get the install command for a specific agent type and version',
      inputSchema: z.object({
        type: z.string().describe('Agent type (e.g., observiq-otel-collector)'),
        version: z.string().describe('Agent version'),
      }),
    },
    async ({ type, version }) => {
      const result = await client.get(`/v1/agent-versions/${encodeURIComponent(type)}/${encodeURIComponent(version)}/install-command`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerAgentTools } from './tools/agents.js';
```

And in `main()`:

```typescript
registerAgentTools(server, client);
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/tools/agents.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/tools/agents.ts src/tools/agents.test.ts src/index.ts
git commit -m "feat: add agent tools (list, get, labels, versions, disconnect, delete)"
```

---

### Task 7: Configuration tools

**Files:**
- Create: `src/tools/configurations.ts`
- Create: `src/tools/configurations.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/configurations.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConfigurationTools } from './configurations.js';
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

describe('configuration tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerConfigurationTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/configurations.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerConfigurationTools(server: McpServer, client: BindPlaneClient) {
  // --- Configurations ---

  server.registerTool(
    'list-configurations',
    {
      description: 'List all configurations',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/configurations');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-configuration',
    {
      description: 'Get a configuration by name',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/configurations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'copy-configuration',
    {
      description: 'Make a copy of a configuration',
      inputSchema: z.object({
        name: z.string().describe('Source configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/configurations/${encodeURIComponent(name)}/copy`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'revert-configuration',
    {
      description: 'Revert a configuration to its last deployed version',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/configurations/${encodeURIComponent(name)}/revert`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-configuration',
    {
      description: 'Delete a configuration',
      inputSchema: z.object({
        name: z.string().describe('Configuration name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/configurations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Sources ---

  server.registerTool(
    'list-sources',
    {
      description: 'List all source instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/sources');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-source',
    {
      description: 'Get a source instance by name',
      inputSchema: z.object({
        name: z.string().describe('Source name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/sources/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-source',
    {
      description: 'Delete a source instance',
      inputSchema: z.object({
        name: z.string().describe('Source name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/sources/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Destinations ---

  server.registerTool(
    'list-destinations',
    {
      description: 'List all destination instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/destinations');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-destination',
    {
      description: 'Get a destination instance by name',
      inputSchema: z.object({
        name: z.string().describe('Destination name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/destinations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-destination',
    {
      description: 'Delete a destination instance',
      inputSchema: z.object({
        name: z.string().describe('Destination name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/destinations/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Processors ---

  server.registerTool(
    'list-processors',
    {
      description: 'List all processor instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/processors');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-processor',
    {
      description: 'Get a processor instance by name',
      inputSchema: z.object({
        name: z.string().describe('Processor name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/processors/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-processor',
    {
      description: 'Delete a processor instance',
      inputSchema: z.object({
        name: z.string().describe('Processor name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/processors/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // --- Extensions ---

  server.registerTool(
    'list-extensions',
    {
      description: 'List all extension instances',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/extensions');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-extension',
    {
      description: 'Get an extension instance by name',
      inputSchema: z.object({
        name: z.string().describe('Extension name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/extensions/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-extension',
    {
      description: 'Delete an extension instance',
      inputSchema: z.object({
        name: z.string().describe('Extension name'),
      }),
    },
    async ({ name }) => {
      const result = await client.delete(`/v1/extensions/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerConfigurationTools } from './tools/configurations.js';
```

And in `main()`:

```typescript
registerConfigurationTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/configurations.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/configurations.ts src/tools/configurations.test.ts src/index.ts
git commit -m "feat: add configuration, source, destination, processor, extension tools"
```

---

### Task 8: Component type tools

**Files:**
- Create: `src/tools/component-types.ts`
- Create: `src/tools/component-types.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/component-types.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerComponentTypeTools } from './component-types.js';
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

describe('component type tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerComponentTypeTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/component-types.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerComponentTypeTools(server: McpServer, client: BindPlaneClient) {
  const typeEndpoints = [
    { prefix: 'source-type', path: '/v1/source-types', singular: '/v1/source-types', label: 'source type' },
    { prefix: 'destination-type', path: '/v1/destination-types', singular: '/v1/destination-types', label: 'destination type' },
    { prefix: 'processor-type', path: '/v1/processor-types', singular: '/v1/processor-types', label: 'processor type' },
    { prefix: 'extension-type', path: '/v1/extension-types', singular: '/v1/extension-types', label: 'extension type' },
    { prefix: 'recommendation-type', path: '/v1/recommendation-types', singular: '/v1/recommendation-types', label: 'recommendation type' },
  ];

  for (const { prefix, path, singular, label } of typeEndpoints) {
    server.registerTool(
      `list-${prefix}s`,
      {
        description: `List all available ${label}s (component definitions)`,
        inputSchema: z.object({}),
      },
      async () => {
        const result = await client.get(path);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.registerTool(
      `get-${prefix}`,
      {
        description: `Get details of a specific ${label} by name`,
        inputSchema: z.object({
          name: z.string().describe(`${label} name`),
        }),
      },
      async ({ name }) => {
        const result = await client.get(`${singular}/${encodeURIComponent(name)}`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      }
    );
  }
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerComponentTypeTools } from './tools/component-types.js';
```

And in `main()`:

```typescript
registerComponentTypeTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/component-types.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/component-types.ts src/tools/component-types.test.ts src/index.ts
git commit -m "feat: add component type tools (source, destination, processor, extension, recommendation types)"
```

---

### Task 9: Rollout tools

**Files:**
- Create: `src/tools/rollouts.ts`
- Create: `src/tools/rollouts.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/rollouts.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRolloutTools } from './rollouts.js';
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

describe('rollout tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerRolloutTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/rollouts.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerRolloutTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'list-rollouts',
    {
      description: 'List all rollouts',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/rollouts');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create-rollout',
    {
      description: 'Create a new rollout for a configuration',
      inputSchema: z.object({
        name: z.string().describe('Configuration name to create rollout for'),
      }),
    },
    async ({ name }) => {
      const result = await client.post('/v1/rollouts', { name });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-rollout',
    {
      description: 'Get details of a specific rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/rollouts/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-rollout-status',
    {
      description: 'Get the status of a rollout (how many agents updated, errors, etc.)',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.get(`/v1/rollouts/${encodeURIComponent(name)}/status`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'start-rollout',
    {
      description: 'Start deploying a rollout to agents. Rolls out incrementally: 3 agents first, then batches of 5x more every 5 seconds, up to 100.',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/rollouts/${encodeURIComponent(name)}/start`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update-rollout',
    {
      description: 'Update a rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.post(`/v1/rollouts/${encodeURIComponent(name)}/update`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'pause-rollout',
    {
      description: 'Pause an in-progress rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/rollouts/${encodeURIComponent(name)}/pause`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'resume-rollout',
    {
      description: 'Resume a paused rollout',
      inputSchema: z.object({
        name: z.string().describe('Rollout name'),
      }),
    },
    async ({ name }) => {
      const result = await client.put(`/v1/rollouts/${encodeURIComponent(name)}/resume`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerRolloutTools } from './tools/rollouts.js';
```

And in `main()`:

```typescript
registerRolloutTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/rollouts.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/rollouts.ts src/tools/rollouts.test.ts src/index.ts
git commit -m "feat: add rollout tools (create, start, pause, resume, status)"
```

---

### Task 10: Fleet tools

**Files:**
- Create: `src/tools/fleets.ts`
- Create: `src/tools/fleets.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/fleets.test.ts`:

```typescript
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
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/fleets.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerFleetTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'list-fleets',
    {
      description: 'List all fleets. Fleets group agents and assign shared configurations.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/v1/fleets');
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerFleetTools } from './tools/fleets.js';
```

And in `main()`:

```typescript
registerFleetTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/fleets.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/fleets.ts src/tools/fleets.test.ts src/index.ts
git commit -m "feat: add fleet tools"
```

---

### Task 11: Generic resource tools

**Files:**
- Create: `src/tools/resources.ts`
- Create: `src/tools/resources.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/resources.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResourceTools } from './resources.js';
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

describe('resource tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerResourceTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/resources.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { BindPlaneClient } from '../client.js';

export function registerResourceTools(server: McpServer, client: BindPlaneClient) {
  server.registerTool(
    'apply-resources',
    {
      description: 'Create or update BindPlane resources (like kubectl apply). Accepts a resource definition with apiVersion, kind, metadata, and spec. Use apiVersion "bindplane.observiq.com/v1". Supported kinds: Configuration, Source, Destination, Processor, Extension, Fleet, etc.',
      inputSchema: z.object({
        resources: z.array(z.record(z.string(), z.unknown())).describe(
          'Array of resource objects. Each must have apiVersion, kind, metadata.name, and spec.'
        ),
      }),
    },
    async ({ resources }) => {
      const result = await client.post('/v1/apply', { resources });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete-resources',
    {
      description: 'Delete BindPlane resources by providing resource definitions',
      inputSchema: z.object({
        resources: z.array(z.record(z.string(), z.unknown())).describe(
          'Array of resource objects to delete. Each must have apiVersion, kind, and metadata.name.'
        ),
      }),
    },
    async ({ resources }) => {
      const result = await client.post('/v1/delete', { resources });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'list-resources-by-kind',
    {
      description: 'List all resources of a specific kind (e.g., Configuration, Source, Destination)',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind (e.g., Configuration, Source, Destination, Processor, Extension)'),
      }),
    },
    async ({ kind }) => {
      const result = await client.get(`/v1/resources/${encodeURIComponent(kind)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-resource',
    {
      description: 'Get a specific resource by kind and name',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind'),
        name: z.string().describe('Resource name'),
      }),
    },
    async ({ kind, name }) => {
      const result = await client.get(`/v1/resources/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get-resource-history',
    {
      description: 'Get the change history of a resource',
      inputSchema: z.object({
        kind: z.string().describe('Resource kind'),
        name: z.string().describe('Resource name'),
      }),
    },
    async ({ kind, name }) => {
      const result = await client.get(`/v1/${encodeURIComponent(kind)}/${encodeURIComponent(name)}/history`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerResourceTools } from './tools/resources.js';
```

And in `main()`:

```typescript
registerResourceTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/resources.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/resources.ts src/tools/resources.test.ts src/index.ts
git commit -m "feat: add generic resource tools (apply, delete, list-by-kind, history)"
```

---

### Task 12: Admin tools

**Files:**
- Create: `src/tools/admin.ts`
- Create: `src/tools/admin.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the test**

Create `src/tools/admin.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdminTools } from './admin.js';
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

describe('admin tools', () => {
  it('registers without error', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const client = createMockClient();
    expect(() => registerAdminTools(server, client)).not.toThrow();
  });
});
```

- [ ] **Step 2: Write the implementation**

Create `src/tools/admin.ts`:

```typescript
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
```

- [ ] **Step 3: Wire into index.ts**

Add to `src/index.ts`:

```typescript
import { registerAdminTools } from './tools/admin.js';
```

And in `main()`:

```typescript
registerAdminTools(server, client);
```

- [ ] **Step 4: Run tests and verify build**

```bash
npx vitest run src/tools/admin.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/tools/admin.ts src/tools/admin.test.ts src/index.ts
git commit -m "feat: add admin tools (accounts, organizations, projects, users, secret-keys)"
```

---

### Task 13: Final index.ts, README, and package finalization

**Files:**
- Modify: `src/index.ts` (final version with all imports)
- Create: `README.md`

- [ ] **Step 1: Verify index.ts has all imports**

The final `src/index.ts` should look like:

```typescript
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
```

- [ ] **Step 2: Create README.md**

```markdown
# mcp-bindplane

MCP server for [BindPlane](https://docs.bindplane.com/) observability pipeline management.

Exposes the full BindPlane REST API (~67 tools) to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/).

## Installation

```bash
npx mcp-bindplane
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BINDPLANE_URL` | Yes | BindPlane server URL (e.g., `http://localhost:3001`) |
| `BINDPLANE_API_KEY` | * | API key for authentication |
| `BINDPLANE_USERNAME` | * | Username for Basic Auth |
| `BINDPLANE_PASSWORD` | * | Password for Basic Auth |
| `BINDPLANE_TIMEOUT` | No | Request timeout in ms (default: 30000) |

\* Either `BINDPLANE_API_KEY` or `BINDPLANE_USERNAME` + `BINDPLANE_PASSWORD` must be set.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bindplane": {
      "command": "npx",
      "args": ["-y", "mcp-bindplane"],
      "env": {
        "BINDPLANE_URL": "http://localhost:3001",
        "BINDPLANE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Agents
`list-agents`, `get-agent`, `get-agent-configuration`, `get-agent-labels`, `update-agent-labels`, `bulk-update-agent-labels`, `update-agent-version`, `bulk-update-agent-version`, `disconnect-agent`, `delete-agents`, `list-agent-types`, `get-agent-type`, `list-agent-versions`, `get-agent-version`, `get-install-command`

### Configurations
`list-configurations`, `get-configuration`, `copy-configuration`, `revert-configuration`, `delete-configuration`, `list-sources`, `get-source`, `delete-source`, `list-destinations`, `get-destination`, `delete-destination`, `list-processors`, `get-processor`, `delete-processor`, `list-extensions`, `get-extension`, `delete-extension`

### Component Types
`list-source-types`, `get-source-type`, `list-destination-types`, `get-destination-type`, `list-processor-types`, `get-processor-type`, `list-extension-types`, `get-extension-type`, `list-recommendation-types`, `get-recommendation-type`

### Rollouts
`list-rollouts`, `create-rollout`, `get-rollout`, `get-rollout-status`, `start-rollout`, `update-rollout`, `pause-rollout`, `resume-rollout`

### Fleets
`list-fleets`

### Resources (Generic)
`apply-resources`, `delete-resources`, `list-resources-by-kind`, `get-resource`, `get-resource-history`

### Admin
`list-accounts`, `get-account`, `create-account`, `update-account`, `delete-account`, `list-organizations`, `get-organization`, `create-organization`, `delete-organization`, `get-organization-accounts`, `get-organization-projects`, `get-organization-users`, `list-projects`, `get-project`, `create-project`, `delete-project`, `list-users`, `create-user`, `delete-user`, `list-secret-keys`, `create-secret-key`, `delete-secret-key`

### System
`get-version`, `list-audit-events`, `download-audit-events`, `list-available-components`

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 4: Full build**

```bash
npx tsc
```

Expected: No errors. `dist/` directory created.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts README.md
git commit -m "feat: complete MCP server with README and all tool modules"
```
