import { readFileSync, existsSync } from "fs";
import path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DATA_DIR = path.join(__dirname, "..", "data");

function loadJson<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!existsSync(filePath)) return fallback;
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    return raw as T;
  } catch {
    return fallback;
  }
}

type Account = { id: string; name: string; [k: string]: unknown };
type Opportunity = { id: string; accountId?: string; name: string; amount: number; [k: string]: unknown };
type ClientContext = { id: string; name: string; version: string; [k: string]: unknown };

const accounts: Account[] = loadJson<Account[]>("accounts.json", []);
const opportunities: Opportunity[] = loadJson<Opportunity[]>("opportunities.json", []);
const clientContexts: ClientContext[] = loadJson<ClientContext[]>("client-context.json", [
  { id: "default", name: "test-client", version: "1.0.0" },
]);

export function createServer(): Server {
  const server = new Server(
    {
      name: "mcp-salesforce",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "fetch_account",
          description: "Fetch Account data from Salesforce",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Account ID" },
            },
            required: ["id"],
          },
        },
        {
          name: "fetch_opportunity",
          description: "Fetch Opportunity data from Salesforce",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Opportunity ID" },
            },
            required: ["id"],
          },
        },
        {
          name: "get_client_context",
          description: "Get the client context (optional id: context id from client-context.json, e.g. default, airia-demo)",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Optional client context id (default, e2e, airia-demo, techcorp, etc.)" },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "fetch_account") {
      const id = String(args?.id ?? "").trim();
      const account = accounts.find((a) => a.id === id);
      const payload = account ?? { id, name: `Mock Account ${id}` };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    }

    if (name === "fetch_opportunity") {
      const id = String(args?.id ?? "").trim();
      const opportunity = opportunities.find((o) => o.id === id);
      const payload = opportunity ?? { id, amount: 10000 };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    }

    if (name === "get_client_context") {
      const requestedId = (args?.id ?? request.params?._meta?.clientId ?? "test-client") as string;
      const ctx = clientContexts.find((c) => c.id === requestedId) ?? clientContexts[0] ?? { name: "test-client", version: "1.0.0" };
      return {
        content: [{ type: "text", text: JSON.stringify(ctx, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  });

  return server;
}
