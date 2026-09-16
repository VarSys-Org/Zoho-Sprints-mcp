import { z } from "zod";
import { P } from "../schemas.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZohoSprintsClient } from "../api-client.js";
import { ActionParams, ActionHandler, validateRequired, toolResult, toolError } from "./tool-utils.js";

// ─── Required Params per Operation ────────────────────────────────────────────

const REQUIRED_PARAMS: Record<string, string[]> = {
    list: ["projectId"],
    add_item_log: ["projectId", "sprintId", "itemId", "users", "date", "duration"],
    add_general: ["projectId", "sprintId", "users", "date", "duration"],
    get_details: ["projectId", "logId"],
    delete: ["projectId", "logId"],
};

// ─── Action Registry ──────────────────────────────────────────────────────────

const ACTION_NAMES = [
    "list",
    "add_item_log",
    "add_general",
    "get_details",
    "delete",
] as const;

const ACTION_HANDLERS: Record<string, ActionHandler> = {

    list: (client, teamId, p) =>
        client.get(`/team/${teamId}/projects/${p.projectId}/timesheet/`, {
            action: "listview", index: p.index ?? "1", range: p.range ?? "50", logtypes: "[0]", listviewtype: "1",
        }),

    add_item_log: (client, teamId, p) => {
        const data: Record<string, string> = {
            users: p.users!,
            date: p.date!,
            duration: p.duration!,
            isbillable: p.billstatus ?? "1",
            notes: p.notes ?? "",
        };
        return client.postMultipart(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/timesheet/?action=additemlog`,
            data,
        );
    },

    add_general: (client, teamId, p) => {
        const data: Record<string, string> = {
            users: p.users!,
            date: p.date!,
            duration: p.duration!,
            isbillable: p.billstatus ?? "1",
            notes: p.notes ?? "",
        };
        return client.postMultipart(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/timesheet/?action=addgenerallog`,
            data,
        );
    },

    get_details: (client, teamId, p) =>
        client.get(`/team/${teamId}/projects/${p.projectId}/timesheet/${p.logId!}/`, {
            action: "logdetails",
        }),

    delete: (client, teamId, p) =>
        client.delete(`/team/${teamId}/projects/${p.projectId}/timesheet/${p.logId!}/`),
};

// ─── Tool Description ─────────────────────────────────────────────────────────

const TOOL_DESCRIPTION = `Manage timesheets: list, add item/general log hours, get details, and delete logs.
Operations:
  list         - List log hours for a project (projectId, index, range)
  add_item_log - Log hours against a work item (projectId, sprintId, itemId, users, date, duration, notes?, billstatus?)
  add_general  - Log general hours (not item-specific) (projectId, sprintId, users, date, duration, notes?, billstatus?)
  get_details  - Get a single timesheet log details (projectId, logId)
  delete       - Delete a timesheet log (projectId, logId)`;

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerTimesheetTools (
    server: McpServer,
    getClient: () => ZohoSprintsClient
) {
    server.registerTool(
        "manage_timesheets",
        {
            description: TOOL_DESCRIPTION,
            inputSchema: {
                operation: z.enum(ACTION_NAMES).describe("Operation to perform"),
                ...P.projectId,
                ...P.sprintId,
                ...P.itemId,
                ...P.pagination("1", "50"),
                action: z.string().optional().describe("additemlog or addgenerallog (add_item_log)"),
                users: z.string().optional().describe("User ZPUID (add_item_log, add_general)"),
                date: z.string().optional().describe("Date in ISO format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS+HH:MM (add_item_log, add_general)"),
                duration: z.string().optional().describe("Duration in hh:mm format (add_item_log, add_general)"),
                billstatus: z.string().optional().describe("Billable=1, Non-billable=0 (add_item_log, add_general)"),
                notes: z.string().optional().describe("Description about the time log (add_item_log, add_general)"),
                logId: z.string().optional().describe("Timesheet log ID (get_details, delete)"),
            },
        },
        async (params) => {
            try {
                const p = params as ActionParams;
                validateRequired(REQUIRED_PARAMS, params.operation, p);
                const client = getClient();
                const teamId = client.teamId!;
                const handler = ACTION_HANDLERS[params.operation];
                const result = await handler(client, teamId, p);
                return toolResult(result);
            } catch (err) {
                return toolError(err);
            }
        }
    );
}
