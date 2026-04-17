import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync, symlinkSync, lstatSync, rmSync } from "fs";
import { join } from "path";
import { loadConfig, log } from "./config.js";
import { buildIndex } from "./registry.js";
import { mergeContent } from "./merger.js";
/** Safe lstat that returns false instead of throwing for non-existent paths */
function lstatSafe(p) {
    try {
        lstatSync(p);
        return true;
    }
    catch {
        return false;
    }
}
const DEFAULT_PLATFORM_EXAMPLE = {
    prefix: "EPIC",
    title: "Cross-platform onboarding optimization",
    workflow: "Plan -> Design -> Build -> Test -> Review -> UAT -> Release -> Monitor -> Doc Sync",
    itsHint: "Define integration points, constraints, and acceptance criteria for the target platform.",
};
const PLATFORM_EXAMPLES = {
    mobile: {
        prefix: "DRM",
        title: "Camera capture reliability improvements",
        workflow: "Plan -> Design -> Test Plan -> Implement -> Review -> UAT -> Release",
        itsHint: "Cover device matrix, app lifecycle, camera permissions, and offline upload behavior.",
    },
    web: {
        prefix: "WEB",
        title: "Checkout resilience and retry flow",
        workflow: "Plan -> Design -> Build -> Test -> Review -> Release -> Monitor",
        itsHint: "Include SSR/CSR behavior, browser support matrix, and API timeout handling.",
    },
    backend: {
        prefix: "API",
        title: "Order event ingestion hardening",
        workflow: "Plan -> Design -> Build -> Test -> Review -> Release -> Monitor",
        itsHint: "Document contracts, idempotency, retries, and observability metrics.",
    },
    desktop: {
        prefix: "DSK",
        title: "Offline draft synchronization",
        workflow: "Plan -> Design -> Build -> Test -> Review -> UAT -> Release",
        itsHint: "Detail filesystem constraints, migration behavior, and reconnect conflict rules.",
    },
    generic: {
        prefix: "EPIC",
        title: "Cross-platform onboarding optimization",
        workflow: "Plan -> Design -> Build -> Test -> Review -> UAT -> Release -> Monitor -> Doc Sync",
        itsHint: "Define integration points, constraints, and acceptance criteria for the target platform.",
    },
};
function getPlatformExample(platform) {
    if (!platform)
        return DEFAULT_PLATFORM_EXAMPLE;
    return PLATFORM_EXAMPLES[platform] ?? DEFAULT_PLATFORM_EXAMPLE;
}
function ensureDocsScaffold(workspace, config) {
    const results = [];
    const docsRoot = join(workspace, "docs", "sdlc");
    const workflowDir = join(docsRoot, "workflow");
    const epicsDir = join(docsRoot, "epics");
    mkdirSync(workflowDir, { recursive: true });
    mkdirSync(epicsDir, { recursive: true });
    const platformProfile = getPlatformExample(config.platform);
    const exampleKey = `${platformProfile.prefix}-1000`;
    const exampleDir = join(epicsDir, exampleKey);
    mkdirSync(exampleDir, { recursive: true });
    const workflowReadme = join(workflowDir, "README.md");
    if (!existsSync(workflowReadme)) {
        const workflowContent = [
            `# SDLC Workflow (${config.platform ?? "generic"})`,
            "",
            "This folder documents your SDLC operating model for epics.",
            "",
            "## Default flow",
            platformProfile.workflow,
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
            `# ${exampleKey} - ${platformProfile.title}`,
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
    const itsDoc = join(exampleDir, "ITS.md");
    if (!existsSync(itsDoc)) {
        const itsContent = [
            `# ITS - ${exampleKey}`,
            "",
            "## Integration Scope",
            platformProfile.itsHint,
            "",
            "## Dependencies",
            "- Existing product architecture and coding rules",
            "- CI pipeline for build and test automation",
            "- Monitoring and alerting baseline",
            "",
            "## Validation",
            "Document integration tests and edge-case scenarios that must pass before release.",
            "",
        ].join("\n");
        writeFileSync(itsDoc, itsContent, "utf-8");
        results.push(`docs/sdlc/epics/${exampleKey}/ITS.md`);
    }
    return results;
}
export function createMcpServer(overrides) {
    if (overrides?.platform)
        process.env.SDLC_PLATFORM = overrides.platform;
    if (overrides?.project)
        process.env.SDLC_PROJECT = overrides.project;
    const config = loadConfig();
    const index = buildIndex(config);
    function resolveContent(entry) {
        return mergeContent(entry.layers, config.projectConfig);
    }
    const server = new McpServer({
        name: "cf-sdlc-pipeline",
        version: "1.0.0",
    });
    server.tool("list_agents", "List all available SDLC agent names", {}, () => ({
        content: [{ type: "text", text: JSON.stringify(Array.from(index.agents.keys()).sort(), null, 2) }],
    }));
    server.tool("get_agent", "Get merged markdown for a specific SDLC agent", { name: z.string().describe("Agent name (e.g. 'developer', 'tech-lead')") }, ({ name }) => {
        const entry = index.agents.get(name);
        if (!entry)
            return { content: [{ type: "text", text: `Agent '${name}' not found` }], isError: true };
        return { content: [{ type: "text", text: resolveContent(entry) }] };
    });
    server.tool("list_skills", "List all available SDLC skill names", {}, () => ({
        content: [{ type: "text", text: JSON.stringify(Array.from(index.skills.keys()).sort(), null, 2) }],
    }));
    server.tool("get_skill", "Get merged markdown for a specific SDLC skill", { name: z.string().describe("Skill name (e.g. 'prd', 'tech-design')") }, ({ name }) => {
        const entry = index.skills.get(name);
        if (!entry)
            return { content: [{ type: "text", text: `Skill '${name}' not found` }], isError: true };
        return { content: [{ type: "text", text: resolveContent(entry) }] };
    });
    server.tool("list_templates", "List all available SDLC template names", {}, () => ({
        content: [{ type: "text", text: JSON.stringify(Array.from(index.templates.keys()).sort(), null, 2) }],
    }));
    server.tool("get_template", "Get merged markdown for a specific SDLC template", { name: z.string().describe("Template name (e.g. 'PRD-TEMPLATE', 'TECH-DESIGN-TEMPLATE')") }, ({ name }) => {
        const entry = index.templates.get(name);
        if (!entry)
            return { content: [{ type: "text", text: `Template '${name}' not found` }], isError: true };
        return { content: [{ type: "text", text: resolveContent(entry) }] };
    });
    function syncWorkspace(workspace) {
        const results = [];
        const skillsDir = join(workspace, ".claude", "skills");
        const agentsDir = join(workspace, ".claude", "agents");
        const scaffolded = ensureDocsScaffold(workspace, config);
        results.push(...scaffolded);
        mkdirSync(skillsDir, { recursive: true });
        mkdirSync(agentsDir, { recursive: true });
        // Install skills
        for (const [name, entry] of index.skills) {
            const content = resolveContent(entry);
            const dir = join(skillsDir, name);
            mkdirSync(dir, { recursive: true });
            writeFileSync(join(dir, "SKILL.md"), content, "utf-8");
            results.push(`skill/${name}`);
        }
        // Install _gate-check.md (flat file, not in skill index)
        const gateCheckLayers = [];
        const layerBases = [join(config.contentRoot, "generic", "skills")];
        if (config.platform)
            layerBases.push(join(config.contentRoot, "platforms", config.platform, "skills"));
        if (config.project)
            layerBases.push(join(config.contentRoot, "projects", config.project, "skills"));
        for (const base of layerBases) {
            const p = join(base, "_gate-check.md");
            if (existsSync(p))
                gateCheckLayers.push(p);
        }
        if (gateCheckLayers.length > 0) {
            const content = mergeContent(gateCheckLayers, config.projectConfig);
            writeFileSync(join(skillsDir, "_gate-check.md"), content, "utf-8");
            results.push("_gate-check.md");
        }
        // Install agents
        for (const [name, entry] of index.agents) {
            const content = resolveContent(entry);
            writeFileSync(join(agentsDir, `${name}.md`), content, "utf-8");
            results.push(`agent/${name}`);
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
                if (!existsSync(srcDir))
                    continue;
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
    server.tool("setup", "Install SDLC skills and agents into a project workspace (.claude/ directory), and scaffold docs/sdlc workflow + epic example.", { workspace: z.string().describe("Absolute path to the project workspace root") }, ({ workspace: ws }) => {
        const results = syncWorkspace(ws);
        log(`Setup completed: ${results.length} items installed to ${ws}`);
        return {
            content: [{
                    type: "text",
                    text: `Installed ${results.length} items into ${ws}:\n${results.map(r => `  ✓ ${r}`).join("\n")}`,
                }],
        };
    });
    return { server, config };
}
//# sourceMappingURL=mcp.js.map