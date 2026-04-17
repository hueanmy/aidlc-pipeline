import { ProjectConfig } from "./config.js";
/**
 * Merge multiple layer files using section-based overlay logic,
 * then substitute {{PLACEHOLDER}} variables from project config.
 *
 * Merge rules:
 * - Parse each file into sections by `## ` headings
 * - Start with the first layer (generic) as base
 * - For each subsequent layer, replace matching sections (case-insensitive heading match)
 * - New sections from overlays are appended at the end
 * - Final pass: replace all `{{PLACEHOLDER}}` with values from config.json
 */
export declare function mergeContent(layerPaths: string[], projectConfig: ProjectConfig | undefined): string;
//# sourceMappingURL=merger.d.ts.map