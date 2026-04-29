import { ServerConfig } from "./config.js";
export type PhaseName = "plan" | "design" | "test-plan" | "implement" | "review" | "execute-test" | "release" | "monitor" | "doc-sync";
export type PhaseStatus = "pending" | "in_progress" | "in_review" | "awaiting_human_review" | "passed" | "rejected" | "stale" | "failed_needs_human";
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
    checklists: Record<PhaseName, {
        structure: string[];
        semantic: string[];
    }>;
}
export declare function loadReviewMatrix(config: ServerConfig): ReviewMatrix;
/** Test hook — clear the cached matrix so a subsequent load re-reads the file. */
export declare function resetMatrixCache(): void;
export declare function epicRoot(workspace: string, epicKey: string): string;
export declare function loadEpic(workspace: string, epicKey: string): EpicMetadata;
export declare function writeEpic(workspace: string, epic: EpicMetadata): void;
export declare function phaseDir(workspace: string, epicKey: string, phase: PhaseName): string;
export declare function loadPhaseStatus(workspace: string, epicKey: string, phase: PhaseName): PhaseState;
export declare function writePhaseStatus(workspace: string, epicKey: string, state: PhaseState): void;
export declare function loadAllPhaseStatus(workspace: string, epicKey: string, matrix: ReviewMatrix): Record<PhaseName, PhaseState>;
export interface NextStep {
    kind: "run" | "paused_at_gate" | "halted" | "completed";
    phase?: PhaseName;
    reason?: string;
}
export declare function resolveNextStep(workspace: string, epicKey: string, matrix: ReviewMatrix): NextStep;
/**
 * Prepare a phase for a new (re)run. Archives the current artifacts if the
 * phase was previously attempted (revision > 0 and status is stale/rejected),
 * bumps the revision, and sets status to in_progress.
 *
 * Safe to call when status is pending (revision 0) — it just bumps to 1.
 */
export declare function startPhase(workspace: string, epicKey: string, phase: PhaseName): PhaseState;
/**
 * Transition a phase status without archival or revision bump.
 * Use for: in_review, passed, awaiting_human_review, failed_needs_human.
 * For stale/rejected, use cascadeReject; for beginning a new run, use startPhase.
 */
export declare function setPhaseStatus(workspace: string, epicKey: string, phase: PhaseName, status: PhaseStatus, verdict?: ReviewVerdict): PhaseState;
export declare function canRejectTo(from: PhaseName, to: PhaseName, matrix: ReviewMatrix): boolean;
/**
 * Apply a cascade reject from `from` phase to `to` phase.
 *
 * - `to` phase: status = rejected, revision++, last_review recorded
 * - All phases strictly between `to` and `from` (exclusive on both ends):
 *   if status was `passed`, mark `stale`; otherwise leave alone
 * - `from` phase and everything downstream: leave alone (the re-run will
 *   naturally re-touch them after `to` re-passes)
 */
export declare function cascadeReject(workspace: string, epicKey: string, from: PhaseName, to: PhaseName, verdict: ReviewVerdict, matrix: ReviewMatrix): void;
/**
 * Move all files under the phase directory (except the archive/ subdirectory
 * itself) to archive/revision-N/. Called before writing a new revision.
 *
 * revision N is the revision we are archiving, which is the revision number
 * currently on disk before the new write.
 */
export declare function archivePhase(workspace: string, epicKey: string, phase: PhaseName, revision: number): void;
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
    checklists: {
        structure: string[];
        semantic: string[];
    };
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
export declare function buildPhaseContext(_config: ServerConfig, workspace: string, epicKey: string, phase: PhaseName, matrix: ReviewMatrix): PhaseContext;
export declare function amendAffectedModules(workspace: string, epicKey: string, by: string, added: string[], reason: string): EpicMetadata;
/**
 * List the available core-business module filenames in the user's workspace.
 * Used as a fallback when the PO needs to pick affected_modules for a new epic.
 *
 * Returns an empty list (not an error) if docs/core-business/ doesn't exist —
 * a workspace can opt out of module-based context entirely.
 */
export declare function listWorkspaceModules(workspace: string): {
    workspace: string;
    modules: {
        file: string;
        slug: string;
    }[];
};
export interface EpicStatusReport {
    epic: EpicMetadata;
    phases: Record<PhaseName, PhaseState>;
    next: NextStep;
}
export declare function getEpicStatus(workspace: string, epicKey: string, matrix: ReviewMatrix): EpicStatusReport;
//# sourceMappingURL=orchestrator.d.ts.map