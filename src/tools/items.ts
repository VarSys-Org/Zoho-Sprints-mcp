import { z } from "zod";
import { P } from "../schemas.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZohoSprintsClient } from "../api-client.js";
import { ActionParams, ActionHandler, pick, validateRequired, toolResult, toolError } from "./tool-utils.js";
import { markdownToHtml } from "../formatter.js";

// ─── Required Params per Operation ────────────────────────────────────────────

const REQUIRED_PARAMS: Record<string, string[]> = {
    list: ["projectId", "sprintId"],
    get_details: ["projectId", "sprintId", "itemId"],
    get_activity: ["projectId", "sprintId", "itemId"],
    get_multiple: ["projectId"],
    create: ["projectId", "sprintId", "name", "projitemtypeid", "projpriorityid"],
    create_subitem: ["projectId", "sprintId", "itemId", "name", "projitemtypeid", "projpriorityid"],
    update: ["projectId", "sprintId", "itemId"],
    move: ["projectId", "sprintId", "itemidarr", "tosprintid"],
    delete: ["projectId", "sprintId", "itemId"],
    get_comments: ["projectId", "moduleId", "itemId"],
    add_comment: ["projectId", "moduleId", "itemId", "name"],
    edit_comment: ["projectId", "moduleId", "itemId", "notesId", "name"],
    delete_comment: ["projectId", "moduleId", "itemId", "notesId"],
    get_linked: ["projectId", "sprintId", "itemId"],
    link: ["projectId", "sprintId", "itemId", "linkitemobj", "linktosprintid", "linktoprojectid", "linktypeid"],
    delink: ["projectId", "sprintId", "itemId", "linktypeid", "linktoprojectid"],
    get_tags: ["projectId", "sprintId", "itemId"],
    update_tags: ["projectId", "sprintId", "itemId", "reassociate"],
    get_followers: ["projectId", "sprintId", "itemId"],
    update_followers: ["projectId", "sprintId", "itemId"],
    get_timer: ["projectId", "sprintId"],
    get_item_count: ["projectId", "sprintId"],
    // Subitem operations
    list_subitems: ["projectId", "sprintId", "itemId"],
    update_subitem: ["projectId", "sprintId", "itemId", "subitemId"],
    delete_subitem: ["projectId", "sprintId", "itemId", "subitemId"],
    // Attachment operations
    list_attachments: ["projectId", "sprintId", "itemId"],
    delete_attachment: ["projectId", "sprintId", "itemId", "attachmentId"],
    // Block / Unblock operations
    block_item: ["projectId", "sprintId", "itemId"],
    unblock_item: ["projectId", "sprintId", "itemId"],
};

// ─── Action Registry ──────────────────────────────────────────────────────────

const ACTION_NAMES = [
    "list",
    "get_details",
    "get_activity",
    "get_multiple",
    "create",
    "create_subitem",
    "update",
    "move",
    "delete",
    "get_comments",
    "add_comment",
    "edit_comment",
    "delete_comment",
    "get_linked",
    "link",
    "delink",
    "get_tags",
    "update_tags",
    "get_followers",
    "update_followers",
    "get_timer",
    "get_item_count",
    // Subitem operations
    "list_subitems",
    "update_subitem",
    "delete_subitem",
    // Attachment operations
    "list_attachments",
    "delete_attachment",
    // Block / Unblock operations
    "block_item",
    "unblock_item",
] as const;

const ACTION_HANDLERS: Record<string, ActionHandler> = {

    // ─── Read Operations ─────────────────────────────────────────────────────

    list: (client, teamId, p) => {
        const params: Record<string, string> = {
            action: "data",
            index: p.index ?? "1",
            range: p.range ?? "50",
        };
        if (p.subitem) params.subitem = p.subitem;
        if (p.searchby) params.searchby = p.searchby;
        if (p.searchvalue) params.searchvalue = p.searchvalue;
        if (p.filter) params.filter = p.filter;
        return client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/`,
            params,
        );
    },

    get_details: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/`,
            { action: "details" },
        ),

    get_activity: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/activity/`,
            { index: p.index ?? "1", range: p.range ?? "20" },
        ),

    get_multiple: (client, teamId, p) => {
        const params: Record<string, string> = { action: "multipledetails" };
        if (p.itemidarr) params.itemidarr = p.itemidarr;
        if (p.itemnoarr) params.itemnoarr = p.itemnoarr;
        return client.get(`/team/${teamId}/projects/${p.projectId}/item/`, params);
    },

    // ─── Write Operations ────────────────────────────────────────────────────

    create: (client, teamId, p) => {
        const data: Record<string, string> = pick(p, [
            "name", "projitemtypeid", "projpriorityid", "description", "statusid",
            "epicid", "users", "point", "startdate", "enddate", "duration",
        ]);
        if (data.description) data.description = markdownToHtml(data.description);
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/`,
            data,        // form body
        );
    },

    create_subitem: (client, teamId, p) => {
        const data: Record<string, string> = pick(p, [
            "name", "projitemtypeid", "projpriorityid", "description",
            "epicid", "users", "point", "startdate", "enddate", "duration",
        ]);
        if (data.description) data.description = markdownToHtml(data.description);
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/subitem/`,
            data,        // form body
        );
    },

    update: (client, teamId, p) => {
        const data: Record<string, string> = pick(p, [
            "name", "description", "projitemtypeid", "projpriorityid", "epicid",
            "statusid", "chkdependent", "newusers", "delusers", "point",
            "startdate", "enddate",
        ]);
        if (data.description) data.description = markdownToHtml(data.description);
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/`,
            data,
        );
    },

    move: (client, teamId, p) => {
        const data: Record<string, string> = {
            action: "moveitem",
            itemidarr: p.itemidarr!,
            tosprintid: p.tosprintid!,
        };
        if (p.toprojectid) data.toprojectid = p.toprojectid;
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/bulkupdate/`,
            data,
        );
    },

    delete: (client, teamId, p) =>
        client.delete(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/`,
        ),

    // ─── Comments ────────────────────────────────────────────────────────────

    get_comments: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/modules/${p.moduleId}/entity/${p.itemId}/notes/`,
            { action: "data", index: p.index ?? "1", range: p.range ?? "20" },
        ),

    add_comment: (client, teamId, p) =>
        client.post(
            `/team/${teamId}/projects/${p.projectId}/modules/${p.moduleId}/entity/${p.itemId}/notes/`,
            { action: "addnotes", name: markdownToHtml(p.name!) },
        ),

    edit_comment: (client, teamId, p) =>
        client.post(
            `/team/${teamId}/projects/${p.projectId}/modules/${p.moduleId}/entity/${p.itemId}/notes/${p.notesId}/`,
            { action: "editnotes", name: markdownToHtml(p.name!) },
        ),

    delete_comment: (client, teamId, p) =>
        client.delete(
            `/team/${teamId}/projects/${p.projectId}/modules/${p.moduleId}/entity/${p.itemId}/notes/${p.notesId}/`,
        ),

    // ─── Linked Items ────────────────────────────────────────────────────────

    get_linked: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/linkitem/`,
            { action: "data" },
        ),

    link: (client, teamId, p) =>
        client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/linkitem/`,
            {
                action: "linkitems",
                linkitemobj: p.linkitemobj!,
                linktosprintid: p.linktosprintid!,
                linktoprojectid: p.linktoprojectid!,
                linktypeid: p.linktypeid!,
            },
        ),

    delink: (client, teamId, p) => {
        const params: Record<string, string> = {
            linktypeid: p.linktypeid!,
            linktoprojectid: p.linktoprojectid!,
        };
        if (p.destitemid) params.destitemid = p.destitemid;
        if (p.srcitemid) params.srcitemid = p.srcitemid;
        return client.delete(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/linkitem/`,
            params,
        );
    },

    // ─── Tags ────────────────────────────────────────────────────────────────

    get_tags: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/tags/`,
            { action: "itemassociatedtagIds" },
        ),

    update_tags: (client, teamId, p) => {
        const data: Record<string, string> = {
            action: "associateupdate",
            reassociate: p.reassociate!,
        };
        if (p.newtags) data.newtags = p.newtags;
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/tags/`,
            data,
        );
    },

    // ─── Followers ───────────────────────────────────────────────────────────

    get_followers: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/followers/`,
            { action: "getfollowers" },
        ),

    update_followers: (client, teamId, p) => {
        const data: Record<string, string> = { action: "updatefollowers" };
        if (p.newusers) data.newusers = p.newusers;
        if (p.delusers) data.delusers = p.delusers;
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/followers/`,
            data,
        );
    },

    // ─── Timer ───────────────────────────────────────────────────────────────

    get_timer: (client, teamId, p) => {
        const params: Record<string, string> = { action: "itemtimer" };
        if (p.itemIdArr) params.itemIdArr = p.itemIdArr;
        return client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/timer/`,
            params,
        );
    },

    // ─── Item Count ──────────────────────────────────────────────────────────

    get_item_count: (client, teamId, p) => {
        const params: Record<string, string> = {
            action: "itemcountdata",
        };
        if (p.searchby) params.searchby = p.searchby;
        if (p.searchvalue) params.searchvalue = p.searchvalue;
        if (p.filter) params.filter = p.filter;
        return client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/`,
            params,
        );
    },

    // ─── Subitem Operations ─────────────────────────────────────────────────

    list_subitems: async (client, teamId, p) => {
        const result = await client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/subitem/`,
            { action: "data", index: p.index ?? "1", range: p.range ?? "50" },
        );

        // Zoho includes the requested root item in this endpoint's response.
        // A list_subitems operation must return descendants only, otherwise
        // callers over-count and may accidentally process the root twice.
        if (typeof result === "object" && result !== null &&
            Array.isArray((result as Record<string, unknown>).items)) {
            const response = result as Record<string, unknown>;
            return {
                ...response,
                items: (response.items as Array<Record<string, unknown>>)
                    .filter((item) => String(item.itemId ?? "") !== p.itemId),
            };
        }

        return result;
    },

    update_subitem: (client, teamId, p) => {
        const data: Record<string, string> = pick(p, [
            "name", "description", "projitemtypeid", "projpriorityid",
            "statusid", "point", "startdate", "enddate",
        ]);
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/subitem/${p.subitemId}/`,
            data,
        );
    },

    delete_subitem: (client, teamId, p) =>
        client.delete(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/subitem/${p.subitemId}/`,
        ),

    // ─── Attachment Operations ──────────────────────────────────────────────

    // ─── Attachment Operations ──────────────────────────────────────────────

    list_attachments: (client, teamId, p) =>
        client.get(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/attachments/`,
            { action: "notes", index: p.index ?? "1", range: p.range ?? "50" },
        ),

    delete_attachment: (client, teamId, p) =>
        client.delete(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/attachment/${p.attachmentId}/`,
        ),

    // ─── Block / Unblock Operations ─────────────────────────────────────────

    block_item: (client, teamId, p) => {
        const data: Record<string, string> = { action: "blockitem" };
        if (p.reason) data.blockreason = p.reason;
        return client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/`,
            data,
        );
    },

    unblock_item: (client, teamId, p) =>
        client.post(
            `/team/${teamId}/projects/${p.projectId}/sprints/${p.sprintId}/item/${p.itemId}/`,
            { action: "unblockitem" },
        ),
};

// ─── Tool Description ─────────────────────────────────────────────────────────

const TOOL_DESCRIPTION = `Manage work items: CRUD, comments, links, tags, followers, subitems, attachments, timers, and blocking/unblocking.
Operations:
  list              - List items in a sprint/backlog (projectId, sprintId, index, range, subitem?, searchby?, searchvalue?, filter?)
  get_details       - Get item details (projectId, sprintId, itemId)
  get_activity      - Get item activity log (projectId, sprintId, itemId, index, range)
  get_multiple      - Get multiple items by IDs (projectId, itemidarr?, itemnoarr?)
  create            - Create item (projectId, sprintId, name, projitemtypeid, projpriorityid, description?, statusid?, epicid?, users?, point?, startdate?, enddate?, duration?)
  create_subitem    - Create subitem (projectId, sprintId, itemId, name, projitemtypeid, projpriorityid, description?, epicid?, users?, point?, startdate?, enddate?, duration?)
  update            - Update item (projectId, sprintId, itemId, name?, description?, projitemtypeid?, projpriorityid?, epicid?, statusid?, chkdependent?, newusers?, delusers?, point?, startdate?, enddate?)
  move              - Move items to another sprint/project (projectId, sprintId, itemidarr, tosprintid, toprojectid?)
  delete            - Delete item (projectId, sprintId, itemId)
  get_comments      - List item comments (projectId, moduleId, itemId, index, range)
  add_comment       - Add comment (projectId, moduleId, itemId, name)
  edit_comment      - Edit existing comment (projectId, moduleId, itemId, notesId, name)
  delete_comment    - Delete comment (projectId, moduleId, itemId, notesId)
  get_linked        - Get linked items (projectId, sprintId, itemId)
  link              - Link items (projectId, sprintId, itemId, linkitemobj, linktosprintid, linktoprojectid, linktypeid)
  delink            - Remove link (projectId, sprintId, itemId, linktypeid, linktoprojectid, destitemid?, srcitemid?)
  get_tags          - Get item tags (projectId, sprintId, itemId)
  update_tags       - Update item tags (projectId, sprintId, itemId, reassociate, newtags?)
  get_followers     - Get item followers (projectId, sprintId, itemId)
  update_followers  - Update followers (projectId, sprintId, itemId, newusers?, delusers?)
  get_timer         - Get item timer (projectId, sprintId, itemIdArr?)
  get_item_count    - Get item count in a sprint/backlog (projectId, sprintId, searchby?, searchvalue?, filter?)
  list_subitems     - List subitems of an item (projectId, sprintId, itemId, index, range)
  update_subitem    - Update a subitem (projectId, sprintId, itemId, subitemId, name?, description?, projitemtypeid?, projpriorityid?, statusid?, point?, startdate?, enddate?)
  delete_subitem    - Delete a subitem (projectId, sprintId, itemId, subitemId)
  list_attachments  - List attachments on an item (projectId, sprintId, itemId, index, range)
  delete_attachment - Delete an attachment (projectId, sprintId, itemId, attachmentId)
  block_item        - Block an item with a reason (projectId, sprintId, itemId, reason?)
  unblock_item      - Unblock a blocked item (projectId, sprintId, itemId)`;

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerItemTools (
    server: McpServer,
    getClient: () => ZohoSprintsClient
) {
    server.registerTool(
        "manage_items",
        {
            description: TOOL_DESCRIPTION,
            inputSchema: {
                operation: z.enum(ACTION_NAMES).describe("Operation to perform"),
                ...P.projectId,
                ...P.sprintId,
                ...P.itemId,
                ...P.moduleId,
                ...P.notesId,
                ...P.pagination(),
                // Create / Update fields
                name: z.string().optional().describe("Item name or comment text (create, create_subitem, update, add_comment, edit_comment, update_subitem)"),
                projitemtypeid: z.string().optional().describe("Item type ID (create, create_subitem, update, update_subitem)"),
                projpriorityid: z.string().optional().describe("Priority ID (create, create_subitem, update, update_subitem)"),
                description: z.string().optional().describe("Item description (create, create_subitem, update, update_subitem)"),
                statusid: z.string().optional().describe("Status ID (create, update, update_subitem)"),
                epicid: z.string().optional().describe("Epic ID (create, create_subitem, update)"),
                users: z.string().optional().describe("JSONArray of user IDs (create, create_subitem)"),
                point: z.string().optional().describe("Story points index (create, create_subitem, update, update_subitem)"),
                startdate: z.string().optional().describe("Start date ISO (create, create_subitem, update, update_subitem)"),
                enddate: z.string().optional().describe("End date ISO (create, create_subitem, update, update_subitem)"),
                duration: z.string().optional().describe("Duration (create, create_subitem)"),
                chkdependent: z.string().optional().describe("'false' to skip linked-item status check (update)"),
                newusers: z.string().optional().describe("JSONArray of user IDs to add (update, update_followers)"),
                delusers: z.string().optional().describe("JSONArray of user IDs to remove (update, update_followers)"),
                // Search fields
                subitem: z.string().optional().describe("'true' to include subitems (list)"),
                searchby: z.string().optional().describe("'id', 'name', or 'both' to search by ID and name (list)"),
                searchvalue: z.string().optional().describe("Search value (list)"),
                filter: z.string().optional().describe("JSONObject filter e.g. {\"I-owner\":[\"userId\"],\"I-enddate\":[\"overdue\"],\"queryType\":1,\"jsontmpl\":\"item_default\"} (list)"),
                // Multi-detail fields
                itemidarr: z.string().optional().describe("JSONArray of item IDs (get_multiple, move)"),
                itemnoarr: z.string().optional().describe("JSONArray of item numbers (get_multiple)"),
                // Move fields
                tosprintid: z.string().optional().describe("Destination sprint ID (move)"),
                toprojectid: z.string().optional().describe("Destination project ID (move)"),
                // Link fields
                linkitemobj: z.string().optional().describe("JSONObject e.g. {'directlink':['itemId']} (link)"),
                linktosprintid: z.string().optional().describe("Target sprint ID (link)"),
                linktoprojectid: z.string().optional().describe("Target project ID (link, delink)"),
                linktypeid: z.string().optional().describe("Link type ID (link, delink)"),
                destitemid: z.string().optional().describe("Destination item ID for forward link (delink)"),
                srcitemid: z.string().optional().describe("Source item ID for back link (delink)"),
                // Tag fields
                newtags: z.string().optional().describe("JSONArray of tag IDs (update_tags)"),
                reassociate: z.string().optional().describe("'true' to replace, 'false' to append (update_tags)"),
                // Timer fields
                itemIdArr: z.string().optional().describe("JSONArray of item IDs (get_timer)"),
                // Subitem fields
                subitemId: z.string().optional().describe("Subitem ID (update_subitem, delete_subitem)"),
                // Attachment fields
                attachmentId: z.string().optional().describe("Attachment ID (delete_attachment)"),
                // Block fields
                reason: z.string().optional().describe("Block reason message (block_item)"),
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
