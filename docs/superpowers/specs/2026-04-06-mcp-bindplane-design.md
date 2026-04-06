# MCP BindPlane Server — Design Spec

## Overview

An MCP (Model Context Protocol) server that exposes the full BindPlane REST API to AI assistants. Supports both BindPlane OP (open source) and BindPlane Enterprise. Distributed as an npm package (`mcp-bindplane`).

**Approach:** Tools-only (no MCP resources or prompts in MVP). Every BindPlane API endpoint maps to an MCP tool.

## Architecture

```
mcpbindplane/
├── src/
│   ├── index.ts                # Entry point: validates env, creates client, registers tools, connects stdio
│   ├── client.ts               # BindPlaneClient: generic HTTP client (get, post, put, patch, delete)
│   ├── auth.ts                 # Auth detection: API Key or Basic Auth from env vars
│   ├── types/
│   │   ├── agents.ts           # Types for agents, agent-types, agent-versions
│   │   ├── configurations.ts   # Types for configs, sources, destinations, processors, extensions
│   │   ├── rollouts.ts         # Types for rollouts
│   │   ├── fleets.ts           # Types for fleets
│   │   ├── admin.ts            # Types for accounts, orgs, projects, users, secret-keys
│   │   └── system.ts           # Types for version, audit-events, available-components
│   └── tools/
│       ├── agents.ts           # ~15 tools: agents + agent-types + agent-versions
│       ├── configurations.ts   # ~17 tools: configurations + sources + destinations + processors + extensions
│       ├── component-types.ts  # ~10 tools: source-types, destination-types, processor-types, etc.
│       ├── rollouts.ts         # ~7 tools: create, get, start, pause, resume, update, status
│       ├── fleets.ts           # ~1 tool: list fleets
│       ├── resources.ts        # ~5 tools: apply, delete, list-by-kind, get-by-kind, history
│       ├── admin.ts            # ~18 tools: accounts, orgs, projects, users, secret-keys
│       └── system.ts           # ~4 tools: version, audit-events, available-components
├── package.json
├── tsconfig.json
└── README.md
```

**Pattern:** Each file in `tools/` exports a `register(server: McpServer, client: BindPlaneClient)` function that registers its tools. `index.ts` calls them all.

## HTTP Client (`client.ts`)

A `BindPlaneClient` class that centralizes all HTTP calls to BindPlane's REST API.

```typescript
class BindPlaneClient {
  constructor(baseUrl: string, authHeaders: Record<string, string>, options?: { timeout?: number; tlsSkipVerify?: boolean })

  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string, body?: unknown): Promise<T>
}
```

All non-2xx responses are transformed into readable error messages including the HTTP status code and the BindPlane error body.

## Authentication (`auth.ts`)

Auto-detection based on environment variables:

| Variables present | Method | Header |
|---|---|---|
| `BINDPLANE_API_KEY` | API Key | `X-Bindplane-Api-Key: <key>` |
| `BINDPLANE_USERNAME` + `BINDPLANE_PASSWORD` | Basic Auth | `Authorization: Basic <base64>` |
| Both | API Key takes priority | — |
| Neither | Fail at startup with clear message | — |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `BINDPLANE_URL` | Yes | — | Base URL (e.g., `http://localhost:3001` or `https://app.bindplane.com`) |
| `BINDPLANE_API_KEY` | Conditional | — | API Key (header `X-Bindplane-Api-Key`) |
| `BINDPLANE_USERNAME` | Conditional | — | Username for Basic Auth |
| `BINDPLANE_PASSWORD` | Conditional | — | Password for Basic Auth |
| `BINDPLANE_TLS_SKIP_VERIFY` | No | `false` | Skip TLS verification (self-hosted with self-signed certs) |
| `BINDPLANE_TIMEOUT` | No | `30000` | Request timeout in ms |

## Tool Catalog

### `tools/agents.ts` — Agents, Agent Types, Agent Versions

| Tool | Method | Endpoint | Key Params |
|---|---|---|---|
| `list-agents` | GET | `/v1/agents` | `query` (e.g., `status:Connected platform:linux`) |
| `get-agent` | GET | `/v1/agents/{id}` | `id` |
| `get-agent-configuration` | GET | `/v1/agents/{id}/configuration` | `id` |
| `get-agent-labels` | GET | `/v1/agents/{id}/labels` | `id` |
| `update-agent-labels` | PATCH | `/v1/agents/{id}/labels` | `id`, `labels` |
| `bulk-update-agent-labels` | PATCH | `/v1/agents/labels` | `agentIds`, `labels`, `overwrite` |
| `update-agent-version` | POST | `/v1/agents/{id}/version` | `id`, `version` |
| `bulk-update-agent-version` | PATCH | `/v1/agents/version` | `agentIds`, `version` |
| `disconnect-agent` | POST | `/v1/agents/{id}/disconnect` | `id` |
| `delete-agents` | DELETE | `/v1/agents` | `agentIds` |
| `list-agent-types` | GET | `/v1/agent-types` | — |
| `get-agent-type` | GET | `/v1/agent-type/{name}` | `name` |
| `list-agent-versions` | GET | `/v1/agent-versions` | — |
| `get-agent-version` | GET | `/v1/agent-version/{name}` | `name` |
| `get-install-command` | GET | `/v1/agent-versions/{type}/{version}/install-command` | `type`, `version` |

### `tools/configurations.ts` — Configurations, Sources, Destinations, Processors, Extensions

| Tool | Method | Endpoint |
|---|---|---|
| `list-configurations` | GET | `/v1/configurations` |
| `get-configuration` | GET | `/v1/configurations/{name}` |
| `copy-configuration` | POST | `/v1/configurations/{name}/copy` |
| `revert-configuration` | PUT | `/v1/configurations/{name}/revert` |
| `delete-configuration` | DELETE | `/v1/configurations/{name}` |
| `list-sources` | GET | `/v1/sources` |
| `get-source` | GET | `/v1/sources/{name}` |
| `delete-source` | DELETE | `/v1/sources/{name}` |
| `list-destinations` | GET | `/v1/destinations` |
| `get-destination` | GET | `/v1/destinations/{name}` |
| `delete-destination` | DELETE | `/v1/destinations/{name}` |
| `list-processors` | GET | `/v1/processors` |
| `get-processor` | GET | `/v1/processors/{name}` |
| `delete-processor` | DELETE | `/v1/processors/{name}` |
| `list-extensions` | GET | `/v1/extensions` |
| `get-extension` | GET | `/v1/extensions/{name}` |
| `delete-extension` | DELETE | `/v1/extensions/{name}` |

### `tools/component-types.ts` — Type Definitions

| Tool | Method | Endpoint |
|---|---|---|
| `list-source-types` | GET | `/v1/source-types` |
| `get-source-type` | GET | `/v1/source-types/{name}` |
| `list-destination-types` | GET | `/v1/destination-types` |
| `get-destination-type` | GET | `/v1/destination-types/{name}` |
| `list-processor-types` | GET | `/v1/processor-types` |
| `get-processor-type` | GET | `/v1/processor-types/{name}` |
| `list-extension-types` | GET | `/v1/extension-types` |
| `get-extension-type` | GET | `/v1/extension-types/{name}` |
| `list-recommendation-types` | GET | `/v1/recommendation-types` |
| `get-recommendation-type` | GET | `/v1/recommendation-types/{name}` |

### `tools/rollouts.ts` — Rollout Management

| Tool | Method | Endpoint |
|---|---|---|
| `list-rollouts` | GET | `/v1/rollouts` |
| `create-rollout` | POST | `/v1/rollouts` |
| `get-rollout` | GET | `/v1/rollouts/{name}` |
| `get-rollout-status` | GET | `/v1/rollouts/{name}/status` |
| `start-rollout` | POST | `/v1/rollouts/{name}/start` |
| `update-rollout` | POST | `/v1/rollouts/{name}/update` |
| `pause-rollout` | PUT | `/v1/rollouts/{name}/pause` |
| `resume-rollout` | PUT | `/v1/rollouts/{name}/resume` |

### `tools/fleets.ts` — Fleet Management

| Tool | Method | Endpoint |
|---|---|---|
| `list-fleets` | GET | `/v1/fleets` |

### `tools/resources.ts` — Generic Resource Operations

| Tool | Method | Endpoint | Description |
|---|---|---|---|
| `apply-resources` | POST | `/v1/apply` | Create/update any resource via JSON body (like `kubectl apply`). Accepts resource definitions with `apiVersion`, `kind`, `metadata`, `spec`. |
| `delete-resources` | POST | `/v1/delete` | Delete resources via JSON body |
| `list-resources-by-kind` | GET | `/v1/resources/{kind}` | List resources by kind |
| `get-resource` | GET | `/v1/resources/{kind}/{name}` | Get resource by kind and name |
| `get-resource-history` | GET | `/v1/{kind}/{name}/history` | Change history for a resource |

### `tools/admin.ts` — Accounts, Organizations, Projects, Users, Secret Keys

| Tool | Method | Endpoint |
|---|---|---|
| `list-accounts` | GET | `/v1/accounts` |
| `get-account` | GET | `/v1/accounts/{id}` |
| `create-account` | POST | `/v1/accounts` |
| `update-account` | PATCH | `/v1/accounts` |
| `delete-account` | DELETE | `/v1/accounts/{id}` |
| `list-organizations` | GET | `/v1/organizations` |
| `get-organization` | GET | `/v1/organizations/{name}` |
| `create-organization` | POST | `/v1/organizations` |
| `delete-organization` | DELETE | `/v1/organizations/{id}` |
| `get-organization-accounts` | GET | `/v1/organizations/accounts` |
| `get-organization-projects` | GET | `/v1/organizations/projects` |
| `get-organization-users` | GET | `/v1/organizations/users` |
| `list-projects` | GET | `/v1/projects` |
| `get-project` | GET | `/v1/projects/{id}` |
| `create-project` | POST | `/v1/projects` |
| `delete-project` | DELETE | `/v1/projects/{id}` |
| `list-users` | GET | `/v1/users` |
| `create-user` | POST | `/v1/users` |
| `delete-user` | DELETE | `/v1/users/{id}` |
| `list-secret-keys` | GET | `/v1/secret-keys` |
| `create-secret-key` | POST | `/v1/secret-keys` |
| `delete-secret-key` | DELETE | `/v1/secret-keys/{key}` |

### `tools/system.ts` — System & Audit

| Tool | Method | Endpoint |
|---|---|---|
| `get-version` | GET | `/v1/version` |
| `list-audit-events` | GET | `/v1/audit-events` |
| `download-audit-events` | GET | `/v1/audit-events/download` |
| `list-available-components` | GET | `/v1/available-components` |

**Total: ~67 tools**

## Query Syntax Support

List tools that support filtering (primarily `list-agents`) accept a `query` parameter using BindPlane's token-based query syntax:

```
[operator]name:value
```

Examples:
- `status:Connected` — Connected agents
- `platform:linux` — Linux agents
- `-environment:test` — Exclude test environment
- `status:Connected platform:linux environment:production` — Combined filters
- `hostname:web-*` — Wildcard matching

## Package Configuration

```json
{
  "name": "mcp-bindplane",
  "version": "0.1.0",
  "description": "MCP server for BindPlane observability pipeline management",
  "main": "dist/index.js",
  "bin": { "mcp-bindplane": "dist/index.js" },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "tsx": "latest",
    "@types/node": "latest"
  }
}
```

**Transport:** stdio (standard for local MCP servers via `npx`)

## Client Configuration Example

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

## Startup Flow

1. Validate environment variables (fail fast if no auth configured)
2. Create `BindPlaneClient` instance with base URL and auth headers
3. Create `McpServer` with name `"mcp-bindplane"` and version
4. Call `register(server, client)` from each tools module
5. Connect with `StdioServerTransport`
