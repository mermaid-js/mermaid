import type { LayoutData } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';

export function emitLayoutDump(data: LayoutData): void {
  // Optional per-entity dumps (more verbose, but sometimes useful while iterating).
  // Debug-only: single copy/paste-friendly blob. Log level controls visibility.
  const dump = {
    nodes: (data.nodes ?? []).map((n) => ({
      id: String((n as any).id ?? ''),
      isGroup: Boolean((n as any).isGroup),
      parentId: (n as any).parentId != null ? String((n as any).parentId) : undefined,
      layer: typeof (n as any).layer === 'number' ? (n as any).layer : undefined,
      x: (n as any).x ?? 0,
      y: (n as any).y ?? 0,
      width: (n as any).width ?? 0,
      height: (n as any).height ?? 0,
      label: (n as any).label ?? undefined,
    })),
    edges: (data.edges ?? []).map((e) => ({
      id: String((e as any).id ?? ''),
      start: (e as any).start != null ? String((e as any).start) : undefined,
      end: (e as any).end != null ? String((e as any).end) : undefined,
      points: (e as any).points ?? [],
    })),
  };
  log.debug(ORTHO_DEBUG, 'LAYOUT_DUMP', JSON.stringify(dump));
  // Convenience: emit the same data as per-entity logs for easier console scanning/filtering.
  // (Still gated by Mermaid log level since we use log.debug.)
  for (const n of dump.nodes) {
    log.debug(ORTHO_DEBUG, 'NODE', JSON.stringify(n));
  }
  for (const e of dump.edges) {
    log.debug(ORTHO_DEBUG, 'EDGE', JSON.stringify(e));
  }
}
