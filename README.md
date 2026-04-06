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
| `BINDPLANE_TLS_SKIP_VERIFY` | No | Skip TLS verification (default: false) |
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
