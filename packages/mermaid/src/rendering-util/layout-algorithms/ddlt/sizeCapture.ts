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
// cypress/platform/dev-diagrams/layout-tests/*.sizes.json).
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
}

interface CapturedSizesMetadata {
  captureVersion: number;
  capturedAt: string;
  capturedFrom: string;
}

interface CapturedSizes {
  nodes: CapturedNodeSize[];
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
 * Record the measured sizes of every leaf + edge-label node from an
 * already-laid-out {@link LayoutData} into `window.mermaidCapturedSizes`.
 *
 * Reads `node.width`/`node.height` set by createGraphWithElements during
 * measurement, so the capture lives entirely outside the production render path.
 *
 * @param element - The container the diagram was rendered into.
 * @param data4Layout - Layout data whose nodes have been measured.
 */
export function captureNodeSizes(element: D3Selection, data4Layout: LayoutData): void {
  const nodes: CapturedNodeSize[] = [];
  for (const node of data4Layout.nodes) {
    if (node.isGroup) {
      continue;
    }
    nodes.push({ id: node.id, width: node.width ?? 0, height: node.height ?? 0 });
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
    },
    element
  );
}
