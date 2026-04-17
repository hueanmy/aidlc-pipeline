import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export interface ProjectConfig {
  projectName: string;
  platform: string;
  placeholders: Record<string, string>;
}

export interface ServerConfig {
  platform: string | undefined;
  project: string | undefined;
  contentRoot: string;
  projectConfig: ProjectConfig | undefined;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Read env vars and resolve the content root directory.
 * At runtime, __dirname is server/dist/, so we go up two levels to
 * cf-sdlc-pipeline/, then into content/.
 */
export function loadConfig(): ServerConfig {
  const platform = process.env.SDLC_PLATFORM || undefined;
  const project = process.env.SDLC_PROJECT || undefined;
  const contentRoot = process.env.SDLC_CONTENT_ROOT || join(__dirname, "..", "..", "content");

  let projectConfig: ProjectConfig | undefined;

  if (project) {
    const configPath = join(contentRoot, "projects", project, "config.json");
    try {
      const raw = readFileSync(configPath, "utf-8");
      projectConfig = JSON.parse(raw) as ProjectConfig;
    } catch {
      log(`No project config found at ${configPath}, skipping project layer`);
    }
  }

  log(`Platform: ${platform ?? "(none)"}`);
  log(`Project: ${project ?? "(none)"}`);
  log(`Content root: ${contentRoot}`);

  return { platform, project, contentRoot, projectConfig };
}

/** Log to stderr so we don't interfere with MCP's stdout protocol. */
export function log(message: string): void {
  process.stderr.write(`[sdlc-server] ${message}\n`);
}
