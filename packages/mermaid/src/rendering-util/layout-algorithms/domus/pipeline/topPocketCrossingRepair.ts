import type { Point } from '../../../../types.js';
import type { Edge, LayoutData, Node } from '../../../types.js';
import { ORTHO_DEBUG } from '../debug.js';
import { rectForNode } from '../core/helpers.js';
import { validateLayout } from '../validateLayoutProxy.js';
import { log } from '../../../../logger.js';

export interface TopPocketCrossingRepairResult {
  changed: number;
  scoreBefore: number;
  scoreAfter: number;
  crossingsBefore: number;
  crossingsAfter: number;
}

function clonePoints(points: readonly Point[] | undefined): Point[] {
  return (points ?? []).map((point) => ({ x: point.x, y: point.y }));
}

function isLabelEdge(edge: Edge): boolean {
  return Boolean((edge as { isLabelEdge?: boolean }).isLabelEdge);
}

function topBottomPocketCandidates(source: Node, target: Node, spacing: number): Point[][] {
  const sourceRect = rectForNode(source);
  const targetRect = rectForNode(target);
  const sourceWidth = sourceRect.right - sourceRect.left;
  const sourceInset = Math.max(4, Math.min(12, sourceWidth / 3));
  const sourceX =
    targetRect.cx < sourceRect.cx ? sourceRect.left + sourceInset : sourceRect.right - sourceInset;
  const pocketGap = Math.max(32, spacing * 3);
  const topY = Math.min(sourceRect.top, targetRect.top) - pocketGap;
  const bottomY = Math.max(sourceRect.bottom, targetRect.bottom) + pocketGap;

  const horizontalSide = targetRect.cx >= sourceRect.cx ? 1 : -1;
  const sourceSideX = horizontalSide > 0 ? sourceRect.right : sourceRect.left;
  const targetSideX = horizontalSide > 0 ? targetRect.left : targetRect.right;
  const corridorX = sourceSideX + horizontalSide * Math.max(16, spacing * 2);

  return [
    [
      { x: sourceSideX, y: sourceRect.cy },
      { x: corridorX, y: sourceRect.cy },
      { x: corridorX, y: targetRect.cy },
      { x: targetSideX, y: targetRect.cy },
    ],
    [
      { x: sourceX, y: sourceRect.top },
      { x: sourceX, y: topY },
      { x: targetRect.cx, y: topY },
      { x: targetRect.cx, y: targetRect.top },
    ],
    [
      { x: sourceX, y: sourceRect.bottom },
      { x: sourceX, y: bottomY },
      { x: targetRect.cx, y: bottomY },
      { x: targetRect.cx, y: targetRect.bottom },
    ],
  ];
}

export function applyTopPocketCrossingRepairIfImproves(
  data: LayoutData,
  opts: { spacing: number }
): TopPocketCrossingRepairResult {
  let bestValidation = validateLayout(data);
  const result: TopPocketCrossingRepairResult = {
    changed: 0,
    scoreBefore: bestValidation.score,
    scoreAfter: bestValidation.score,
    crossingsBefore: bestValidation.breakdown.crossings,
    crossingsAfter: bestValidation.breakdown.crossings,
  };

  if (!bestValidation.ok || bestValidation.breakdown.crossings <= 0) {
    const hasBorderHug = bestValidation.issues.some(
      (issue) => issue.type === 'edge-border-hugging'
    );
    if (!hasBorderHug) {
      return result;
    }
  }

  const nodesById = new Map<string, Node>();
  for (const node of data.nodes ?? []) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }

  for (const edge of data.edges ?? []) {
    if (isLabelEdge(edge) || !edge.start || !edge.end) {
      continue;
    }
    if (String(edge.start) === String(edge.end)) {
      continue;
    }
    const source = nodesById.get(String(edge.start));
    const target = nodesById.get(String(edge.end));
    if (!source || !target) {
      continue;
    }

    const originalPoints = clonePoints(edge.points);
    let acceptedPoints: Point[] | undefined;
    let acceptedValidation = bestValidation;

    for (const candidate of topBottomPocketCandidates(source, target, opts.spacing)) {
      edge.points = clonePoints(candidate);
      const candidateValidation = validateLayout(data);
      const improvesCrossings =
        candidateValidation.breakdown.crossings < acceptedValidation.breakdown.crossings;
      const improvesScoreAtSameCrossings =
        candidateValidation.breakdown.crossings === acceptedValidation.breakdown.crossings &&
        candidateValidation.score > acceptedValidation.score;
      const improvesScoreWithFewerCrossings =
        improvesCrossings && candidateValidation.score > acceptedValidation.score;
      if (
        candidateValidation.ok &&
        (improvesScoreWithFewerCrossings || improvesScoreAtSameCrossings)
      ) {
        acceptedPoints = clonePoints(candidate);
        acceptedValidation = candidateValidation;
      }
    }

    if (acceptedPoints) {
      edge.points = acceptedPoints;
      bestValidation = acceptedValidation;
      result.changed++;
      result.scoreAfter = bestValidation.score;
      result.crossingsAfter = bestValidation.breakdown.crossings;
    } else {
      edge.points = originalPoints;
    }
  }

  if (result.changed > 0) {
    log.debug(ORTHO_DEBUG, 'TOP_POCKET_CROSSING_REPAIR', result);
  }
  return result;
}
