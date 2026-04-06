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

## Tools disponibles (9 tools, 84 acciones)

Cada tool agrupa multiples acciones via el parametro `action`. Solo ocupa 9 slots en tu cliente MCP.

| Tool | Acciones | Descripcion |
|---|---|---|
| `agents` | 15 | Agentes, tipos de agente, versiones, labels, upgrades, install command |
| `configurations` | 17 | Configuraciones, sources, destinations, processors, extensions |
| `component-types` | 10 | Tipos de componentes disponibles (source, destination, processor, extension, recommendation) |
| `rollouts` | 8 | Despliegues incrementales de configuraciones a agentes |
| `fleets` | 1 | Fleets (agrupaciones de agentes con config compartida) |
| `resources` | 5 | Operaciones genericas tipo kubectl (apply, delete, list, get, history) |
| `admin` | 22 | Cuentas, organizaciones, proyectos, usuarios, API keys |
| `system` | 4 | Version del servidor, audit events, componentes disponibles |
| `audit` | 2 | Reporte de acciones realizadas en la sesion actual |

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
