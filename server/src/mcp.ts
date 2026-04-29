import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync, symlinkSync, lstatSync, rmSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadConfig, log } from "./config.js";
import type { ServerConfig } from "./config.js";
import { buildIndex } from "./registry.js";
import type { ContentIndex, ContentEntry } from "./registry.js";
import { mergeContent } from "./merger.js";
import {
  loadReviewMatrix,
  writeEpic,
  startPhase,
  setPhaseStatus,
  buildPhaseContext,
  cascadeReject,
  amendAffectedModules,
  getEpicStatus,
  listWorkspaceModules,
} from "./orchestrator.js";
import type { PhaseStatus, ReviewVerdict, EpicMetadata } from "./orchestrator.js";

export interface McpInstance {
  server: McpServer;
  config: ServerConfig;
}

/** Safe lstat that returns false instead of throwing for non-existent paths */
function lstatSafe(p: string): boolean {
  try { lstatSync(p); return true; } catch { return false; }
}

function ensureDocsScaffold(workspace: string): string[] {
  const results: string[] = [];
  const docsRoot = join(workspace, "docs", "sdlc");
  const workflowDir = join(docsRoot, "workflow");
  const epicsDir = join(docsRoot, "epics");

  mkdirSync(workflowDir, { recursive: true });
  mkdirSync(epicsDir, { recursive: true });

  const exampleKey = "EPIC-1000";
  const exampleDir = join(epicsDir, exampleKey);
  mkdirSync(exampleDir, { recursive: true });

  const workflowReadme = join(workflowDir, "README.md");
  if (!existsSync(workflowReadme)) {
    const workflowContent = [
      "# SDLC Workflow",
      "",
      "This folder documents your SDLC operating model for epics.",
      "",
      "## Default flow",
      "Plan -> Design -> Test Plan -> Implement -> Review -> UAT -> Release -> Monitor -> Doc Sync",
      "",
      "## How to use",
      "1. Keep one folder per epic under docs/sdlc/epics/.",
      "2. Track each phase artifact (PRD, design, test plan, UAT, doc sync).",
      "3. Use the aidlc dashboard to monitor phase progress and owners.",
      "",
    ].join("\n");
    writeFileSync(workflowReadme, workflowContent, "utf-8");
    results.push("docs/sdlc/workflow/README.md");
  }

  const epicDoc = join(exampleDir, `${exampleKey}.md`);
  if (!existsSync(epicDoc)) {
    const epicContent = [
      `# ${exampleKey} - Reference epic`,
      "",
      "## Goal",
      "Provide a reference epic so teams can validate the dashboard and phase workflow end-to-end.",
      "",
      "## Acceptance Criteria",
      "- AC1: PRD and tech design artifacts are created and linked.",
      "- AC2: Test plan includes positive, negative, and rollback scenarios.",
      "- AC3: Release and monitor checklist is documented before production rollout.",
      "",
      "## Notes",
      "Replace this epic with your real business epic once setup is confirmed.",
      "",
    ].join("\n");
    writeFileSync(epicDoc, epicContent, "utf-8");
    results.push(`docs/sdlc/epics/${exampleKey}/${exampleKey}.md`);
  }

  const prdDoc = join(exampleDir, "PRD.md");
  if (!existsSync(prdDoc)) {
    const prdContent = [
      `# PRD - ${exampleKey}`,
      "",
      "## Problem Statement",
      "Current workflow has inconsistent delivery quality across planning, implementation, and verification.",
      "",
      "## Proposed Scope",
      "Define an epic-level pipeline that aligns PO, Tech Lead, Developer, QA, Release, and SRE responsibilities.",
      "",
      "## Success Metrics",
      "- Delivery lead time reduced by at least 20%",
      "- Defect leakage after release reduced by at least 30%",
      "- 100% epics have required SDLC artifacts in docs/sdlc/epics/",
      "",
    ].join("\n");
    writeFileSync(prdDoc, prdContent, "utf-8");
    results.push(`docs/sdlc/epics/${exampleKey}/PRD.md`);
  }

  return results;
}

export function createMcpServer(overrides?: {
  project?: string;
}): McpInstance {
  if (overrides?.project) process.env.SDLC_PROJECT = overrides.project;

  const config = loadConfig();
  const index = buildIndex(config);

  function resolveContent(entry: ContentEntry): string {
    return mergeContent(entry.layers, config.projectConfig);
  }

  const server = new McpServer({
    name: "aidlc-pipeline",
    version: "1.0.0",
  });

  server.tool("list_agents", "List all available SDLC agent names", {}, () => ({
    content: [{ type: "text" as const, text: JSON.stringify(Array.from(index.agents.keys()).sort(), null, 2) }],
  }));

  server.tool(
    "get_agent",
    "Get merged markdown for a specific SDLC agent",
    { name: z.string().describe("Agent name (e.g. 'developer', 'tech-lead')") },
    ({ name }) => {
      const entry = index.agents.get(name);
      if (!entry) return { content: [{ type: "text" as const, text: `Agent '${name}' not found` }], isError: true };
      return { content: [{ type: "text" as const, text: resolveContent(entry) }] };
    }
  );

  server.tool("list_skills", "List all available SDLC skill names", {}, () => ({
    content: [{ type: "text" as const, text: JSON.stringify(Array.from(index.skills.keys()).sort(), null, 2) }],
  }));

  server.tool(
    "get_skill",
    "Get merged markdown for a specific SDLC skill",
    { name: z.string().describe("Skill name (e.g. 'prd', 'tech-design')") },
    ({ name }) => {
      const entry = index.skills.get(name);
      if (!entry) return { content: [{ type: "text" as const, text: `Skill '${name}' not found` }], isError: true };
      return { content: [{ type: "text" as const, text: resolveContent(entry) }] };
    }
  );

  server.tool("list_templates", "List all available SDLC template names", {}, () => ({
    content: [{ type: "text" as const, text: JSON.stringify(Array.from(index.templates.keys()).sort(), null, 2) }],
  }));

  server.tool(
    "get_template",
    "Get merged markdown for a specific SDLC template",
    { name: z.string().describe("Template name (e.g. 'PRD-TEMPLATE', 'TECH-DESIGN-TEMPLATE')") },
    ({ name }) => {
      const entry = index.templates.get(name);
      if (!entry) return { content: [{ type: "text" as const, text: `Template '${name}' not found` }], isError: true };
      return { content: [{ type: "text" as const, text: resolveContent(entry) }] };
    }
  );

  function syncWorkspace(workspace: string): string[] {
    const results: string[] = [];
    const skillsDir = join(workspace, ".claude", "skills");
    const agentsDir = join(workspace, ".claude", "agents");

    const scaffolded = ensureDocsScaffold(workspace);
    results.push(...scaffolded);

    mkdirSync(skillsDir, { recursive: true });
    mkdirSync(agentsDir, { recursive: true });

    // Install skills (only if missing — user edits are preserved)
    for (const [name, entry] of index.skills) {
      const dir = join(skillsDir, name);
      const skillFile = join(dir, "SKILL.md");
      if (!existsSync(skillFile)) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(skillFile, resolveContent(entry), "utf-8");
        results.push(`skill/${name}`);
      }
    }

    // Install _gate-check.md (flat file, not in skill index)
    const gateCheckPath = join(skillsDir, "_gate-check.md");
    if (!existsSync(gateCheckPath)) {
      const gateCheckLayers: string[] = [];
      const layerBases = [join(config.contentRoot, "skills")];
      if (config.project) layerBases.push(join(config.contentRoot, "projects", config.project, "skills"));
      for (const base of layerBases) {
        const p = join(base, "_gate-check.md");
        if (existsSync(p)) gateCheckLayers.push(p);
      }
      if (gateCheckLayers.length > 0) {
        const content = mergeContent(gateCheckLayers, config.projectConfig);
        writeFileSync(gateCheckPath, content, "utf-8");
        results.push("_gate-check.md");
      }
    }

    // Install agents (only if missing — user edits are preserved)
    for (const [name, entry] of index.agents) {
      const agentFile = join(agentsDir, `${name}.md`);
      if (!existsSync(agentFile)) {
        writeFileSync(agentFile, resolveContent(entry), "utf-8");
        results.push(`agent/${name}`);
      }
    }

    // Install schemas (epic.schema.md, status.schema.md) — referenced by
    // orchestrator/auto-reviewer agents and by /advance-epic.
    const schemasSrcDir = join(config.contentRoot, "schemas");
    if (existsSync(schemasSrcDir)) {
      const schemasDir = join(workspace, ".claude", "schemas");
      mkdirSync(schemasDir, { recursive: true });
      for (const file of readdirSync(schemasSrcDir).filter((f) => f.endsWith(".md"))) {
        const dst = join(schemasDir, file);
        if (!existsSync(dst)) {
          writeFileSync(dst, readFileSync(join(schemasSrcDir, file), "utf-8"), "utf-8");
          results.push(`schema/${file}`);
        }
      }
    }

    // Symlink project docs (core-business, its, workflow) into docs/
    // Single source of truth — edit in project = edit in content source
    if (config.project) {
      const projectDir = join(config.contentRoot, "projects", config.project);
      const docFolders = ["core-business", "its", "workflow"];
      const docsDir = join(workspace, "docs");
      mkdirSync(docsDir, { recursive: true });

      for (const folder of docFolders) {
        const srcDir = join(projectDir, folder);
        if (!existsSync(srcDir)) continue;

        const linkPath = join(docsDir, folder);

        // Remove existing (file, dir, or stale symlink)
        if (existsSync(linkPath) || lstatSafe(linkPath)) {
          rmSync(linkPath, { recursive: true, force: true });
        }

        symlinkSync(srcDir, linkPath, "dir");
        results.push(`docs/${folder} → symlink`);
      }
    }

    // Symlink project scripts into .claude/scripts/
    if (config.project) {
      const srcScriptsDir = join(config.contentRoot, "projects", config.project, "scripts");
      if (existsSync(srcScriptsDir)) {
        const linkPath = join(workspace, ".claude", "scripts");
        mkdirSync(join(workspace, ".claude"), { recursive: true });

        if (existsSync(linkPath) || lstatSafe(linkPath)) {
          rmSync(linkPath, { recursive: true, force: true });
        }

        symlinkSync(srcScriptsDir, linkPath, "dir");
        results.push(`scripts → symlink`);
      }
    }

    return results;
  }

  // Auto-sync on startup: sync docs, skills, agents, scripts to cwd
  const workspace = process.cwd();
  const autoSyncResults = syncWorkspace(workspace);
  log(`Auto-sync completed: ${autoSyncResults.length} items synced to ${workspace}`);

  server.tool(
    "setup",
    "Install SDLC skills and agents into a project workspace (.claude/ directory), and scaffold docs/sdlc workflow + epic example.",
    { workspace: z.string().describe("Absolute path to the project workspace root") },
    ({ workspace: ws }) => {
      const results = syncWorkspace(ws);
      log(`Setup completed: ${results.length} items installed to ${ws}`);

      return {
        content: [{
          type: "text" as const,
          text: `Installed ${results.length} items into ${ws}:\n${results.map(r => `  ✓ ${r}`).join("\n")}`,
        }],
      };
    }
  );

  // -------------------------------------------------------------------------
  // Orchestrator tools — drive the full-auto SDLC loop.
  //
  // All tools take `workspace` (absolute path to the user's project root, where
  // docs/sdlc/epics/ lives) because a single MCP server may serve multiple
  // projects. Epic state is on-disk under the workspace.
  // -------------------------------------------------------------------------

  const PhaseEnum = z.enum([
    "plan",
    "design",
    "test-plan",
    "implement",
    "review",
    "execute-test",
    "release",
    "monitor",
    "doc-sync",
  ]);

  const StatusEnum = z.enum([
    "pending",
    "in_progress",
    "in_review",
    "awaiting_human_review",
    "passed",
    "rejected",
    "stale",
    "failed_needs_human",
  ]);

  const VerdictSchema = z
    .object({
      decision: z.enum(["pass", "reject"]),
      reviewer: z.string(),
      at: z.string().optional(),
      reject_to: PhaseEnum.optional(),
      reason: z.string(),
      checklist_results: z.record(z.string(), z.enum(["pass", "fail"])).optional(),
    })
    .optional();

  function jsonResult(obj: unknown) {
    return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
  }

  function errorResult(msg: string) {
    return { content: [{ type: "text" as const, text: msg }], isError: true };
  }

  server.tool(
    "epic_status",
    "Get full status report for an epic: metadata, per-phase status, and the next step the orchestrator should take. Used by the Orchestrator at the top of every loop iteration.",
    {
      workspace: z.string().describe("Absolute path to the user's project root"),
      epic_id: z.string().describe("Epic key, e.g. EPIC-123"),
    },
    ({ workspace, epic_id }) => {
      try {
        const matrix = loadReviewMatrix(config);
        return jsonResult(getEpicStatus(workspace, epic_id, matrix));
      } catch (err) {
        return errorResult(`epic_status failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "phase_context",
    "Build the context payload the Orchestrator passes to a worker for a given phase. Returns epic metadata, selected core-business files (from <workspace>/docs/core-business/), its/workflow paths, upstream artifact paths, and the phase's checklist.",
    {
      workspace: z.string().describe("Absolute path to the user's project root"),
      epic_id: z.string().describe("Epic key"),
      phase: PhaseEnum.describe("Phase id"),
    },
    ({ workspace, epic_id, phase }) => {
      try {
        const matrix = loadReviewMatrix(config);
        return jsonResult(buildPhaseContext(config, workspace, epic_id, phase, matrix));
      } catch (err) {
        return errorResult(`phase_context failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "start_phase",
    "Begin a new (re)run of a phase. Archives prior artifacts if stale/rejected, bumps revision, and sets status to in_progress. Call this BEFORE dispatching the worker.",
    {
      workspace: z.string(),
      epic_id: z.string(),
      phase: PhaseEnum,
    },
    ({ workspace, epic_id, phase }) => {
      try {
        return jsonResult(startPhase(workspace, epic_id, phase));
      } catch (err) {
        return errorResult(`start_phase failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "set_phase_status",
    "Transition a phase status WITHOUT archival. Use for: in_review (auto-reviewer started), passed, awaiting_human_review (at a human gate), failed_needs_human (retries exhausted). For rejected, use reject_gate; for beginning a new run, use start_phase.",
    {
      workspace: z.string(),
      epic_id: z.string(),
      phase: PhaseEnum,
      status: StatusEnum,
      verdict: VerdictSchema,
    },
    ({ workspace, epic_id, phase, status, verdict }) => {
      try {
        const stampedVerdict: ReviewVerdict | undefined = verdict
          ? { ...verdict, at: verdict.at ?? new Date().toISOString() }
          : undefined;
        return jsonResult(setPhaseStatus(workspace, epic_id, phase, status as PhaseStatus, stampedVerdict));
      } catch (err) {
        return errorResult(`set_phase_status failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "reject_gate",
    "Reject a phase back to an upstream phase (cascade). The target is archived + revision-bumped + marked rejected. Intermediate passed phases are marked stale. The reviewer (human from extension or auto-reviewer) is recorded in the verdict.",
    {
      workspace: z.string(),
      epic_id: z.string(),
      from_phase: PhaseEnum.describe("Phase that produced the reject"),
      reject_to: PhaseEnum.describe("Upstream phase to bounce back to"),
      reason: z.string().describe("Why the reject happened — surfaced in the UI"),
      reviewer: z.string().describe("e.g. 'auto-reviewer' or 'human:<email>'"),
    },
    ({ workspace, epic_id, from_phase, reject_to, reason, reviewer }) => {
      try {
        const matrix = loadReviewMatrix(config);
        const verdict: ReviewVerdict = {
          decision: "reject",
          reviewer,
          at: new Date().toISOString(),
          reject_to,
          reason,
        };
        cascadeReject(workspace, epic_id, from_phase, reject_to, verdict, matrix);
        return jsonResult({ ok: true, verdict });
      } catch (err) {
        return errorResult(`reject_gate failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "amend_affected_modules",
    "Append-only: add modules to epic.json's affected_modules and log the entry in module_amend_log. Used by the Tech Lead at the Design phase when additional modules are discovered. Cannot remove modules — if a declared module turns out to be wrong, reject back to Plan so the PO re-scopes.",
    {
      workspace: z.string(),
      epic_id: z.string(),
      by: z.string().describe("Agent id, e.g. 'tech-lead'"),
      added: z.array(z.string()).min(1).describe("Modules to append (append-only, no removal)"),
      reason: z.string(),
    },
    ({ workspace, epic_id, by, added, reason }) => {
      try {
        return jsonResult(amendAffectedModules(workspace, epic_id, by, added, reason));
      } catch (err) {
        return errorResult(`amend_affected_modules failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "list_project_modules",
    "List the available core-business module filenames in the user's workspace (<workspace>/docs/core-business/*.md). Used as a fallback when the PO needs to pick affected_modules for a new epic. Returns an empty list (not an error) if the folder doesn't exist.",
    {
      workspace: z.string().describe("Absolute path to the user's project root"),
    },
    ({ workspace }) => {
      try {
        return jsonResult(listWorkspaceModules(workspace));
      } catch (err) {
        return errorResult(`list_project_modules failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  server.tool(
    "init_epic",
    "Create or overwrite docs/sdlc/epics/<epic_id>/epic.json with the given metadata. Used by /epic or by the user when bootstrapping a new epic for /advance-epic.",
    {
      workspace: z.string(),
      epic_id: z.string(),
      project: z.string(),
      brief: z.string(),
      affected_modules: z.array(z.string()).default([]),
      title: z.string().optional(),
      owner: z.string().optional(),
    },
    ({ workspace, epic_id, project, brief, affected_modules, title, owner }) => {
      try {
        const epic: EpicMetadata = {
          epic_id,
          project,
          brief,
          affected_modules,
          ...(title ? { title } : {}),
          ...(owner ? { owner } : {}),
        };
        writeEpic(workspace, epic);
        return jsonResult({ ok: true, epic });
      } catch (err) {
        return errorResult(`init_epic failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  );

  return { server, config };
}
