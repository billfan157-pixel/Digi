import { createMCPClient } from "@ai-sdk/mcp";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Remove read_only for write operations
const mcp = await createMCPClient({
  transport: {
    type: "http",
    url: "https://mcp.supabase.com/mcp?project_ref=plbwqjdrivyffrhpbmvm",
    headers: { Authorization: `Bearer ${TOKEN}` },
  },
});

console.log("=== Adding expires_at column ===");
let r = await mcp.callTool({
  name: "execute_sql",
  args: { query: `ALTER TABLE public.user_quests ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;` },
});
console.log("Add column:", JSON.stringify(r, null, 2));

if (!r.isError) {
  console.log("\n=== Backfilling expires_at ===");
  r = await mcp.callTool({
    name: "execute_sql",
    args: { query: `UPDATE public.user_quests SET expires_at = (CURRENT_DATE + time '23:59:59' AT TIME ZONE 'UTC')::timestamptz WHERE expires_at IS NULL;` },
  });
  console.log("Backfill:", JSON.stringify(r, null, 2));
}

console.log("\n=== Verifying column exists ===");
r = await mcp.callTool({
  name: "execute_sql",
  args: { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='user_quests' ORDER BY ordinal_position" },
});
console.log("Columns:", JSON.stringify(r, null, 2));

await mcp.close();
