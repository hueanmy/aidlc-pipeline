import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from "fs";
import { join, basename, dirname } from "path";
import { log } from "./config.js";
// ---------------------------------------------------------------------------
// Matrix loading
// ---------------------------------------------------------------------------
let cachedMatrix;
export function loadReviewMatrix(config) {
    if (cachedMatrix)
        return cachedMatrix;
    const path = join(config.contentRoot, "config", "review-matrix.json");
    const raw = readFileSync(path, "utf-8");
    cachedMatrix = JSON.parse(raw);
    return cachedMatrix;
}
/** Test hook — clear the cached matrix so a subsequent load re-reads the file. */
export function resetMatrixCache() {
    cachedMatrix = undefined;
}
// ---------------------------------------------------------------------------
// Epic I/O
// ---------------------------------------------------------------------------
export function epicRoot(workspace, epicKey) {
    return join(workspace, "docs", "sdlc", "epics", epicKey);
}
export function loadEpic(workspace, epicKey) {
    const path = join(epicRoot(workspace, epicKey), "epic.json");
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.epic_id || !parsed.project) {
        throw new Error(`epic.json at ${path} missing required fields epic_id/project`);
    }
    if (!Array.isArray(parsed.affected_modules)) {
        parsed.affected_modules = [];
    }
    return parsed;
}
export function writeEpic(workspace, epic) {
    const path = join(epicRoot(workspace, epic.epic_id), "epic.json");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(epic, null, 2) + "\n", "utf-8");
}
// ---------------------------------------------------------------------------
// Phase state I/O
// ---------------------------------------------------------------------------
export function phaseDir(workspace, epicKey, phase) {
    return join(epicRoot(workspace, epicKey), "phases", phase);
}
function statusPath(workspace, epicKey, phase) {
    return join(phaseDir(workspace, epicKey, phase), "status.json");
}
export function loadPhaseStatus(workspace, epicKey, phase) {
    const path = statusPath(workspace, epicKey, phase);
    if (!existsSync(path)) {
        return { phase, status: "pending", revision: 0 };
    }
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw);
}
export function writePhaseStatus(workspace, epicKey, state) {
    const dir = phaseDir(workspace, epicKey, state.phase);
    mkdirSync(dir, { recursive: true });
    const withTimestamp = { ...state, updated_at: new Date().toISOString() };
    writeFileSync(statusPath(workspace, epicKey, state.phase), JSON.stringify(withTimestamp, null, 2) + "\n", "utf-8");
}
export function loadAllPhaseStatus(workspace, epicKey, matrix) {
    const out = {};
    for (const phase of matrix.phaseOrder) {
        out[phase] = loadPhaseStatus(workspace, epicKey, phase);
    }
    return out;
}
export function resolveNextStep(workspace, epicKey, matrix) {
    for (const phase of matrix.phaseOrder) {
        const s = loadPhaseStatus(workspace, epicKey, phase);
        switch (s.status) {
            case "failed_needs_human":
                return { kind: "halted", phase, reason: s.last_review?.reason ?? "Auto-reviewer exhausted retries." };
            case "awaiting_human_review":
                return { kind: "paused_at_gate", phase, reason: "Waiting for human approve/reject." };
            case "rejected":
                return { kind: "run", phase };
            case "stale":
                return { kind: "run", phase };
            case "pending":
                return { kind: "run", phase };
            case "in_progress":
            case "in_review":
                return { kind: "run", phase };
            case "passed":
                continue;
        }
    }
    return { kind: "completed" };
}
// ---------------------------------------------------------------------------
// Phase transitions — archival + revision bump
// ---------------------------------------------------------------------------
/**
 * Prepare a phase for a new (re)run. Archives the current artifacts if the
 * phase was previously attempted (revision > 0 and status is stale/rejected),
 * bumps the revision, and sets status to in_progress.
 *
 * Safe to call when status is pending (revision 0) — it just bumps to 1.
 */
export function startPhase(workspace, epicKey, phase) {
    const current = loadPhaseStatus(workspace, epicKey, phase);
    if ((current.status === "stale" || current.status === "rejected") && current.revision > 0) {
        archivePhase(workspace, epicKey, phase, current.revision);
    }
    const next = {
        phase,
        status: "in_progress",
        revision: current.revision + 1,
        last_review: undefined,
        // Preserve user_feedback so the worker can read it in this new run.
        user_feedback: current.user_feedback,
    };
    writePhaseStatus(workspace, epicKey, next);
    return next;
}
/**
 * Transition a phase status without archival or revision bump.
 * Use for: in_review, passed, awaiting_human_review, failed_needs_human.
 * For stale/rejected, use cascadeReject; for beginning a new run, use startPhase.
 */
export function setPhaseStatus(workspace, epicKey, phase, status, verdict) {
    const current = loadPhaseStatus(workspace, epicKey, phase);
    const next = {
        phase,
        status,
        revision: current.revision,
        last_review: verdict ?? current.last_review,
        // Clear user_feedback when phase passes — it has been consumed.
        // Preserve otherwise (e.g. awaiting_human_review shouldn't lose feedback).
        user_feedback: status === "passed" ? undefined : current.user_feedback,
    };
    writePhaseStatus(workspace, epicKey, next);
    return next;
}
// ---------------------------------------------------------------------------
// Cascade (reject → upstream phase, mark intermediates stale)
// ---------------------------------------------------------------------------
export function canRejectTo(from, to, matrix) {
    const allowed = matrix.rejectTo[from] ?? [];
    return allowed.includes(to);
}
/**
 * Apply a cascade reject from `from` phase to `to` phase.
 *
 * - `to` phase: status = rejected, revision++, last_review recorded
 * - All phases strictly between `to` and `from` (exclusive on both ends):
 *   if status was `passed`, mark `stale`; otherwise leave alone
 * - `from` phase and everything downstream: leave alone (the re-run will
 *   naturally re-touch them after `to` re-passes)
 */
export function cascadeReject(workspace, epicKey, from, to, verdict, matrix) {
    if (!canRejectTo(from, to, matrix)) {
        throw new Error(`Cannot reject from ${from} to ${to}: not in rejectTo matrix.`);
    }
    const order = matrix.phaseOrder;
    const toIdx = order.indexOf(to);
    const fromIdx = order.indexOf(from);
    if (toIdx < 0 || fromIdx < 0 || toIdx >= fromIdx) {
        throw new Error(`Invalid cascade indices: from=${from}(${fromIdx}) to=${to}(${toIdx}).`);
    }
    const target = loadPhaseStatus(workspace, epicKey, to);
    archivePhase(workspace, epicKey, to, target.revision);
    writePhaseStatus(workspace, epicKey, {
        phase: to,
        status: "rejected",
        revision: target.revision + 1,
        last_review: verdict,
    });
    for (let i = toIdx + 1; i < fromIdx; i++) {
        const mid = order[i];
        const midState = loadPhaseStatus(workspace, epicKey, mid);
        if (midState.status === "passed") {
            writePhaseStatus(workspace, epicKey, { ...midState, status: "stale" });
        }
    }
}
// ---------------------------------------------------------------------------
// Archival
// ---------------------------------------------------------------------------
/**
 * Move all files under the phase directory (except the archive/ subdirectory
 * itself) to archive/revision-N/. Called before writing a new revision.
 *
 * revision N is the revision we are archiving, which is the revision number
 * currently on disk before the new write.
 */
export function archivePhase(workspace, epicKey, phase, revision) {
    const dir = phaseDir(workspace, epicKey, phase);
    if (!existsSync(dir))
        return;
    if (revision <= 0)
        return;
    const archiveDir = join(dir, "archive", `revision-${revision}`);
    mkdirSync(archiveDir, { recursive: true });
    for (const entry of readdirSync(dir)) {
        if (entry === "archive")
            continue;
        const src = join(dir, entry);
        const dst = join(archiveDir, entry);
        try {
            renameSync(src, dst);
        }
        catch (err) {
            log(`Archive failed for ${src} → ${dst}: ${err}`);
        }
    }
}
// ---------------------------------------------------------------------------
// Domain-knowledge resolution (workspace-side, project-agnostic)
//
// Unlike a project-specific pipeline, this package keeps no domain knowledge.
// The user's workspace owns it under <workspace>/docs/:
//   docs/core-business/*.md   — one file per business module
//   docs/its/*.md             — tech-stack notes (or single docs/its.md)
//   docs/sdlc/workflow/*.md   — delivery operating model (scaffolded by setup)
//
// All folders are optional. Missing → empty selection, never an error.
// ---------------------------------------------------------------------------
function workspaceDocsRoot(workspace) {
    return join(workspace, "docs");
}
function coreBusinessDir(workspace) {
    return join(workspaceDocsRoot(workspace), "core-business");
}
function itsDir(workspace) {
    return join(workspaceDocsRoot(workspace), "its");
}
function workflowDir(workspace) {
    return join(workspaceDocsRoot(workspace), "sdlc", "workflow");
}
/**
 * Build the context payload for a phase invocation.
 *
 * Selection rules:
 *   - core-business files: filtered by epic.affected_modules (slug substring match)
 *   - its/workflow: always included if present (single file each)
 *   - upstreamArtifacts: absolute paths to files produced by prior phases that
 *     this phase needs to read (per the matrix below)
 *
 * File existence is checked; missing optional files are simply omitted rather
 * than causing an error. Missing mandatory upstream artifacts (e.g. PRD.md for
 * tech-design) WILL appear in the list even if absent — the caller decides how
 * to report that to the worker.
 */
export function buildPhaseContext(_config, workspace, epicKey, phase, matrix) {
    const epic = loadEpic(workspace, epicKey);
    const coreBusinessFiles = selectCoreBusinessFiles(coreBusinessDir(workspace), phase, epic.affected_modules);
    const itsFile = firstFileIn(itsDir(workspace));
    const workflowFile = firstFileIn(workflowDir(workspace));
    const upstreamArtifacts = resolveUpstreamArtifacts(workspace, epicKey, phase, matrix);
    const state = loadPhaseStatus(workspace, epicKey, phase);
    return {
        phase,
        epic,
        worker: matrix.phaseWorker[phase],
        humanGate: matrix.humanGates.includes(phase),
        domainFiles: {
            coreBusiness: coreBusinessFiles,
            its: phaseUsesIts(phase) ? itsFile : undefined,
            workflow: phaseUsesWorkflow(phase) ? workflowFile : undefined,
        },
        upstreamArtifacts,
        checklists: matrix.checklists[phase],
        lastReview: state.last_review,
        userFeedback: state.user_feedback,
    };
}
function selectCoreBusinessFiles(dir, phase, modules) {
    if (!existsSync(dir))
        return [];
    const all = readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => join(dir, f));
    // doc-sync: needs everything
    if (phase === "doc-sync")
        return all;
    // test-plan: always include any acceptance file plus affected-module files
    const baseFiles = [];
    if (phase === "test-plan") {
        const acceptance = all.find((p) => /acceptance/i.test(basename(p)));
        if (acceptance)
            baseFiles.push(acceptance);
    }
    const affected = all.filter((path) => {
        const name = basename(path).toLowerCase();
        return modules.some((slug) => name.includes(slug.toLowerCase()));
    });
    return Array.from(new Set([...baseFiles, ...affected]));
}
function firstFileIn(dir) {
    if (!existsSync(dir))
        return undefined;
    const mdFiles = readdirSync(dir).filter((f) => f.endsWith(".md"));
    if (mdFiles.length === 0)
        return undefined;
    return join(dir, mdFiles[0]);
}
function phaseUsesIts(phase) {
    return ["design", "implement", "review", "release", "monitor"].includes(phase);
}
function phaseUsesWorkflow(phase) {
    return ["plan", "implement", "test-plan", "execute-test"].includes(phase);
}
/** Resolve upstream artifact file paths per the context matrix. */
function resolveUpstreamArtifacts(workspace, epicKey, phase, matrix) {
    const root = epicRoot(workspace, epicKey);
    const resolve = (names) => names.map((n) => join(root, n.replace("{{EPIC_KEY}}", epicKey)));
    switch (phase) {
        case "plan":
            return []; // input is epic.brief only
        case "design":
            return resolve(matrix.artifacts.plan);
        case "test-plan":
            return [...resolve(matrix.artifacts.plan), ...resolve(matrix.artifacts.design)];
        case "implement":
            return [...resolve(matrix.artifacts.plan), ...resolve(matrix.artifacts.design)];
        case "review":
            return resolve(matrix.artifacts.design);
        case "execute-test":
            return resolve(matrix.artifacts.plan);
        case "release":
            return resolve(matrix.artifacts.review);
        case "monitor":
            return [];
        case "doc-sync":
            return [
                ...resolve(matrix.artifacts.plan),
                ...resolve(matrix.artifacts.design),
                ...resolve(matrix.artifacts.review),
                ...resolve(matrix.artifacts["execute-test"]),
            ];
    }
}
// ---------------------------------------------------------------------------
// Affected-modules amendment (Tech Lead extending PO's initial list)
// ---------------------------------------------------------------------------
export function amendAffectedModules(workspace, epicKey, by, added, reason) {
    const epic = loadEpic(workspace, epicKey);
    const current = new Set(epic.affected_modules);
    for (const m of added)
        current.add(m);
    const entry = {
        at: new Date().toISOString(),
        by,
        added,
        reason,
    };
    epic.affected_modules = Array.from(current).sort();
    epic.module_amend_log = [...(epic.module_amend_log ?? []), entry];
    writeEpic(workspace, epic);
    return epic;
}
/**
 * List the available core-business module filenames in the user's workspace.
 * Used as a fallback when the PO needs to pick affected_modules for a new epic.
 *
 * Returns an empty list (not an error) if docs/core-business/ doesn't exist —
 * a workspace can opt out of module-based context entirely.
 */
export function listWorkspaceModules(workspace) {
    const dir = coreBusinessDir(workspace);
    if (!existsSync(dir))
        return { workspace, modules: [] };
    const modules = readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({
        file: f,
        slug: basename(f, ".md").replace(/^\d+-/, ""),
    }));
    return { workspace, modules };
}
export function getEpicStatus(workspace, epicKey, matrix) {
    const epic = loadEpic(workspace, epicKey);
    const phases = loadAllPhaseStatus(workspace, epicKey, matrix);
    const next = resolveNextStep(workspace, epicKey, matrix);
    return { epic, phases, next };
}
//# sourceMappingURL=orchestrator.js.map