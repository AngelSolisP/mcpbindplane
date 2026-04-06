# mcp-bindplane

MCP server para [BindPlane](https://docs.bindplane.com/) que permite gestionar tu infraestructura de observabilidad directamente desde tu asistente AI.

Expone la API REST completa de BindPlane (~82 tools) via [Model Context Protocol](https://modelcontextprotocol.io/).

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Una API Key de BindPlane (Cloud o Self-Hosted)

## Configuracion rapida

### 1. Obtener tu API Key de BindPlane

1. Entra a [app.bindplane.com](https://app.bindplane.com) (o tu instancia self-hosted)
2. Click en el menu de hamburguesa (arriba a la derecha) > **Project Settings**
3. En la seccion **API Keys**, click en **Create API Key**
4. Copia la key — solo se muestra una vez

### 2. Configurar en tu editor/cliente AI

#### Google Antigravity

1. Abre Antigravity
2. Click en **Agent session** > **"..."** > **MCP Servers**
3. Click en **Manage MCP Servers** > **View raw config**
4. Agrega la siguiente configuracion en el archivo `mcp_config.json`:

```json
{
  "mcpServers": {
    "bindplane": {
      "command": "npx",
      "args": ["-y", "github:AngelSolisP/mcpbindplane"],
      "env": {
        "BINDPLANE_URL": "https://app.bindplane.com",
        "BINDPLANE_API_KEY": "TU-API-KEY"
      }
    }
  }
}
```

5. Guarda el archivo y reinicia la sesion del agente

> Si ya tienes otros MCP servers configurados, solo agrega el bloque `"bindplane": {...}` dentro del `mcpServers` existente.

#### Claude Desktop

Agrega esto a tu `claude_desktop_config.json`:

- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bindplane": {
      "command": "npx",
      "args": ["-y", "github:AngelSolisP/mcpbindplane"],
      "env": {
        "BINDPLANE_URL": "https://app.bindplane.com",
        "BINDPLANE_API_KEY": "TU-API-KEY"
      }
    }
  }
}
```

#### Claude Code (CLI)

Agrega el server via comando:

```bash
claude mcp add bindplane -- npx -y github:AngelSolisP/mcpbindplane \
  --env BINDPLANE_URL=https://app.bindplane.com \
  --env BINDPLANE_API_KEY=TU-API-KEY
```

#### Cursor / Windsurf

Misma configuracion JSON que Claude Desktop, en el archivo de configuracion MCP de tu editor.

### 3. Probar

Una vez configurado, preguntale a tu AI:

- *"Lista mis agentes de BindPlane"*
- *"Cuantas configuraciones tengo?"*
- *"Muestra los destinos configurados"*
- *"Que agentes estan desconectados?"*
- *"Haz un rollout de la configuracion LINUX_CONFIG_1"*

## Variables de entorno

| Variable | Requerida | Descripcion |
|---|---|---|
| `BINDPLANE_URL` | Si | URL del servidor BindPlane |
| `BINDPLANE_API_KEY` | * | API key para autenticacion |
| `BINDPLANE_USERNAME` | * | Usuario para Basic Auth (self-hosted) |
| `BINDPLANE_PASSWORD` | * | Password para Basic Auth (self-hosted) |
| `BINDPLANE_TLS_SKIP_VERIFY` | No | Saltar verificacion TLS (default: false) |
| `BINDPLANE_TIMEOUT` | No | Timeout en ms (default: 30000) |

\* Se requiere `BINDPLANE_API_KEY` o bien `BINDPLANE_USERNAME` + `BINDPLANE_PASSWORD`.

### BindPlane Cloud

```json
"env": {
  "BINDPLANE_URL": "https://app.bindplane.com",
  "BINDPLANE_API_KEY": "bp_XXXXX"
}
```

### BindPlane Self-Hosted (API Key)

```json
"env": {
  "BINDPLANE_URL": "http://tu-servidor:3001",
  "BINDPLANE_API_KEY": "tu-api-key"
}
```

### BindPlane Self-Hosted (Basic Auth)

```json
"env": {
  "BINDPLANE_URL": "http://tu-servidor:3001",
  "BINDPLANE_USERNAME": "admin",
  "BINDPLANE_PASSWORD": "tu-password"
}
```

## Tools disponibles (82)

### Agents (15)
`list-agents`, `get-agent`, `get-agent-configuration`, `get-agent-labels`, `update-agent-labels`, `bulk-update-agent-labels`, `update-agent-version`, `bulk-update-agent-version`, `disconnect-agent`, `delete-agents`, `list-agent-types`, `get-agent-type`, `list-agent-versions`, `get-agent-version`, `get-install-command`

### Configurations (17)
`list-configurations`, `get-configuration`, `copy-configuration`, `revert-configuration`, `delete-configuration`, `list-sources`, `get-source`, `delete-source`, `list-destinations`, `get-destination`, `delete-destination`, `list-processors`, `get-processor`, `delete-processor`, `list-extensions`, `get-extension`, `delete-extension`

### Component Types (10)
`list-source-types`, `get-source-type`, `list-destination-types`, `get-destination-type`, `list-processor-types`, `get-processor-type`, `list-extension-types`, `get-extension-type`, `list-recommendation-types`, `get-recommendation-type`

### Rollouts (8)
`list-rollouts`, `create-rollout`, `get-rollout`, `get-rollout-status`, `start-rollout`, `update-rollout`, `pause-rollout`, `resume-rollout`

### Fleets (1)
`list-fleets`

### Resources (5)
`apply-resources`, `delete-resources`, `list-resources-by-kind`, `get-resource`, `get-resource-history`

### Admin (22)
`list-accounts`, `get-account`, `create-account`, `update-account`, `delete-account`, `list-organizations`, `get-organization`, `create-organization`, `delete-organization`, `get-organization-accounts`, `get-organization-projects`, `get-organization-users`, `list-projects`, `get-project`, `create-project`, `delete-project`, `list-users`, `create-user`, `delete-user`, `list-secret-keys`, `create-secret-key`, `delete-secret-key`

### System (4)
`get-version`, `list-audit-events`, `download-audit-events`, `list-available-components`

## Desarrollo

```bash
git clone https://github.com/AngelSolisP/mcpbindplane.git
cd mcpbindplane
npm install
npm run build
npm test
```

## Licencia

MIT
