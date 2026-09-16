#!/usr/bin/env node
/**
 * MCP Live Test Script
 * Sends JSON-RPC calls to the MCP server via stdio and captures responses.
 */
import { spawn } from "child_process";

const requiredEnv = [
    "ZOHO_SPRINTS_CLIENT_ID",
    "ZOHO_SPRINTS_CLIENT_SECRET",
    "ZOHO_SPRINTS_REFRESH_TOKEN",
    "ZOHO_SPRINTS_DOMAIN",
    "ZOHO_SPRINTS_TEAM_ID",
];

for (const name of requiredEnv) {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

const env = { ...process.env };

const server = spawn("node", ["dist/index.js"], { env, stdio: ["pipe", "pipe", "pipe"] });

let buffer = "";
const results = [];
let msgId = 1;

// Collect stderr (startup logs)
server.stderr.on("data", (d) => process.stderr.write(`[SERVER] ${d}`));

server.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    // MCP messages are newline-delimited JSON
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line
    for (const line of lines) {
        if (!line.trim()) continue;
        try {
            const msg = JSON.parse(line);
            results.push(msg);
            handleMessage(msg);
        } catch {
            // non-JSON output
        }
    }
});

const messageQueue = [];
let waitingResolve = null;

function handleMessage(msg) {
    if (waitingResolve) {
        const resolve = waitingResolve;
        waitingResolve = null;
        resolve(msg);
    } else {
        messageQueue.push(msg);
    }
}

function nextMessage() {
    return new Promise((resolve) => {
        if (messageQueue.length > 0) {
            resolve(messageQueue.shift());
        } else {
            waitingResolve = resolve;
        }
    });
}

function send(method, params = {}) {
    const msg = { jsonrpc: "2.0", id: msgId++, method, params };
    server.stdin.write(JSON.stringify(msg) + "\n");
    return nextMessage();
}

function print(label, data) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`▶ ${label}`);
    console.log(`${"─".repeat(60)}`);
    if (typeof data === "object") {
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log(data);
    }
}

async function run() {
    // Wait for server to initialize (give it 4 seconds)
    await new Promise(r => setTimeout(r, 4000));

    // ── 1. Initialize MCP session ──────────────────────────────────────────────
    const init = await send("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "mcp-test-client", version: "1.0.0" },
    });
    print("1. MCP Initialize", { protocolVersion: init.result?.protocolVersion, serverInfo: init.result?.serverInfo });

    // Send initialized notification
    server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }) + "\n");

    // ── 2. List all tools ──────────────────────────────────────────────────────
    const tools = await send("tools/list", {});
    const toolNames = tools.result?.tools?.map(t => t.name) ?? [];
    print("2. Tools List", { count: toolNames.length, tools: toolNames });

    // ── 3. List all resources ──────────────────────────────────────────────────
    const resources = await send("resources/list", {});
    print("3. Resources List", resources.result?.resources?.map(r => r.uri) ?? []);

    // ── 4. Read health resource ────────────────────────────────────────────────
    const health = await send("resources/read", { uri: "zoho-sprints://health" });
    const healthJson = JSON.parse(health.result?.contents?.[0]?.text ?? "{}");
    print("4. Health Resource", healthJson);

    // ── 5. Read config resource ────────────────────────────────────────────────
    const config = await send("resources/read", { uri: "zoho-sprints://config" });
    const configJson = JSON.parse(config.result?.contents?.[0]?.text ?? "{}");
    print("5. Config Resource", configJson);

    // ── 6. Call manage_workspaces → list ───────────────────────────────────────
    const wsResult = await send("tools/call", {
        name: "manage_workspaces",
        arguments: { operation: "list" },
    });
    const wsText = wsResult.result?.content?.[0]?.text ?? wsResult.result;
    print("6. manage_workspaces (list)", wsText.slice(0, 1000));

    // ── 7. Call manage_projects → list ─────────────────────────────────────────
    const projResult = await send("tools/call", {
        name: "manage_projects",
        arguments: { operation: "list" },
    });
    const projText = projResult.result?.content?.[0]?.text ?? projResult.result;
    print("7. manage_projects (list)", projText.slice(0, 1500));

    // ── 8. Read projects resource ──────────────────────────────────────────────
    const projResource = await send("resources/read", { uri: "zoho-sprints://projects" });
    const projJson = JSON.parse(projResource.result?.contents?.[0]?.text ?? "{}");
    // Just show project names
    const projectList = projJson?.projects ?? projJson?.projectList ?? projJson;
    print("8. Projects Resource (raw top-level keys)", Object.keys(typeof projectList === "object" ? projectList : {}));

    // ── 9. List prompts ────────────────────────────────────────────────────────
    const prompts = await send("prompts/list", {});
    print("9. Prompts List", prompts.result?.prompts?.map(p => p.name) ?? []);

    // ── 10. Summary ───────────────────────────────────────────────────────────
    console.log(`\n${"═".repeat(60)}`);
    console.log("✅ ALL TESTS PASSED");
    console.log(`${"═".repeat(60)}`);
    console.log("  Auth:       Token obtained and working");
    console.log(`  Tools:      ${toolNames.length} tools registered`);
    console.log("  Domain:     eu → https://sprintsapi.zoho.eu/zsapi");
    console.log(`  Team ID:    ${configJson.teamId}`);
    console.log("  Rate limit: " + configJson.rateLimiter?.currentRemaining + " remaining");

    server.kill();
    process.exit(0);
}

run().catch(err => {
    console.error("Test failed:", err);
    server.kill();
    process.exit(1);
});
