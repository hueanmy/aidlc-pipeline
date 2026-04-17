import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
/**
 * Read env vars and resolve the content root directory.
 * At runtime, __dirname is server/dist/, so we go up two levels to
 * cf-sdlc-pipeline/, then into content/.
 */
export function loadConfig() {
    const platform = process.env.SDLC_PLATFORM || undefined;
    const project = process.env.SDLC_PROJECT || undefined;
    const contentRoot = process.env.SDLC_CONTENT_ROOT || join(__dirname, "..", "..", "content");
    let projectConfig;
    if (project) {
        const configPath = join(contentRoot, "projects", project, "config.json");
        try {
            const raw = readFileSync(configPath, "utf-8");
            projectConfig = JSON.parse(raw);
        }
        catch {
            log(`No project config found at ${configPath}, skipping project layer`);
        }
    }
    log(`Platform: ${platform ?? "(none)"}`);
    log(`Project: ${project ?? "(none)"}`);
    log(`Content root: ${contentRoot}`);
    return { platform, project, contentRoot, projectConfig };
}
/** Log to stderr so we don't interfere with MCP's stdout protocol. */
export function log(message) {
    process.stderr.write(`[sdlc-server] ${message}\n`);
}
//# sourceMappingURL=config.js.map