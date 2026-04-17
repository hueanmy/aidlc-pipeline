import { readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { ServerConfig, log } from "./config.js";

export type ContentKind = "agents" | "skills" | "templates";

export interface ContentEntry {
  name: string;
  kind: ContentKind;
  /** Paths in merge order: generic, platform, project. Only existing files. */
  layers: string[];
}

export interface ContentIndex {
  agents: Map<string, ContentEntry>;
  skills: Map<string, ContentEntry>;
  templates: Map<string, ContentEntry>;
}

/**
 * Scan the content/ directory and build an index of all available content.
 * For each item, records which layer files exist (generic, platform, project).
 */
export function buildIndex(config: ServerConfig): ContentIndex {
  const index: ContentIndex = {
    agents: new Map(),
    skills: new Map(),
    templates: new Map(),
  };

  // Scan agents: flat .md files
  scanFlatFiles(config, "agents", index.agents);

  // Scan skills: directories containing SKILL.md
  scanSkillDirs(config, index.skills);

  // Scan templates: flat .md files
  scanFlatFiles(config, "templates", index.templates);

  log(
    `Index built: ${index.agents.size} agents, ${index.skills.size} skills, ${index.templates.size} templates`
  );

  return index;
}

/**
 * Scan flat .md files (agents, templates).
 * Name is derived from filename without extension.
 */
function scanFlatFiles(
  config: ServerConfig,
  kind: ContentKind,
  map: Map<string, ContentEntry>
): void {
  const layerDirs = getLayerDirs(config, kind);

  for (const dir of layerDirs) {
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const name = basename(file, ".md");
      const filePath = join(dir, file);

      if (!map.has(name)) {
        map.set(name, { name, kind, layers: [] });
      }
      map.get(name)!.layers.push(filePath);
    }
  }
}

/**
 * Scan skill directories. Each skill is a directory containing SKILL.md.
 */
function scanSkillDirs(
  config: ServerConfig,
  map: Map<string, ContentEntry>
): void {
  const layerDirs = getLayerDirs(config, "skills");

  for (const dir of layerDirs) {
    if (!existsSync(dir)) continue;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillFile = join(dir, entry.name, "SKILL.md");
      if (!existsSync(skillFile)) continue;

      const name = entry.name;
      if (!map.has(name)) {
        map.set(name, { name, kind: "skills", layers: [] });
      }
      map.get(name)!.layers.push(skillFile);
    }
  }
}

/**
 * Return the ordered list of layer directories for a given content kind.
 * Order: generic -> platform -> project
 */
function getLayerDirs(config: ServerConfig, kind: ContentKind): string[] {
  const dirs: string[] = [];

  // Layer 1: generic
  dirs.push(join(config.contentRoot, "generic", kind));

  // Layer 2: platform
  if (config.platform) {
    dirs.push(join(config.contentRoot, "platforms", config.platform, kind));
  }

  // Layer 3: project
  if (config.project) {
    dirs.push(join(config.contentRoot, "projects", config.project, kind));
  }

  return dirs;
}
