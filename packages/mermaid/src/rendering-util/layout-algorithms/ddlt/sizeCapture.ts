import type { Selection } from 'd3';
import type { LayoutData } from '../../types.js';
import { DDLT_SIZE_CAPTURE_VERSION } from './captureContract.js';

// ─────────────────────────────────────────────────────────────────────────────
// DDLT size capture (dev / test tooling — NOT part of production rendering)
//
// This module is dynamically imported by createGraphWithElements ONLY when
// `window.mermaidCaptureSizes` is set, so it is never bundled into a production
// render path (it lands in a lazily-loaded chunk instead).
//
// When enabled, it records the measured bounding-box dimensions of every leaf
// node and edge-label dummy node, matching the `.sizes.json` fixture format used
// by DOM-Decoupled Layout Testing (see
// e2e/platform/dev-diagrams/layout-tests/*.sizes.json).
//
// Toggle from the browser devtools:
//
//   window.mermaidCaptureSizes = true;   // enable
//   window.mermaidCaptureSizes = false;  // disable
//
// Each diagram rendered while enabled updates `window.mermaidLastCapturedSizes`
// and is also appended to `window.mermaidCapturedSizes` (an array) for
// programmatic access from dev-explorer or test tooling.
// ─────────────────────────────────────────────────────────────────────────────

type D3Selection<T extends SVGElement = SVGElement> = Selection<
  T,
  unknown,
  Element | null,
  unknown
>;

interface CapturedNodeSize {
  id: string;
  width: number;
  height: number;
  /**
   * Measured label box, from `labelHelper`. Needed by the DDLT JSDOM measure
   * path, which re-runs the real shape handlers to obtain each node's
   * `intersect`; a handler builds its outline from this box, and the outline is
   * not recoverable from `width`/`height` because padding varies by shape and
   * by `look`.
   */
  labelBBox?: { width: number; height: number };
}

interface CapturedGroupLabelSize {
  id: string;
  labelBBox: { width: number; height: number };
}

interface CapturedEdgeLabelSize {
  id: string;
  width: number;
  height: number;
}

interface CapturedSizesMetadata {
  captureVersion: number;
  capturedAt: string;
  capturedFrom: string;
}

interface CapturedSizes {
  nodes: CapturedNodeSize[];
  /**
   * Group label boxes and edge label sizes. Present for every capture taken
   * since they were added; a fixture on disk without them was captured earlier.
   */
  groups: CapturedGroupLabelSize[];
  edges: CapturedEdgeLabelSize[];
  metadata: CapturedSizesMetadata;
}

interface CapturedEntry {
  svgId: string;
  sizes: CapturedSizes;
}

interface CaptureGlobal {
  mermaidCaptureSizes?: boolean;
  mermaidCapturedSizes?: CapturedEntry[];
  mermaidLastCapturedSizes?: CapturedEntry;
}

function getCaptureGlobal(): CaptureGlobal | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  return globalThis as unknown as CaptureGlobal;
}

/**
 * Whether DDLT size capture is enabled. Kept here so callers can avoid importing
 * this module at all in production — the createGraph guard reads the raw
 * `globalThis.mermaidCaptureSizes` flag directly and only dynamically imports
 * this module when it is truthy.
 */
export function shouldCaptureSizes(): boolean {
  return Boolean(getCaptureGlobal()?.mermaidCaptureSizes);
}

function capturedFromLocation(): string {
  if (typeof location === 'undefined') {
    return 'browser-dev';
  }
  return `${location.pathname}${location.search}`;
}

function emitCapturedSizes(captured: CapturedSizes, element: D3Selection): void {
  const g = getCaptureGlobal();
  if (!g) {
    return;
  }

  // Identify the owning SVG so captures can be told apart when a page
  // renders many diagrams (e.g. knsv3.html).
  const domNode = element.node();
  const ownerSvg =
    (domNode && 'ownerSVGElement' in domNode ? domNode.ownerSVGElement : null) ?? domNode;
  const svgId = ownerSvg?.id ?? '(unknown)';

  // `mermaidCapturedSizes` accumulates one entry per captured render and is never
  // trimmed; in a long dev session, `delete window.mermaidCapturedSizes` to reset it.
  g.mermaidCapturedSizes ??= [];
  const entry = { svgId, sizes: captured };
  g.mermaidCapturedSizes.push(entry);
  g.mermaidLastCapturedSizes = entry;
}

/**
 * Record every measured layout INPUT from an already-measured
 * {@link LayoutData} into `window.mermaidCapturedSizes`.
 *
 * Three kinds, because different layout engines consume different ones:
 *
 * - `nodes` — leaf `width`/`height` from `insertMeasuredNode`, plus the
 *   `labelBBox` measured by `labelHelper`. Every engine uses the sizes; the
 *   label box is what lets DDLT re-run a shape handler to recover `intersect`.
 * - `groups` — cluster `labelBBox` from `measureGroupLabel`. A group's own
 *   width/height are an output of layout, so they are deliberately not captured;
 *   ELK sizes compound nodes from the label box alone.
 * - `edges` — `width`/`height` written onto the edge by `insertEdgeLabel`.
 *   Engines that turn labels into dummy nodes already have these under `nodes`;
 *   ELK keeps the label on the edge, so it needs them here.
 *
 * All read from fields set by `createGraphWithElements` during measurement, so
 * the capture lives entirely outside the production render path.
 *
 * @param element - The container the diagram was rendered into.
 * @param data4Layout - Layout data whose nodes have been measured.
 */
export function captureNodeSizes(element: D3Selection, data4Layout: LayoutData): void {
  const nodes: CapturedNodeSize[] = [];
  const groups: CapturedGroupLabelSize[] = [];
  for (const node of data4Layout.nodes) {
    if (node.isGroup) {
      const bbox = node.labelBBox;
      if (bbox) {
        groups.push({
          id: node.id,
          labelBBox: { width: bbox.width, height: bbox.height },
        });
      }
      continue;
    }
    const labelBBox = node.labelBBox;
    nodes.push({
      id: node.id,
      width: node.width ?? 0,
      height: node.height ?? 0,
      // Absent for nodes whose shape never calls `labelHelper` (it is the sole
      // writer for leaves). Omitted rather than zeroed so the applier can tell
      // "this shape has no measured label" from "we captured a 0x0 one".
      ...(labelBBox ? { labelBBox: { width: labelBBox.width, height: labelBBox.height } } : {}),
    });
  }

  const edges: CapturedEdgeLabelSize[] = [];
  for (const edge of data4Layout.edges) {
    // `insertEdgeLabel` only runs for edges that have a label, so an unlabelled
    // edge has no measured size and is left out rather than recorded as 0×0 —
    // the applier can then tell "no label" from "label we failed to capture".
    const { width, height } = edge as { width?: number; height?: number };
    if (typeof width === 'number' && typeof height === 'number' && edge.id) {
      edges.push({ id: edge.id, width, height });
    }
  }

  if (nodes.length === 0) {
    return;
  }
  emitCapturedSizes(
    {
      metadata: {
        captureVersion: DDLT_SIZE_CAPTURE_VERSION,
        capturedAt: new Date().toISOString(),
        capturedFrom: capturedFromLocation(),
      },
      nodes,
      groups,
      edges,
    },
    element
  );
}
