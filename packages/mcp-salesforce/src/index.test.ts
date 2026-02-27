import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./index";

describe("Salesforce MCP Server", () => {
  let server: Server;
  let client: Client;

  beforeEach(async () => {
    server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    
    await server.connect(serverTransport);
    
    client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("should list Salesforce tools", async () => {
    const response = await client.listTools();
    const names = response.tools.map(t => t.name);
    
    expect(names).toContain("fetch_account");
    expect(names).toContain("fetch_opportunity");
  });

  it("should fetch Account data", async () => {
    const response = await client.callTool({
      name: "fetch_account",
      arguments: { id: "001" }
    });

    const content = response.content as any[];
    const data = JSON.parse(content[0].text);
    expect(data).toHaveProperty("id", "001");
    expect(data).toHaveProperty("name", "Mock Account 001");
  });

  it("should fetch Opportunity data", async () => {
    const response = await client.callTool({
      name: "fetch_opportunity",
      arguments: { id: "OPP1" }
    });

    const content = response.content as any[];
    const data = JSON.parse(content[0].text);
    expect(data).toHaveProperty("id", "OPP1");
    expect(data).toHaveProperty("amount", 10000);
  });

  it("should assert client context extraction", async () => {
    const response = await client.callTool({
      name: "get_client_context",
      arguments: {}
    });

    const content = response.content as any[];
    const data = JSON.parse(content[0].text);
    expect(data).toHaveProperty("name", "test-client");
    expect(data).toHaveProperty("version", "1.0.0");
  });
});
