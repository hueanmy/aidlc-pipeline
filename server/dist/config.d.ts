export interface ProjectConfig {
    projectName: string;
    placeholders: Record<string, string>;
}
export interface ServerConfig {
    project: string | undefined;
    contentRoot: string;
    projectConfig: ProjectConfig | undefined;
}
/**
 * Read env vars and resolve the content root directory.
 * At runtime, __dirname is server/dist/, so we go up two levels to
 * the package root where skills/, agents/, templates/ live.
 */
export declare function loadConfig(): ServerConfig;
/** Log to stderr so we don't interfere with MCP's stdout protocol. */
export declare function log(message: string): void;
//# sourceMappingURL=config.d.ts.map