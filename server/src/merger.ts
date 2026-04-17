import { readFileSync } from "fs";
import matter from "gray-matter";
import { ProjectConfig, log } from "./config.js";

interface Section {
  heading: string;
  body: string;
}

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
export function mergeContent(
  layerPaths: string[],
  projectConfig: ProjectConfig | undefined
): string {
  if (layerPaths.length === 0) {
    return "";
  }

  // Parse all layers into section maps
  const layerSections = layerPaths.map((path) => {
    try {
      const raw = readFileSync(path, "utf-8");
      const { content } = matter(raw);
      return parseSections(content);
    } catch (err) {
      log(`Failed to read layer file ${path}: ${err}`);
      return [];
    }
  });

  // Start with first layer as base
  let merged = layerSections[0];

  // Apply each subsequent layer as overlay
  for (let i = 1; i < layerSections.length; i++) {
    merged = applySectionOverlay(merged, layerSections[i]);
  }

  // Reassemble into markdown
  let result = assembleSections(merged);

  // Substitute placeholders
  if (projectConfig?.placeholders) {
    result = substitutePlaceholders(result, projectConfig.placeholders);
  }

  return result.trim();
}

/**
 * Parse markdown into sections. Each section starts at a `## ` heading
 * and includes everything until the next `## ` heading.
 *
 * Content before the first `## ` heading is treated as a preamble section
 * with an empty heading.
 */
function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const lines = markdown.split("\n");

  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // Save previous section
      if (currentHeading !== "" || currentBody.length > 0) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join("\n"),
        });
      }

      currentHeading = line;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // Save last section
  if (currentHeading !== "" || currentBody.length > 0) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join("\n"),
    });
  }

  return sections;
}

/**
 * Apply overlay sections onto base sections.
 * Matching is done by normalized heading text (case-insensitive, trimmed).
 * Matching sections are replaced in-place. New sections are appended.
 */
function applySectionOverlay(
  base: Section[],
  overlay: Section[]
): Section[] {
  const result = base.map((s) => ({ ...s }));
  const baseIndex = new Map<string, number>();

  for (let i = 0; i < result.length; i++) {
    const key = normalizeHeading(result[i].heading);
    if (key) {
      baseIndex.set(key, i);
    }
  }

  for (const overlaySection of overlay) {
    const key = normalizeHeading(overlaySection.heading);

    if (key && baseIndex.has(key)) {
      // Replace matching section
      const idx = baseIndex.get(key)!;
      result[idx] = { ...overlaySection };
    } else if (overlaySection.heading === "" && result.length > 0 && result[0].heading === "") {
      // Merge preamble: overlay preamble replaces base preamble
      result[0] = { ...overlaySection };
    } else {
      // Append new section
      result.push({ ...overlaySection });
    }
  }

  return result;
}

/**
 * Normalize a heading for case-insensitive matching.
 * Strips the `## ` prefix, lowercases, and trims whitespace.
 */
function normalizeHeading(heading: string): string {
  return heading.replace(/^##\s+/, "").trim().toLowerCase();
}

/**
 * Reassemble sections into a single markdown string.
 */
function assembleSections(sections: Section[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    if (section.heading) {
      parts.push(section.heading);
    }
    parts.push(section.body);
  }

  return parts.join("\n");
}

/**
 * Replace all `{{KEY}}` placeholders with values from the placeholders map.
 */
function substitutePlaceholders(
  content: string,
  placeholders: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(placeholders)) {
    const pattern = new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, "g");
    result = result.replace(pattern, value);
  }

  return result;
}

/** Escape special regex characters in a string. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
