import type { LayoutData } from '../../../types.js';
import type { Issue } from '../../layout-utils/validateLayout.js';

export function partitionDomusValidationIssues(
  issues: readonly Issue[],
  data: LayoutData
): { conventional: Issue[]; real: Issue[] } {
  const edgeEndpoints = new Map<string, { start: string; end: string }>();
  const edgePointsLength = new Map<string, number>();
  for (const e of data.edges ?? []) {
    if (e?.id == null || e.start == null || e.end == null) {
      continue;
    }
    edgeEndpoints.set(String(e.id), { start: String(e.start), end: String(e.end) });
    edgePointsLength.set(String(e.id), e.points?.length ?? 0);
  }
  const conventional: Issue[] = [];
  const real: Issue[] = [];
  for (const iss of issues) {
    if (isConventionalCenterEndpointIssue(iss, edgeEndpoints, edgePointsLength)) {
      conventional.push(iss);
    } else {
      real.push(iss);
    }
  }
  return { conventional, real };
}

function isConventionalCenterEndpointIssue(
  iss: Issue,
  edgeEndpoints: Map<string, { start: string; end: string }>,
  edgePointsLength: Map<string, number>
): boolean {
  if (iss.type !== 'edge-endpoint-inside-node' && iss.type !== 'edge-intersects-obstacle') {
    return false;
  }
  if (!iss.edgeId) {
    return false;
  }
  const ep = edgeEndpoints.get(String(iss.edgeId));
  if (!ep) {
    return false;
  }
  const obstacleId = iss.nodeIds?.[0];
  if (!obstacleId) {
    return false;
  }
  if (obstacleId !== ep.start && obstacleId !== ep.end) {
    return false;
  }
  if (iss.type === 'edge-intersects-obstacle') {
    const segIdx = (iss as { details?: { segmentIndex?: number } }).details?.segmentIndex;
    if (segIdx == null) {
      return false;
    }
    const pointsLen = edgePointsLength.get(String(iss.edgeId)) ?? 0;
    const lastSegIdx = pointsLen - 2;
    if (segIdx !== 0 && segIdx !== lastSegIdx) {
      return false;
    }
  }
  return true;
}
