import { ZohoSprintsClient } from "../api-client.js";
import { formatResponse } from "../formatter.js";
import type { ApiResponse } from "../types.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionParams = Record<string, string | undefined>;
export type ActionHandler = (client: ZohoSprintsClient, teamId: string, p: ActionParams) => Promise<unknown>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick only defined values from params for the given keys. Handles falsy values like "0", "false", "" correctly. */
export function pick (p: ActionParams, keys: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const k of keys) if (p[k] !== undefined && p[k] !== null) result[k] = p[k]!;
    return result;
}

/** Validate that all required params for an operation are present */
export function validateRequired (
    requiredParams: Record<string, string[]>,
    operation: string,
    p: ActionParams,
): void {
    const missing = (requiredParams[operation] ?? []).filter(k => !p[k]);
    if (missing.length > 0) {
        throw new Error(`Operation "${operation}" requires: ${missing.join(", ")}`);
    }
}

/** Format an API result into an MCP tool response, detecting Zoho failure responses */
export function toolResult (result: unknown, context?: string) {
    // Zoho Sprints API returns various error shapes
    if (typeof result === "object" && result !== null) {
        const res = result as Record<string, unknown>;

        // Check for Zoho standard failure: { status: "failure", message: "..." }
        if (res.status === "failure") {
            const msg = typeof res.message === "string" ? res.message : JSON.stringify(result, null, 2);
            return { content: [{ type: "text" as const, text: msg }], isError: true as const };
        }

        // Check for error key: { error: "..." } or { error: { message: "..." } }
        if (res.error) {
            const errVal = res.error;
            const msg = typeof errVal === "string"
                ? errVal
                : typeof errVal === "object" && errVal !== null && "message" in errVal
                    ? String((errVal as Record<string, unknown>).message)
                    : JSON.stringify(errVal);
            return { content: [{ type: "text" as const, text: msg }], isError: true as const };
        }

        // Check for Zoho auth failure code 7700
        if (res.code === 7700) {
            const msg = typeof res.message === "string" ? res.message : "Authentication failed (code 7700)";
            return { content: [{ type: "text" as const, text: msg }], isError: true as const };
        }

        return { content: [{ type: "text" as const, text: formatResponse(res as ApiResponse, context) }] };
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
}

/** Format an error into an MCP tool response with isError flag */
export function toolError (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text" as const, text: message }], isError: true as const };
}
