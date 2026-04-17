import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "./config.js";
export interface McpInstance {
    server: McpServer;
    config: ServerConfig;
}
export declare function createMcpServer(overrides?: {
    platform?: string;
    project?: string;
}): McpInstance;
//# sourceMappingURL=mcp.d.ts.map