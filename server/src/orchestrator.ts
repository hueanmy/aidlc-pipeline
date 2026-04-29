import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from "fs";
import { join, basename, dirname } from "path";
import { ServerConfig, log } from "./config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhaseName =
  | "plan"
  | "design"
  | "test-plan"
  | "implement"
  | "review"
  | "execute-test"
  | "release"
  | "monitor"
  | "doc-sync";

export type PhaseStatus =
  | "pending"
  | "in_progress"
  | "in_review"
  | "awaiting_human_review"
  | "passed"
  | "rejected"
  | "stale"
  | "failed_needs_human";

export interface ReviewVerdict {
  decision: "pass" | "reject";
  reviewer: string;
  at: string;
  reject_to?: PhaseName;
  reason: string;
  checklist_results?: Record<string, "pass" | "fail">;
}

export interface PhaseState {
  phase: PhaseName;
  status: PhaseStatus;
  revision: number;
  updated_at?: string;
  last_review?: ReviewVerdict;
  /**
   * Free-form note from the human user attached to the NEXT worker run.
   * Written by the extension via the "Update feedback" UI on a rejected /
   * failed phase. Preserved across startPhase() revisions — cleared by
   * setPhaseStatus when the phase is explicitly marked passed.
   */
  user_feedback?: string;
}

export interface ModuleAmendEntry {
  at: string;
  by: string;
  added: string[];
  reason: string;
}

export interface EpicMetadata {
  epic_id: string;
  project: string;
  brief: string;
  affected_modules: string[];
  module_amend_log?: ModuleAmendEntry[];
  title?: string;
  owner?: string;
}

export interface ReviewMatrix {
  phaseOrder: PhaseName[];
  humanGates: PhaseName[];
  rejectTo: Record<PhaseName, PhaseName[]>;
  phaseWorker: Record<PhaseName, string>;
  artifacts: Record<PhaseName, string[]>;
  checklists: Record<PhaseName, { structure: string[]; semantic: string[] }>;
}

// ---------------------------------------------------------------------------
// Matrix loading
// ---------------------------------------------------------------------------

let cachedMatrix: ReviewMatrix | undefined;

export function loadReviewMatrix(config: ServerConfig): ReviewMatrix {
  if (cachedMatrix) return cachedMatrix;
  const path = join(config.contentRoot, "config", "review-matrix.json");
  const raw = readFileSync(path, "utf-8");
  cachedMatrix = JSON.parse(raw) as ReviewMatrix;
  return cachedMatrix;
}

/** Test hook — clear the cached matrix so a subsequent load re-reads the file. */
export function resetMatrixCache(): void {
  cachedMatrix = undefined;
}

// ---------------------------------------------------------------------------
// Epic I/O
// ---------------------------------------------------------------------------

export function epicRoot(workspace: string, epicKey: string): string {
  return join(workspace, "docs", "sdlc", "epics", epicKey);
}

export function loadEpic(workspace: string, epicKey: string): EpicMetadata {
  const path = join(epicRoot(workspace, epicKey), "epic.json");
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw) as EpicMetadata;
  if (!parsed.epic_id || !parsed.project) {
    throw new Error(`epic.json at ${path} missing required fields epic_id/project`);
  }
  if (!Array.isArray(parsed.affected_modules)) {
    parsed.affected_modules = [];
  }
  return parsed;
}

export function writeEpic(workspace: string, epic: EpicMetadata): void {
  const path = join(epicRoot(workspace, epic.epic_id), "epic.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(epic, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Phase state I/O
// ---------------------------------------------------------------------------

export function phaseDir(workspace: string, epicKey: string, phase: PhaseName): string {
  return join(epicRoot(workspace, epicKey), "phases", phase);
}

function statusPath(workspace: string, epicKey: string, phase: PhaseName): string {
  return join(phaseDir(workspace, epicKey, phase), "status.json");
}

export function loadPhaseStatus(
  workspace: string,
  epicKey: string,
  phase: PhaseName
): PhaseState {
  const path = statusPath(workspace, epicKey, phase);
  if (!existsSync(path)) {
    return { phase, status: "pending", revision: 0 };
  }
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as PhaseState;
}

export function writePhaseStatus(workspace: string, epicKey: string, state: PhaseState): void {
  const dir = phaseDir(workspace, epicKey, state.phase);
  mkdirSync(dir, { recursive: true });
  const withTimestamp: PhaseState = { ...state, updated_at: new Date().toISOString() };
  writeFileSync(statusPath(workspace, epicKey, state.phase), JSON.stringify(withTimestamp, null, 2) + "\n", "utf-8");
}

export function loadAllPhaseStatus(
  workspace: string,
  epicKey: string,
  matrix: ReviewMatrix
): Record<PhaseName, PhaseState> {
  const out: Partial<Record<PhaseName, PhaseState>> = {};
  for (const phase of matrix.phaseOrder) {
    out[phase] = loadPhaseStatus(workspace, epicKey, phase);
  }
  return out as Record<PhaseName, PhaseState>;
}

// ---------------------------------------------------------------------------
// Next-step resolver
// ---------------------------------------------------------------------------

export interface NextStep {
  kind: "run" | "paused_at_gate" | "halted" | "completed";
  phase?: PhaseName;
  reason?: string;
}

export function resolveNextStep(
  workspace: string,
  epicKey: string,
  matrix: ReviewMatrix
): NextStep {
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
export function startPhase(
  workspace: string,
  epicKey: string,
  phase: PhaseName
): PhaseState {
  const current = loadPhaseStatus(workspace, epicKey, phase);

  if ((current.status === "stale" || current.status === "rejected") && current.revision > 0) {
    archivePhase(workspace, epicKey, phase, current.revision);
  }

  const next: PhaseState = {
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
export function setPhaseStatus(
  workspace: string,
  epicKey: string,
  phase: PhaseName,
  status: PhaseStatus,
  verdict?: ReviewVerdict
): PhaseState {
  const current = loadPhaseStatus(workspace, epicKey, phase);
  const next: PhaseState = {
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

export function canRejectTo(from: PhaseName, to: PhaseName, matrix: ReviewMatrix): boolean {
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
export function cascadeReject(
  workspace: string,
  epicKey: string,
  from: PhaseName,
  to: PhaseName,
  verdict: ReviewVerdict,
  matrix: ReviewMatrix
): void {
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
export function archivePhase(
  workspace: string,
  epicKey: string,
  phase: PhaseName,
  revision: number
): void {
  const dir = phaseDir(workspace, epicKey, phase);
  if (!existsSync(dir)) return;
  if (revision <= 0) return;

  const archiveDir = join(dir, "archive", `revision-${revision}`);
  mkdirSync(archiveDir, { recursive: true });

  for (const entry of readdirSync(dir)) {
    if (entry === "archive") continue;
    const src = join(dir, entry);
    const dst = join(archiveDir, entry);
    try {
      renameSync(src, dst);
    } catch (err) {
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

function workspaceDocsRoot(workspace: string): string {
  return join(workspace, "docs");
}

function coreBusinessDir(workspace: string): string {
  return join(workspaceDocsRoot(workspace), "core-business");
}

function itsDir(workspace: string): string {
  return join(workspaceDocsRoot(workspace), "its");
}

function workflowDir(workspace: string): string {
  return join(workspaceDocsRoot(workspace), "sdlc", "workflow");
}

// ---------------------------------------------------------------------------
// Context packaging
// ---------------------------------------------------------------------------

export interface PhaseContext {
  phase: PhaseName;
  epic: EpicMetadata;
  worker: string;
  humanGate: boolean;
  domainFiles: {
    coreBusiness: string[];
    its?: string;
    workflow?: string;
  };
  upstreamArtifacts: string[];
  checklists: { structure: string[]; semantic: string[] };
  /**
   * Previous review verdict for this phase (if any). Lets the worker see
   * the auto-reviewer's or human reviewer's reason on a retry.
   */
  lastReview?: ReviewVerdict;
  /**
   * Free-form user feedback attached via the UI when re-running a rejected
   * or failed phase. Should be surfaced to the worker prominently.
   */
  userFeedback?: string;
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
export function buildPhaseContext(
  _config: ServerConfig,
  workspace: string,
  epicKey: string,
  phase: PhaseName,
  matrix: ReviewMatrix
): PhaseContext {
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

function selectCoreBusinessFiles(dir: string, phase: PhaseName, modules: string[]): string[] {
  if (!existsSync(dir)) return [];

  const all = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dir, f));

  // doc-sync: needs everything
  if (phase === "doc-sync") return all;

  // test-plan: always include any acceptance file plus affected-module files
  const baseFiles: string[] = [];
  if (phase === "test-plan") {
    const acceptance = all.find((p) => /acceptance/i.test(basename(p)));
    if (acceptance) baseFiles.push(acceptance);
  }

  const affected = all.filter((path) => {
    const name = basename(path).toLowerCase();
    return modules.some((slug) => name.includes(slug.toLowerCase()));
  });

  return Array.from(new Set([...baseFiles, ...affected]));
}

function firstFileIn(dir: string): string | undefined {
  if (!existsSync(dir)) return undefined;
  const mdFiles = readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (mdFiles.length === 0) return undefined;
  return join(dir, mdFiles[0]);
}

function phaseUsesIts(phase: PhaseName): boolean {
  return ["design", "implement", "review", "release", "monitor"].includes(phase);
}

function phaseUsesWorkflow(phase: PhaseName): boolean {
  return ["plan", "implement", "test-plan", "execute-test"].includes(phase);
}

/** Resolve upstream artifact file paths per the context matrix. */
function resolveUpstreamArtifacts(
  workspace: string,
  epicKey: string,
  phase: PhaseName,
  matrix: ReviewMatrix
): string[] {
  const root = epicRoot(workspace, epicKey);
  const resolve = (names: string[]) =>
    names.map((n) => join(root, n.replace("{{EPIC_KEY}}", epicKey)));

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

export function amendAffectedModules(
  workspace: string,
  epicKey: string,
  by: string,
  added: string[],
  reason: string
): EpicMetadata {
  const epic = loadEpic(workspace, epicKey);
  const current = new Set(epic.affected_modules);
  for (const m of added) current.add(m);

  const entry: ModuleAmendEntry = {
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
export function listWorkspaceModules(workspace: string): { workspace: string; modules: { file: string; slug: string }[] } {
  const dir = coreBusinessDir(workspace);
  if (!existsSync(dir)) return { workspace, modules: [] };
  const modules = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      file: f,
      slug: basename(f, ".md").replace(/^\d+-/, ""),
    }));
  return { workspace, modules };
}

// ---------------------------------------------------------------------------
// Public convenience: full status map for the extension
// ---------------------------------------------------------------------------

export interface EpicStatusReport {
  epic: EpicMetadata;
  phases: Record<PhaseName, PhaseState>;
  next: NextStep;
}

export function getEpicStatus(
  workspace: string,
  epicKey: string,
  matrix: ReviewMatrix
): EpicStatusReport {
  const epic = loadEpic(workspace, epicKey);
  const phases = loadAllPhaseStatus(workspace, epicKey, matrix);
  const next = resolveNextStep(workspace, epicKey, matrix);
  return { epic, phases, next };
}
