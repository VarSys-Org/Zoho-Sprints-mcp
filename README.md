# Zoho Sprints MCP Server

[![GitHub stars](https://img.shields.io/github/stars/CodeCraftsman-Jr/zoho-sprints-mcp?style=social)](https://github.com/CodeCraftsman-Jr/zoho-sprints-mcp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Fork with critical fixes** -- This fork fixes broken timesheets, adds missing operations, and patches 6 critical bugs in the original `zoho-sprints-mcp` v1.0.1. [See all changes](#what-this-fork-fixes).

A Model Context Protocol (MCP) server that lets AI assistants like Claude, ChatGPT, GitHub Copilot, and Cursor manage your [Zoho Sprints](https://www.zoho.com/sprints/) projects through natural language. Instead of clicking through the UI, just tell your AI what you need -- create items, plan sprints, log time, and more.

## What This Fork Fixes

### Critical Bugs Fixed

| Bug | Impact | Fix |
|-----|--------|-----|
| **`pick()` drops falsy values** | Fields set to `"0"`, `"false"`, `""` silently lost | Uses `!== undefined && !== null` check |
| **Auth failure handler commented out** | Code 7700 errors not auto-retried | Uncommented token refresh on code 7700 |
| **No `put()` HTTP method** | All updates use POST (can overwrite) | Added `put()` for proper partial updates |
| **No `edit_comment`** | Must delete+recreate to fix typos | Added `edit_comment` operation |
| **Formatter dumps raw JSON** | Large responses flood context window | Summarizes lists >8KB automatically |
| **Error detection incomplete** | Only catches `{status: "failure"}` | Also catches `{error}` and `{code: 7700}` |

### Timesheet Fixes

| Operation | Original (broken) | Fixed |
|-----------|-------------------|-------|
| list | `GET /logs/?action=data` | `GET /timesheet/?action=listview` |
| add_item_log | `POST /item/{id}/logs/` (form-urlencoded) | `POST /item/{id}/timesheet/?action=additemlog` (multipart) |
| add_general | `POST /generallog/` | `POST /timesheet/?action=addgenerallog` |
| get_details | Not available | `GET /timesheet/{logId}/?action=logdetails` |
| delete | `POST /sprints/{id}/logs/` with `logidarr` | `DELETE /timesheet/{logId}/` |

### New Operations Added

| Operation | Tool | Description |
|-----------|------|-------------|
| `edit_comment` | manage_items | Edit existing comment without delete+recreate |
| `list_subitems` | manage_items | List all subitems of an item |
| `update_subitem` | manage_items | Update subitem fields (name, description, status, points, dates) |
| `delete_subitem` | manage_items | Delete a subitem |
| `list_attachments` | manage_items | List all attachments on an item |
| `delete_attachment` | manage_items | Delete an attachment |

## Features

- **15 Tools** with **134 operations** covering the Zoho Sprints API
- **Timesheet operations work** (list, log hours, get details, delete)
- **Subitem management** (list, create, update, delete)
- **Attachment management** (list, delete)
- **Comment editing** (edit without delete+recreate)
- **3 MCP Prompts**: Guided workflows for sprint planning, project summaries, and daily standups
- **4 MCP Resources**: Health Check, Config, Projects List, Team Members
- **Error handling**: Structured error responses with `isError` flag for AI self-correction
- **Multi-domain support**: Works with all 7 Zoho data centers (.com, .eu, .in, .com.au, .com.cn, .jp, .sa)
- **Auto token refresh**: Proactive refresh every 57 minutes + reactive refresh on 401 and code 7700
- **Input validation**: Reusable validators for dates, IDs, enums, JSON arrays with clear error messages
- **Response caching**: In-memory TTL cache (60 s) for GET requests -- automatic invalidation on writes
- **Debug mode**: Enable `ZOHO_SPRINTS_DEBUG=true` to log all HTTP requests/responses to stderr

## Installation

### From this fork (recommended)

```bash
git clone https://github.com/CodeCraftsman-Jr/zoho-sprints-mcp.git
cd zoho-sprints-mcp
git checkout feat/attachment-subitem-ops
npm install
npm run build
```

Then point your MCP client to the local build (see config examples below).

### From npm (original -- has bugs)

```bash
npm install -g zoho-sprints-mcp
```

## Quick Start

1. **Get your Zoho OAuth credentials** -- Follow the [guide below](#how-to-get-client-id-client-secret--refresh-token) to get your Client ID, Client Secret, and Refresh Token
2. **Add the MCP server to your AI client** -- Copy the config for your client and replace the placeholder values with your credentials
3. **Start talking to your AI** -- Ask things like:
   - *"Show all my active sprints"*
   - *"Create a new bug item in Project X"*
   - *"What items are overdue?"*
   - *"Log 2 hours on item #1234"*
   - *"List subitems of item #567"*
   - *"List attachments on item #890"*

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZOHO_SPRINTS_REFRESH_TOKEN` | **Yes** | OAuth2 refresh token |
| `ZOHO_SPRINTS_CLIENT_ID` | **Yes** | OAuth2 Client ID |
| `ZOHO_SPRINTS_CLIENT_SECRET` | **Yes** | OAuth2 Client Secret |
| `ZOHO_SPRINTS_DOMAIN` | No | Zoho domain (default: `com`). Options: `com`, `eu`, `in`, `com.au`, `com.cn`, `jp`, `sa` |
| `ZOHO_SPRINTS_ACCESS_TOKEN` | No | Initial access token (if omitted, fetched automatically) |
| `ZOHO_SPRINTS_TEAM_ID` | No | Workspace (team) ID -- auto-detected if only one exists |
| `ZOHO_SPRINTS_DEBUG` | No | Set to `true` for verbose debug logging |

### MCP Client Configuration

All configs use the **local build** method. Make sure to run `npm run build` first.

#### Claude Desktop

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

## Available Tools

### `manage_items` (27 operations)

| Operation | Description |
|-----------|-------------|
| `list` | List items in a sprint/backlog |
| `get_details` | Get item details |
| `get_activity` | Get item activity log |
| `get_multiple` | Get multiple items by IDs |
| `create` | Create item |
| `create_subitem` | Create subitem |
| `update` | Update item fields |
| `move` | Move items to another sprint/project |
| `delete` | Delete item |
| `get_comments` | List item comments |
| `add_comment` | Add comment |
| `edit_comment` | Edit existing comment |
| `delete_comment` | Delete comment |
| `get_linked` | Get linked items |
| `link` | Link items |
| `delink` | Remove link |
| `get_tags` | Get item tags |
| `update_tags` | Update item tags |
| `get_followers` | Get item followers |
| `update_followers` | Update followers |
| `get_timer` | Get timer details |
| `get_item_count` | Get item count in sprint/backlog |
| `list_subitems` | List all subitems of an item |
| `update_subitem` | Update subitem fields |
| `delete_subitem` | Delete a subitem |
| `list_attachments` | List all attachments on an item |
| `delete_attachment` | Delete an attachment |

### `manage_timesheets` (5 operations) -- FIXED

| Operation | Description |
|-----------|-------------|
| `list` | List log hours for a project |
| `add_item_log` | Log hours against a work item |
| `add_general` | Log general hours (not item-specific) |
| `get_details` | Get a single timesheet log details |
| `delete` | Delete a timesheet log |

**Note:** `date` must be in ISO format (e.g., `2026-07-30`), `duration` in `hh:mm` format, `users` is a single ZPUID string.

### `manage_sprints` (13 operations)

| Operation | Description |
|-----------|-------------|
| `list` | List sprints (Active/Upcoming/Completed/Canceled) |
| `get_details` | Get sprint details |
| `create` | Create a sprint |
| `update` | Update a sprint |
| `start` | Start a sprint |
| `complete` | Complete a sprint |
| `cancel` | Cancel a sprint |
| `replan` | Replan a sprint |
| `reopen` | Reopen a completed/canceled sprint |
| `delete` | Delete a sprint |
| `get_comments` | Get sprint comments |
| `add_comment` | Add a sprint comment |
| `delete_comment` | Delete a sprint comment |

### Other Tools

For `manage_projects`, `manage_epics`, `manage_releases`, `manage_meetings`, `manage_users`, `manage_project_settings`, `manage_checklists`, `manage_webhooks`, `manage_okr`, `manage_expenses`, `manage_custom_modules` -- see the original [upstream README](https://github.com/Dineshkanin/zoho-sprints-mcp).

## PRs Submitted to Upstream

| PR | Branch | What |
|----|--------|------|
| [#1](https://github.com/dineshkanin/zoho-sprints-mcp/pull/1) | `main` | Timesheet fixes (endpoints, field names, content-type) |
| [#2](https://github.com/dineshkanin/zoho-sprints-mcp/pull/2) | `fix/comprehensive-patches` | 6 critical patches (pick fix, auth handler, put(), edit_comment, formatter, error detection) |
| [#3](https://github.com/dineshkanin/zoho-sprints-mcp/pull/3) | `feat/attachment-subitem-ops` | 5 new operations (list/update/delete subitems, list/delete attachments) |

## Updating

```bash
cd zoho-sprints-mcp
git pull origin feat/attachment-subitem-ops
npm run build
```

## License

MIT
