import type { ApiResponse } from "./types.js";

/** Max characters before we summarize a list response */
const MAX_RESPONSE_CHARS = 8000;

/**
 * Format a raw Zoho Sprints API response into a concise, LLM-friendly summary.
 * Falls back to JSON.stringify for unknown shapes.
 */
export function formatResponse (result: ApiResponse, context?: string): string {
    // If the response contains an error key, surface it prominently
    if (result.error) {
        return `Error: ${JSON.stringify(result.error)}\n\n${JSON.stringify(result, null, 2)}`;
    }

    const parts: string[] = [];

    // Add context header if provided
    if (context) {
        parts.push(`── ${context} ──`);
    }

    // Extract status
    if (result.status && result.status !== "success") {
        parts.push(`Status: ${result.status}`);
    }

    // Handle paginated list responses
    const pageInfo = extractPaginationInfo(result);
    if (pageInfo) {
        parts.push(pageInfo);
    }

    // For large list responses, summarize instead of dumping raw JSON
    const fullJson = JSON.stringify(result, null, 2);
    if (fullJson.length > MAX_RESPONSE_CHARS) {
        parts.push(summarizeLargeResponse(result));
    } else {
        parts.push(fullJson);
    }

    return parts.join("\n");
}

/**
 * Extract pagination metadata from a response, if present.
 */
function extractPaginationInfo (result: ApiResponse): string | null {
    const total = result.totalCount ?? result.total ?? result.count;
    const index = result.index ?? result.startIndex;
    const range = result.range ?? result.pageSize;

    if (total !== undefined) {
        const parts = [`Total: ${total}`];
        if (index !== undefined) parts.push(`Index: ${index}`);
        if (range !== undefined) parts.push(`Range: ${range}`);
        return parts.join(" | ");
    }

    return null;
}

/**
 * Summarize a large response by extracting key fields from array items.
 * Detects common Zoho response shapes and picks relevant fields.
 */
function summarizeLargeResponse (result: ApiResponse): string {
    // Find the first array in the response (usually the main data)
    const arrays: Array<{ key: string; items: unknown[] }> = [];
    for (const [key, value] of Object.entries(result)) {
        if (Array.isArray(value) && value.length > 0) {
            arrays.push({ key, items: value });
        }
    }

    if (arrays.length === 0) {
        // No arrays found, just truncate the JSON
        const json = JSON.stringify(result, null, 2);
        return json.slice(0, MAX_RESPONSE_CHARS) + "\n... (truncated)";
    }

    const lines: string[] = [];

    for (const { key, items } of arrays) {
        lines.push(`\n[${key}] ${items.length} items:`);

        // Pick fields based on what's in the first item
        const firstItem = items[0] as Record<string, unknown>;
        const fields = pickSummaryFields(firstItem);

        const display = items.slice(0, 20);
        for (let i = 0; i < display.length; i++) {
            const item = display[i] as Record<string, unknown>;
            const values = fields
                .map(f => {
                    const v = item[f];
                    return v !== undefined && v !== null ? `${f}: ${v}` : null;
                })
                .filter(Boolean)
                .join(", ");
            lines.push(`  ${i + 1}. ${values}`);
        }

        if (items.length > 20) {
            lines.push(`  ... and ${items.length - 20} more`);
        }
    }

    return lines.join("\n");
}

/**
 * Pick the most useful fields to display from an object.
 * Prioritizes common Zoho Sprints fields.
 */
function pickSummaryFields (item: Record<string, unknown>): string[] {
    const priorityFields = [
        "id", "name", "itemName", "title", "status", "statusName",
        "priority", "priorityName", "owner", "ownerName", "assignee",
        "point", "startdate", "enddate", "dueDate", "itemNo",
        "sprintName", "projectName", "epicName", "typeName",
    ];

    const itemKeys = Object.keys(item);
    const picked: string[] = [];

    // First, grab priority fields that exist
    for (const f of priorityFields) {
        if (itemKeys.includes(f) && picked.length < 6) {
            picked.push(f);
        }
    }

    // If we have room, add more fields
    for (const k of itemKeys) {
        if (!picked.includes(k) && picked.length < 8) {
            // Skip long/complex fields
            const val = item[k];
            if (typeof val === "string" && val.length > 100) continue;
            if (typeof val === "object" && val !== null) continue;
            picked.push(k);
        }
    }

    return picked;
}

/**
 * Summarize a list of objects by extracting key fields.
 * Useful for giving the LLM a compact view of large result sets.
 */
export function summarizeList (
    items: Array<Record<string, unknown>>,
    fields: string[],
    maxItems = 50
): string {
    if (items.length === 0) return "(empty list)";

    const display = items.slice(0, maxItems);
    const lines = display.map((item, i) => {
        const values = fields
            .map((f) => {
                const v = item[f];
                return v !== undefined ? `${f}: ${v}` : null;
            })
            .filter(Boolean)
            .join(", ");
        return `  ${i + 1}. ${values}`;
    });

    if (items.length > maxItems) {
        lines.push(`  ... and ${items.length - maxItems} more`);
    }

    return lines.join("\n");
}

/**
 * Convert Markdown formatted text into Zoho Sprints compatible HTML.
 */
export function markdownToHtml(md: string): string {
    if (!md) return md;
    let html = md;

    // 1. Unescape literal escaped newlines if passed as a string "\\n"
    html = html.replace(/\\n/g, "\n");

    // 2. Normalize missing newlines before headers if glued to text (e.g., "layers.### Problem")
    html = html.replace(/([^\n])\s*(#{1,6}\s+)/g, "$1\n\n$2");

    // 3. Normalize missing newlines around Markdown table boundaries (e.g., "Files| File | Issue |")
    html = html.replace(/([^\n])\s*(\|[^\n]+\|)/g, "$1\n$2");
    html = html.replace(/(\|[^\n]+\|)\s*([^\n|#\s])/g, "$1\n$2");

    // 4. Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _p1, p2) => `<pre><code>${p2}</code></pre>`);

    // 5. Headers (process ####, ###, ##, # in order)
    html = html.replace(/^#### (.+)$/gm, (_m, p1) => `<h4>${p1}</h4>`);
    html = html.replace(/^### (.+)$/gm, (_m, p1) => `<h3>${p1}</h3>`);
    html = html.replace(/^## (.+)$/gm, (_m, p1) => `<h2>${p1}</h2>`);
    html = html.replace(/^# (.+)$/gm, (_m, p1) => `<h1>${p1}</h1>`);

    // 6. Bold & Italics & Inline Code
    html = html.replace(/\*\*(.+?)\*\*/g, (_m, p1) => `<strong>${p1}</strong>`);
    html = html.replace(/\*(.+?)\*/g, (_m, p1) => `<em>${p1}</em>`);
    html = html.replace(/`([^`]+)`/g, (_m, p1) => `<code>${p1}</code>`);

    // 7. Tables
    html = html.replace(/^\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/gm, (_match, header, body) => {
        const headers = header.split('|').map((h: string) => `<th>${h.trim()}</th>`).join('');
        const rows = body.trim().split('\n').map((row: string) => {
            const cells = row.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    // 8. Checkboxes
    html = html.replace(/^- \[x\] (.+)$/gm, (_m, p1) => `<li><input type="checkbox" checked disabled> ${p1}</li>`);
    html = html.replace(/^- \[ \] (.+)$/gm, (_m, p1) => `<li><input type="checkbox" disabled> ${p1}</li>`);

    // 9. Lists
    html = html.replace(/^- (.+)$/gm, (_m, p1) => `<li>${p1}</li>`);
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
    html = html.replace(/^\d+\. (.+)$/gm, (_m, p1) => `<li>${p1}</li>`);

    // 10. Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
}
