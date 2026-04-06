# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MCP server for BindPlane observability pipeline management. Exposes the full BindPlane REST API (9 consolidated tools, 84 actions) to AI assistants via the Model Context Protocol. Written in TypeScript, distributed as an npm package (`mcp-bindplane`).

## Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Run with tsx (hot reload)
npm start          # Run compiled version
npm test           # Run all tests (vitest)
npm run test:watch # Watch mode
npx vitest run src/tools/agents.test.ts  # Single test file
npx tsc --noEmit   # Type-check without emitting
```

## Architecture

```
src/
├── index.ts              # Entry point: env validation, client/server setup, tool registration
├── auth.ts               # Auth detection: BINDPLANE_API_KEY → X-Bindplane-Api-Key header,
│                         #   BINDPLANE_USERNAME+PASSWORD → Basic Auth. API key takes priority.
├── client.ts             # BindPlaneClient: HTTP wrapper with get/post/put/patch/delete,
│                         #   timeout (AbortController), error transformation
├── audit.ts              # AuditLogger + createAuditedServer: Proxy-based tool call logging
└── tools/                # One file per API domain, each exports register(server, client)
    ├── agents.ts         # 15 tools: agents + agent-types + agent-versions
    ├── configurations.ts # 17 tools: configs + sources + destinations + processors + extensions
    ├── component-types.ts# 10 tools: source/dest/processor/extension/recommendation types (loop pattern)
    ├── rollouts.ts       # 8 tools: rollout lifecycle (create, start, pause, resume, status)
    ├── fleets.ts         # 1 tool: list-fleets
    ├── resources.ts      # 5 tools: apply-resources (kubectl-like), delete, list-by-kind, get, history
    ├── admin.ts          # 22 tools: accounts, organizations, projects, users, secret-keys
    ├── system.ts         # 4 tools: version, audit-events, available-components
    └── audit.ts          # 2 tools: get-action-report, clear-action-report
```

**Key pattern:** Every tool module exports a `registerXxxTools(server: McpServer, client: BindPlaneClient)` function that registers ONE consolidated tool with an `action` enum parameter. Each handler uses a switch statement to route actions to the correct API call. This keeps the total tool count at 9 (vs 84 individual tools) to stay within MCP client tool limits.

**audit.ts** (src/) uses a Proxy on McpServer to intercept `registerTool` and automatically log every tool invocation. The audit tool itself is excluded from logging via `AUDIT_SKIP`.

## Environment Variables

- `BINDPLANE_URL` (required) — Base URL for BindPlane server
- `BINDPLANE_API_KEY` or `BINDPLANE_USERNAME`+`BINDPLANE_PASSWORD` (one required) — Auth
- `BINDPLANE_TLS_SKIP_VERIFY` — Sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed certs
- `BINDPLANE_TIMEOUT` — HTTP timeout in ms (default 30000)

## BindPlane API Reference

The file `bindplane-docs-complete.md` (511KB, 127 pages) contains the complete BindPlane documentation scraped from docs.bindplane.com. Consult it for API endpoint details, query syntax, and resource YAML formats. Key sections:
- PAGE 4: Full API endpoint reference
- PAGE 28: Query syntax for filtering agents (`status:Connected platform:linux`)
- PAGE 29: Fleets (agent grouping with shared configs)
- PAGE 44: Rollouts (incremental config deployment)
- PAGE 69: GitOps workflow and `apply` resource format (`apiVersion: bindplane.observiq.com/v1`)

## MCP SDK

Uses `@modelcontextprotocol/sdk` with imports from:
- `@modelcontextprotocol/sdk/server/mcp.js` — McpServer
- `@modelcontextprotocol/sdk/server/stdio.js` — StdioServerTransport
- `zod/v4` — Input schema validation (zod v4 subpath import)
