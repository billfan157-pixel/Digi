import { createMCPClient } from "@ai-sdk/mcp";
import { exec } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MCP_URL =
  "https://mcp.supabase.com/mcp?project_ref=plbwqjdrivyffrhpbmvm&read_only=true";

const PROJECT_REF = "plbwqjdrivyffrhpbmvm";

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function extractFirstUrl(text) {
  if (!text) return null;
  const match = String(text).match(/https?:\/\/[^\s"'<>]+/i);
  return match?.[0] ?? null;
}

function openBrowser(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const cmd = `cmd /c start "" "${url}"`;
    exec(cmd, () => resolve(true));
  });
}

function readStdin(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Lấy Supabase Personal Access Token (PAT) theo thứ tự ưu tiên:
 * 1. Biến môi trường SUPABASE_ACCESS_TOKEN
 * 2. File .supabase-token trong thư mục scripts/
 * 3. Hỏi user paste token
 *
 * Lưu ý: Supabase MCP server yêu cầu PAT, KHÔNG phải user JWT hay anon key.
 * Cách lấy PAT:
 *   https://supabase.com/dashboard/account/tokens → Generate new token
 *   Copy token (dạng sbp_...)
 */
async function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.log("ℹ Dùng SUPABASE_ACCESS_TOKEN từ env");
    return process.env.SUPABASE_ACCESS_TOKEN;
  }

  const tokenFile = resolve(__dirname, ".supabase-token");
  if (existsSync(tokenFile)) {
    const token = readFileSync(tokenFile, "utf-8").trim();
    if (token) {
      console.log("ℹ Dùng token từ .supabase-token");
      return token;
    }
  }

  console.log("\n⚠ Chưa có token. Các cách lấy:");
  console.log(`  A) https://supabase.com/dashboard/account/tokens → Generate new token`);
  console.log(`     (dạng sbp_..., KHÔNG phải user JWT hay anon key)`);
  console.log(`  B) Chạy: echo "<token>" > scripts/.supabase-token`);
  console.log(`  C) Set env: $env:SUPABASE_ACCESS_TOKEN="<token>"`);

  const token = await readStdin("\nPaste Personal Access Token (Enter để bỏ qua): ");
  return token || null;
}

async function logRawMcpHttpProbe(token) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const getRes = await fetch(MCP_URL, { method: "GET", headers });
    const text = await getRes.text().catch(() => "");
    console.log("\n=== Raw MCP HTTP probe (GET) ===");
    console.log("Status:", getRes.status, getRes.statusText);
    console.log("Headers:", safeStringify(Object.fromEntries(getRes.headers.entries())));
    console.log("Body:", text?.slice?.(0, 2000) ?? String(text));
  } catch (e) {
    console.log("\n=== Raw MCP HTTP probe (GET) failed ===");
    console.error(e);
  }
}

async function tryFetchTools(mcpClient) {
  const toolsResult = await mcpClient.tools();
  const tools = toolsResult?.tools ?? toolsResult;
  const toolNames = Array.isArray(tools)
    ? tools.map((t) => t.name)
    : Object.keys(tools ?? {});
  return { tools, toolNames };
}

function printToolSchema(tools, name) {
  const tool = Array.isArray(tools) ? tools.find(t => t.name === name) : tools[name];
  if (!tool) return console.log(`  (no schema found for "${name}")`);
  console.log(`  Input schema:`, safeStringify(tool.inputSchema ?? tool.parameters ?? {}));
}

async function main() {
  console.log("=== Supabase MCP demo (read-only) ===");
  console.log("MCP URL:", MCP_URL);

  const accessToken = await getAccessToken();

  if (accessToken && !accessToken.startsWith("sbp_")) {
    console.log("\n⚠ Token không bắt đầu bằng 'sbp_' — Supabase MCP yêu cầu Personal Access Token (PAT).");
    console.log("  Tạo PAT tại: https://supabase.com/dashboard/account/tokens");
  }

  // Probe with token
  console.log("\n=== Debug: raw MCP HTTP probe (pre-tools) ===");
  await logRawMcpHttpProbe(accessToken);

  let mcpClient;
  try {
    const transportOpts = { type: "http", url: MCP_URL };
    if (accessToken) {
      transportOpts.headers = { Authorization: `Bearer ${accessToken}` };
    }
    mcpClient = await createMCPClient({ transport: transportOpts });
  } catch (e) {
    console.log("\n=== Failed to create MCP client (likely auth/401) ===");
    console.error(e);
    return;
  }

  let tools;
  try {
    const result = await tryFetchTools(mcpClient);
    tools = result.tools;
    console.log("\n=== Connected. Available tools ===");
    for (const name of result.toolNames) console.log("-", name);
  } catch (err) {
    const errText = safeStringify(err);
    const unauthorized =
      String(err?.message ?? "").toLowerCase().includes("401") ||
      String(errText).toLowerCase().includes("unauthorized");

    if (!unauthorized) throw err;

    console.log(
      "\nAuth required (HTTP 401 Unauthorized). Starting interactive login guidance..."
    );

    const loginUrl = extractFirstUrl(errText);
    if (loginUrl) {
      console.log("Detected possible login URL:", loginUrl);
      const opened = await openBrowser(loginUrl);
      if (opened) console.log("Opened browser for login.");
      else console.log("Could not auto-open browser. Login URL printed for you.");
    } else {
      console.log(
        "Could not automatically find a login URL in the error. You can manually authenticate via your MCP client flow (e.g., Blackbox UI / browser login prompt)."
      );
    }

    console.log(
      "\nAfter logging in in your browser, re-running the demo below is the safest flow."
    );
    console.log(
      "Re-run this script with the same command once you complete login."
    );

    await new Promise((r) => setTimeout(r, 1500));
    try {
      const result = await tryFetchTools(mcpClient);
      tools = result.tools;
      console.log("\n=== Connected after auth retry. Available tools ===");
      for (const name of result.toolNames) console.log("-", name);
    } catch (retryErr) {
      console.log("\nStill unauthorized after retry. Printing error:");
      console.error(retryErr);
      return;
    }
  }

  // Print schemas for key tools
  if (tools) {
    console.log("\n=== Tool schemas ===");
    for (const name of ["search_docs", "list_tables", "execute_sql", "get_project_url"]) {
      console.log(`\n--- ${name} ---`);
      printToolSchema(tools, name);
    }
  }

  // Demo: search_docs
  console.log("\n=== Demo: search_docs ===");
  try {
    const result = await mcpClient.callTool({
      name: "search_docs",
      args: { graphql_query: `{ search(query: "supabase mcp") { title url } }` },
    });
    console.log("search_docs output:\n", safeStringify(result));
  } catch (err) {
    console.log("search_docs failed. Error:");
    console.error(err);
  }

  // Demo: get_project_url
  console.log("\n=== Demo: get_project_url ===");
  try {
    const result = await mcpClient.callTool({
      name: "get_project_url",
      args: {},
    });
    console.log("get_project_url output:\n", safeStringify(result));
  } catch (err) {
    console.log("get_project_url failed. Error:");
    console.error(err);
  }

  // Demo: list_tables
  console.log("\n=== Demo: list_tables (public schema) ===");
  try {
    const result = await mcpClient.callTool({
      name: "list_tables",
      args: { schemas: ["public"], verbose: true },
    });
    console.log("list_tables output:\n", safeStringify(result));
  } catch (err) {
    console.log("list_tables failed. Error:");
    console.error(err);
  }
}

main().catch((e) => {
  console.error("Fatal error running demo:", e);
  process.exit(1);
});
