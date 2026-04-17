import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { log } from "./config.js";
import { createMcpServer } from "./mcp.js";
const PORT = parseInt(process.env.PORT || "3100", 10);
const app = express();
// Store active transports by session
const sessions = new Map();
// SSE endpoint — client connects here to establish the stream
app.get("/sse", (req, res) => {
    // Read platform/project from query params or env
    const platform = req.query.platform || process.env.SDLC_PLATFORM;
    const project = req.query.project || process.env.SDLC_PROJECT;
    log(`SSE connection: platform=${platform ?? "none"}, project=${project ?? "none"}`);
    const { server } = createMcpServer({ platform, project });
    const transport = new SSEServerTransport("/messages", res);
    sessions.set(transport.sessionId, transport);
    res.on("close", () => {
        sessions.delete(transport.sessionId);
        log(`Session ${transport.sessionId} closed`);
    });
    server.connect(transport).catch((err) => {
        log(`SSE connect error: ${err}`);
    });
});
// Message endpoint — client sends JSON-RPC messages here
app.post("/messages", express.json(), (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = sessions.get(sessionId);
    if (!transport) {
        res.status(404).json({ error: "Session not found" });
        return;
    }
    transport.handlePostMessage(req, res).catch((err) => {
        log(`Message error: ${err}`);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    });
});
// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        sessions: sessions.size,
        platform: process.env.SDLC_PLATFORM ?? null,
        project: process.env.SDLC_PROJECT ?? null,
    });
});
app.listen(PORT, () => {
    log(`Remote MCP server listening on http://localhost:${PORT}`);
    log(`SSE endpoint: http://localhost:${PORT}/sse`);
    log(`Health check: http://localhost:${PORT}/health`);
    log(`Connect with: http://localhost:${PORT}/sse?platform=mobile&project=sample-project`);
});
//# sourceMappingURL=serve.js.map