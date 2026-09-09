import type { Selection } from 'd3';
import type { LayoutData } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import type { ValidateLayoutResult } from '../layout-utils/validateLayout.js';

// ─────────────────────────────────────────────────────────────────────────────
// Layout validation capture (dev / test tooling — NOT part of production
// rendering)
//
// Sibling of `sizeCapture.ts`, and loaded the same way: `common/index.ts`
// dynamically imports this module ONLY when `window.mermaidCaptureValidation`
// is set, so it never lands in a production render path — it compiles to a
// lazily-loaded chunk that is fetched only when a developer turns capture on.
//
// Toggle from the browser devtools:
//
//   window.mermaidCaptureValidation = true;   // enable
//   window.mermaidCaptureValidation = false;  // disable
//
// Each diagram rendered while enabled updates `window.mermaidLastLayoutCapture`
// with the finished `LayoutData`, and installs `window.mermaidValidateLastLayout()`
// to grade it.
//
// ## Why capture and validation are two steps
//
// Validation is not cheap — several quadratic passes over nodes and edges — and
// running it inside `render()` would hold the diagram off the screen until it
// finished. So the render path only *stores* the layout (a reference; see
// below), and the caller decides when to grade it. The Dev Explorer waits for
// the browser to paint the SVG and then calls
// `window.mermaidValidateLastLayout()`, so the picture appears first and the
// score arrives after.
// ─────────────────────────────────────────────────────────────────────────────

type D3Selection<T extends SVGElement = SVGElement> = Selection<
  T,
  unknown,
  Element | null,
  unknown
>;

export interface CapturedLayout {
  /** `id` of the owning `<svg>`, so captures can be told apart on a page with many diagrams. */
  svgId: string;
  /** Layout name this render used, when the render path stamped one. */
  layoutAlgorithm?: string;
  /** `Date.now()` at capture. */
  capturedAt: number;
  /**
   * The finished layout, held by reference rather than cloned.
   *
   * A clone is what you would want if the object could still change, but it
   * cannot: `render()` has finished with it by the time this runs, and the next
   * render builds fresh `LayoutData` rather than mutating this one. Cloning
   * would also be the expensive half of the operation on a large diagram, and
   * a structural clone would not survive the DOM handles some nodes carry.
   */
  layout: LayoutData;
}

interface ValidationCaptureGlobal {
  mermaidCaptureValidation?: boolean;
  mermaidLastLayoutCapture?: CapturedLayout;
  mermaidValidateLastLayout?: () => ValidateLayoutResult | undefined;
}

function getCaptureGlobal(): ValidationCaptureGlobal | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }
  return globalThis as unknown as ValidationCaptureGlobal;
}

/**
 * Whether validation capture is enabled. Kept here so callers need not import
 * this module at all in production — the `common/index.ts` guard reads the raw
 * `globalThis.mermaidCaptureValidation` flag and only imports when it is truthy.
 */
export function shouldCaptureValidation(): boolean {
  return Boolean(getCaptureGlobal()?.mermaidCaptureValidation);
}

/**
 * Record a finished {@link LayoutData} so it can be graded after paint.
 *
 * Deliberately does not call `validateLayout` itself — see the module comment.
 *
 * @param element - The container the diagram was rendered into.
 * @param data4Layout - The laid-out, painted layout data.
 */
export function captureLayoutForValidation(element: D3Selection, data4Layout: LayoutData): void {
  const g = getCaptureGlobal();
  if (!g) {
    return;
  }

  const domNode = element.node();
  const ownerSvg =
    (domNode && 'ownerSVGElement' in domNode ? domNode.ownerSVGElement : null) ?? domNode;

  g.mermaidLastLayoutCapture = {
    svgId: ownerSvg?.id ?? '(unknown)',
    layoutAlgorithm: (data4Layout as { layoutAlgorithm?: string }).layoutAlgorithm,
    capturedAt: Date.now(),
    layout: data4Layout,
  };

  // Installed on every capture rather than once, so it is present no matter
  // which render first enabled the flag.
  g.mermaidValidateLastLayout = () => {
    const captured = getCaptureGlobal()?.mermaidLastLayoutCapture;
    return captured ? validateLayout(captured.layout) : undefined;
  };
}
