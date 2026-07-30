# Zoho Sprints MCP Server

[![GitHub stars](https://img.shields.io/github/stars/CodeCraftsman-Jr/zoho-sprints-mcp?style=social)](https://github.com/CodeCraftsman-Jr/zoho-sprints-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PR: timesheet fix](https://img.shields.io/badge/PR-timesheet%20fix-blue)](https://github.com/dineshkanin/zoho-sprints-mcp/pull/1)

> **Timesheet fix applied** -- The original `zoho-sprints-mcp` has broken `manage_timesheets` operations (all return 404). This fork fixes the API endpoints, field names, and content-type so timesheet logging works correctly. [See the fix details](#timesheet-fix).

A Model Context Protocol (MCP) server that lets AI assistants like Claude, ChatGPT, GitHub Copilot, and Cursor manage your [Zoho Sprints](https://www.zoho.com/sprints/) projects through natural language. Instead of clicking through the UI, just tell your AI what you need -- create items, plan sprints, log time, and more.

> If you find this useful, please star this repo -- it helps others discover it!

## Features

- **15 Tools** with **127 operations** covering the entire Zoho Sprints API
- **Timesheet operations work** (list, log hours, delete) -- fixed in this fork
- **3 MCP Prompts**: Guided workflows for sprint planning, project summaries, and daily standups
- **4 MCP Resources**: Health Check, Config, Projects List, Team Members
- **Error handling**: Structured error responses with `isError` flag for AI self-correction
- **Multi-domain support**: Works with all 7 Zoho data centers (.com, .eu, .in, .com.au, .com.cn, .jp, .sa)
- **Auto token refresh**: Proactive refresh every 57 minutes + reactive refresh on 401 responses
- **Input validation**: Reusable validators for dates, IDs, enums, JSON arrays with clear error messages
- **Response caching**: In-memory TTL cache (60 s) for GET requests -- automatic invalidation on writes
- **Debug mode**: Enable `ZOHO_SPRINTS_DEBUG=true` to log all HTTP requests/responses to stderr

## Timesheet Fix

The original `zoho-sprints-mcp` v1.0.1 has a critical bug: the `manage_timesheets` tool uses incorrect URL paths, field names, and content-type, causing all timesheet operations to return **404 Not Found**.

This fork fixes all 4 operations (confirmed by capturing Zoho Sprints web UI network traffic):

| Operation | Original (broken) | Fixed |
|---|---|---|
| list | `GET /logs/?action=data` | `GET /timesheet/?action=listview` |
| add_item_log | `POST /item/{id}/logs/` (form-urlencoded) | `POST /item/{id}/timesheet/?action=additemlog` (multipart) |
| add_general | `POST /generallog/` | `POST /timesheet/?action=addgenerallog` |
| delete | `POST /sprints/{id}/logs/` | `POST /timesheet/` |

Fixed field names: `hours` -> `duration`, `logdate` -> `date`, `billstatus` -> `isbillable`, `users` (JSON array) -> `users` (single ZPUID string).

PR submitted to upstream: [dineshkanin/zoho-sprints-mcp#1](https://github.com/dineshkanin/zoho-sprints-mcp/pull/1)

## Prerequisites

- **Node.js 20+** and **npm 10+** -- [Download here](https://nodejs.org/)
- **Zoho Sprints account** -- [Sign up](https://www.zoho.com/sprints/)
- **Zoho OAuth credentials** (Client ID, Client Secret, Refresh Token) -- [How to get them](#how-to-get-client-id-client-secret--refresh-token)

## Installation

### From this fork (recommended -- has timesheet fix)

```bash
git clone https://github.com/CodeCraftsman-Jr/zoho-sprints-mcp.git
cd zoho-sprints-mcp
npm install
npm run build
```

Then point your MCP client to the local build (see config examples below).

### From npm (original -- timesheet broken)

```bash
npm install -g zoho-sprints-mcp
```

## Quick Start

1. **Get your Zoho OAuth credentials** -- Follow the [guide below](#how-to-get-client-id-client-secret--refresh-token) to get your Client ID, Client Secret, and Refresh Token
2. **Add the MCP server to your AI client** -- Copy the config for your client ([Claude](#claude-desktop) / [VS Code](#vs-code) / [Cursor](#cursor) / [ChatGPT](#chatgpt-remote--http-mode)) and replace the placeholder values with your credentials
3. **Start talking to your AI** -- Ask things like:
   - *"Show all my active sprints"*
   - *"Create a new bug item in Project X"*
   - *"What items are overdue?"*
   - *"Log 2 hours on item #1234"*

That's it -- no server setup, no coding required. The MCP server runs automatically when your AI client starts.

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ZOHO_SPRINTS_REFRESH_TOKEN` | **Yes** | OAuth2 refresh token -- [how to generate](docs/configuration.md) |
| `ZOHO_SPRINTS_CLIENT_ID` | **Yes** | OAuth2 Client ID |
| `ZOHO_SPRINTS_CLIENT_SECRET` | **Yes** | OAuth2 Client Secret |
| `ZOHO_SPRINTS_DOMAIN` | No | Zoho domain (default: `com`). Options: `com`, `eu`, `in`, `com.au`, `com.cn`, `jp`, `sa` |
| `ZOHO_SPRINTS_ACCESS_TOKEN` | No | Initial access token (if omitted, fetched automatically via refresh token on startup) |
| `ZOHO_SPRINTS_TEAM_ID` | No | Workspace (team) ID -- auto-detected if only one workspace exists |
| `ZOHO_SPRINTS_DEBUG` | No | Set to `true` to enable verbose debug logging to stderr |
| `MCP_TRANSPORT` | No | Transport mode: `stdio` (default) or `http` for remote clients like ChatGPT |
| `MCP_HTTP_PORT` | No | Port for HTTP transport (default: `3000`) |
| `MCP_HTTP_HOST` | No | Bind address for HTTP transport (default: `0.0.0.0`) |
| `MCP_HTTP_PATH` | No | Endpoint path for HTTP transport (default: `/mcp`) |

### Generating OAuth2 Credentials

#### How to get Client ID, Client Secret & Refresh Token

Follow our **[step-by-step OAuth setup guide](docs/configuration.md)** to create a Zoho developer application and generate your Client ID, Client Secret, and Refresh Token.

You can also refer to the official [Zoho OAuth Self Client Overview](https://www.zoho.com/accounts/protocol/oauth/self-client/overview.html).

#### Required OAuth Scopes

```
ZohoSprints.projects.ALL,ZohoSprints.sprints.ALL,ZohoSprints.items.ALL,ZohoSprints.teams.READ,ZohoSprints.timesheets.ALL,ZohoSprints.meetings.ALL,ZohoSprints.release.ALL,ZohoSprints.epic.ALL,ZohoSprints.settings.READ,ZohoSprints.teamusers.ALL
```

### MCP Client Configuration

All configs below use the **local build** method (from this fork). Make sure to run `npm run build` first.

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zoho-sprints": {
      "command": "node",
      "args": ["/path/to/zoho-sprints-mcp/dist/index.js"],
      "env": {
        "ZOHO_SPRINTS_DOMAIN": "eu",
        "ZOHO_SPRINTS_REFRESH_TOKEN": "your-refresh-token",
        "ZOHO_SPRINTS_CLIENT_ID": "your-client-id",
        "ZOHO_SPRINTS_CLIENT_SECRET": "your-client-secret",
        "ZOHO_SPRINTS_TEAM_ID": "your-team-id"
      }
    }
  }
}
```

#### Cursor / VS Code

Same structure as Claude Desktop, adjust platform-specific config path.

#### ChatGPT (Remote / HTTP mode)

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npm start
```

Then in ChatGPT -> Settings -> Developer -> Apps -> Add MCP Server with URL `https://your-domain.com/mcp`.

## Available Tools

Each tool is a single MCP tool with an `operation` parameter that selects the action.

### `manage_timesheets` (4 operations) -- FIXED

| Operation | Description | Parameters |
|---|---|---|
| `list` | Fetch time logs for a project | projectId, index, range |
| `add_item_log` | Log hours against a work item | projectId, sprintId, itemId, users, date, duration, notes?, billstatus? |
| `add_general` | Log general hours (not item-specific) | projectId, sprintId, users, date, duration, notes?, billstatus? |
| `delete` | Delete time log entries | projectId, sprintId, logidarr |

**Note:** `date` must be in ISO format (e.g., `2026-07-30T00:00:00+05:30`), `duration` in `hh:mm` format, `users` is a single ZPUID string (not JSON array).

For all other tools, see the original [upstream README](https://github.com/Dineshkanin/zoho-sprints-mcp).

## License

MIT
