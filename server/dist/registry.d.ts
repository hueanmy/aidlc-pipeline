import { ServerConfig } from "./config.js";
export type ContentKind = "agents" | "skills" | "templates";
export interface ContentEntry {
    name: string;
    kind: ContentKind;
    /** Paths in merge order: generic, project. Only existing files. */
    layers: string[];
}
export interface ContentIndex {
    agents: Map<string, ContentEntry>;
    skills: Map<string, ContentEntry>;
    templates: Map<string, ContentEntry>;
}
/**
 * Scan the content root and build an index of all available content.
 * For each item, records which layer files exist (generic, project).
 */
export declare function buildIndex(config: ServerConfig): ContentIndex;
//# sourceMappingURL=registry.d.ts.map