#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { log } from "./config.js";
import { createMcpServer } from "./mcp.js";

async function main(): Promise<void> {
  const { server } = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("MCP server started on stdio");
}

main().catch((err) => {
  log(`Fatal error: ${err}`);
  process.exit(1);
});
