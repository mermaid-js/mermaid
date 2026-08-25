/**
 * Acceptance test for score-gated repair passes, with an escape for the clamp.
 *
 * The obvious test — "the validator score went up" — is silently inert on
 * exactly the layouts that need these passes most. `score` is clamped at 0
 * while a layout is invalid, so on an invalid layout every candidate scores 0
 * both before and after: `next.score > current.score` is never true, and the
 * pass declines a move that genuinely REMOVED an issue. The layout is invalid
 * because of defects the pass exists to repair, and the pass will not repair
 * them because the layout is invalid.
 *
 * Two places in this pipeline already work around it by hand.
 * `simplifyPathologicalRoutesWhenMonotone` notes that "the score-gated
 * simplifiers are dormant while the score is clamped at 0" and accepts on a
 * per-edge point-count decrease instead; `finalizeOverlayLabels` writes the
 * same idea inline, accepting when the score rises OR the layout is not yet
 * valid and the issue count fell. This is that escape, named and
 * scoped: while the score carries no information, fall back to counting issues
 * — accept only a strict reduction that introduces no new KIND of issue. The
 * moment the layout is valid the score is informative again and the original
 * test applies unchanged, so behaviour on healthy layouts is untouched.
 *
 * The fallback is strictly weaker than the score test it stands in for: it can
 * accept only a move that removes an issue and adds none, the same bar
 * `remediateFlaggedEdgesWhenMonotone` already applies.
 *
 * APPLIED NARROWLY ON PURPOSE. Rolled out across every score-gated pass this
 * costs 30 aggregate points, because several of them run inside the
 * compound-placement tournament on candidate variants that are invalid
 * mid-flight, and accepting more repairs there changes which variant wins.
 * Only `clearArrowheadBendsWhenScoreImproves` uses it today, where it is
 * aggregate-neutral. Measure before widening it.
 */
export interface AcceptanceSnapshot {
  score: number;
  issues: readonly { type: string; edgeId?: string; message?: string }[];
}

export function issueKeyOf(issue: { type: string; edgeId?: string; message?: string }): string {
  return `${issue.type}|${issue.edgeId ?? ''}|${issue.message ?? ''}`;
}

export function issueKeySet(snapshot: AcceptanceSnapshot): Set<string> {
  return new Set(snapshot.issues.map(issueKeyOf));
}

export function acceptsRepair(
  current: AcceptanceSnapshot,
  next: AcceptanceSnapshot,
  currentKeys: Set<string>
): boolean {
  if (next.score > current.score) {
    return true;
  }
  if (current.score > 0) {
    return false;
  }
  return (
    next.issues.length < current.issues.length &&
    next.issues.every((iss) => currentKeys.has(issueKeyOf(iss)))
  );
}
