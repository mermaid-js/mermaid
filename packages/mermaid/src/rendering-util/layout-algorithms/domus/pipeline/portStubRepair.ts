import type { LayoutData } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type { OrthogonalOptions } from '../types.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { applyPortDirectionStubs } from './portStubs.js';

export function applyPortStubRepairIfNeeded(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  incrementalEnabled: boolean;
}): void {
  const { data, options, backend, incrementalEnabled } = args;

  // Validation-gated port-direction stub repair:
  // If any edge leaves/enters a boundary port in the wrong direction, add a short
  // orthogonal stub outside the boundary so the first/last segment direction matches.
  //
  // This is non-invasive: only runs when the validator flags mismatches, and only
  // touches those edges.
  if (incrementalEnabled || backend !== 'routing-graph') {
    return;
  }

  const afterRouting = checkLayout(data);
  const portMismatchEdgeIds = new Set<string>(
    afterRouting.issues
      .filter((iss) => iss.type === 'edge-port-direction-mismatch' && iss.edgeId)
      .map((iss) => String(iss.edgeId))
  );
  if (!afterRouting.ok && portMismatchEdgeIds.size > 0) {
    const stubLen = Math.max(2, Math.min(20, options.spacing ?? 10));
    const { changed } = applyPortDirectionStubs(data, portMismatchEdgeIds, stubLen);
    const afterStubs = checkLayout(data);
    log.debug(ORTHO_DEBUG, 'ROUTING_GRAPH_PORT_STUBS', {
      edgeCount: portMismatchEdgeIds.size,
      changed,
      stubLen,
      ok: afterStubs.ok,
      issueCount: afterStubs.issues.length,
    });
  }
}
