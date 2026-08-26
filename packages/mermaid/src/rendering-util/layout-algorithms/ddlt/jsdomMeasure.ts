/**
 * DDLT measure step: run the REAL measure phase against captured sizes.
 *
 * ## Why this exists
 *
 * DDLT's rule is that a test must run the same layout entry point the browser
 * does. `createCommonLayoutRenderer` has three steps — prepare, measure, run —
 * and only the middle one needs a DOM, so DDLT historically replaced it wholesale
 * with `applyFixture*Sizes`, writing `width`/`height` straight onto the nodes.
 *
 * That shortcut silently dropped everything ELSE the measure step produces. The
 * one that matters is `node.intersect`: every shape module assigns it inside its
 * draw function (`drawRect.ts`, `stadium.ts`, …), so skipping the draw leaves it
 * `undefined`. Downstream, `computeNodeIntersection` in the ELK adapter is
 * `tryNodeIntersect(node, …) ?? fallbackIntersection(…)`, so a missing
 * `intersect` silently demotes every edge endpoint to a crude fallback that
 * clips along an arbitrary interior line instead of the shape outline. The
 * harness then grades geometry no browser ever produces — measured on the ELK
 * edge-case corpus as 251 hard issues against the browser's 36.
 *
 * So this module renders the nodes for real, under JSDOM, and lets the shapes
 * attach their own `intersect`. The only thing faked is measurement itself:
 * JSDOM has no layout engine, so `getBBox` / `getBoundingClientRect` are
 * temporarily backed by the captured fixture. Everything else — which shape
 * handler runs, what geometry it builds, what it closes over — is production code.
 *
 * ## How the stub knows what to return
 *
 * Two different boxes are read during measurement and they are not
 * interchangeable:
 *
 * - the LABEL box, read by `labelHelper` (and `insertEdgeLabel`) — the shape's
 *   own geometry is derived from it, so it decides the outline;
 * - the NODE box, read by `updateNodeBounds` / `insertMeasuredNode` — the
 *   node's final `width`/`height`.
 *
 * They are told apart by DOM ancestry, which the render code already
 * establishes: `labelHelper` puts the label in a `g.label` inside a shape group
 * carrying the node's id, and `insertEdgeLabel` tags its `g.label` with
 * `data-id="<edgeId>"`. So the resolution is: nearest `[data-id]` ⇒ edge label;
 * otherwise nearest id that names a known node ⇒ that node, label box if the
 * read happens inside its `g.label`, node box otherwise.
 */
import type { Selection } from 'd3';
import { select } from 'd3';
import type { LayoutData } from '../../types.js';
import type { SizesFixture } from './types.js';
import { defaultMeasureLayout } from '../common/index.js';

type D3Selection<T extends SVGElement = SVGElement> = Selection<
  T,
  unknown,
  Element | null,
  unknown
>;

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Box {
  width: number;
  height: number;
}

export interface JsdomMeasureOptions {
  /** Forwarded to `defaultMeasureLayout`; ELK opts in. */
  unwrapGroupLabels?: boolean;
}

export interface JsdomMeasureResult {
  /**
   * Reads the stub could not attribute to any fixture entry and could not
   * answer as text either, answered with a zero box.
   *
   * Should be 0. A non-zero value means the ancestry assumptions above have
   * drifted from the render code, so callers surface it rather than hide it.
   */
  unresolvedReads: number;
  /**
   * Reads answered with an estimated text box — see {@link estimateTextBox}.
   *
   * Expected to be non-zero: the render path takes text measurements outside any
   * node's subtree, which no fixture describes and which only steer wrapping.
   */
  syntheticTextReads: number;
}

/**
 * Run the real measure phase with `getBBox`/`getBoundingClientRect` backed by
 * `fixture`, mutating `layout` exactly as the browser's measure step does —
 * including attaching each shape's `intersect`.
 */
export async function measureLayoutWithFixture(
  layout: LayoutData,
  fixture: SizesFixture,
  options: JsdomMeasureOptions = {}
): Promise<JsdomMeasureResult> {
  if (typeof document === 'undefined') {
    throw new Error(
      'measureLayoutWithFixture needs a DOM. Run the spec under vitest’s jsdom environment.'
    );
  }

  const resolver = createBoxResolver(layout, fixture);
  const container = document.createElementNS(SVG_NS, 'svg');
  document.body.append(container);
  const restore = installMeasurementStubs(resolver);

  try {
    await defaultMeasureLayout(
      layout,
      { element: select(container) as unknown as D3Selection } as Parameters<
        typeof defaultMeasureLayout
      >[1],
      { unwrapGroupLabels: options.unwrapGroupLabels }
    );
  } finally {
    restore();
    container.remove();
  }

  return {
    unresolvedReads: resolver.unresolvedReads,
    syntheticTextReads: resolver.syntheticTextReads,
  };
}

interface BoxResolver {
  resolve: (element: Element) => Box;
  unresolvedReads: number;
  syntheticTextReads: number;
}

/** Rough per-character advance and line height for {@link estimateTextBox}. */
const ESTIMATED_CHAR_WIDTH = 8;
const ESTIMATED_LINE_HEIGHT = 18;

/**
 * Estimate a text element's box from its content, or `null` if the element is
 * not a text carrier.
 *
 * Used only for reads that cannot be attributed to a fixture entry, which are
 * all auxiliary text metrics: `calculateTextDimensions` measures in a throwaway
 * `<svg>` appended to `body`, `createText` measures before `insertEdgeLabel`
 * moves the element under its `data-id` label, and `addHtmlSpan` measures its
 * own `div` to decide whether the label needs wrapping. None of them decides a
 * box the layout consumes: every box that does — the label box a shape builds
 * its outline from, and the node's outer box — is read from an element inside
 * the node's own subtree and answered from the fixture.
 *
 * The value therefore only has to be plausible: `utils.ts` treats a 0x0 text box
 * as "svg element not in render tree" and throws, so text that exists must
 * measure non-zero, while an empty carrier legitimately measures 0x0.
 */
function estimateTextBox(element: Element): Box | null {
  if (!isTextCarrier(element)) {
    return null;
  }
  const lines = (element.textContent ?? '').split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  return {
    width: longest * ESTIMATED_CHAR_WIDTH,
    height: longest === 0 ? 0 : lines.length * ESTIMATED_LINE_HEIGHT,
  };
}

/**
 * Whether an element is one that carries label text — an SVG `<text>`/`<tspan>`,
 * or HTML inside a `<foreignObject>`.
 *
 * Decided structurally rather than by "does it have text", so that an element
 * that is genuinely unaccounted for still counts as unresolved instead of being
 * waved through as an empty label.
 */
function isTextCarrier(element: Element): boolean {
  const tag = element.tagName?.toLowerCase();
  if (tag === 'text' || tag === 'tspan') {
    return true;
  }
  return Boolean(element.closest?.('foreignObject'));
}

function createBoxResolver(layout: LayoutData, fixture: SizesFixture): BoxResolver {
  // Keyed by both `id` and `domId`: `labelHelper` writes `node.domId || node.id`
  // onto the shape group, and flowchart nodes carry a prefixed `domId`.
  const nodeBox = new Map<string, Box>();
  const labelBox = new Map<string, Box>();

  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const domIdsFor = (id: string): string[] => {
    const node = byId.get(id) as { domId?: string } | undefined;
    return node?.domId && node.domId !== id ? [id, node.domId] : [id];
  };

  for (const size of fixture.nodes) {
    for (const key of domIdsFor(size.id)) {
      nodeBox.set(key, { width: size.width, height: size.height });
      if (size.labelBBox) {
        labelBox.set(key, { width: size.labelBBox.width, height: size.labelBBox.height });
      }
    }
  }
  for (const group of fixture.groups ?? []) {
    for (const key of domIdsFor(group.id)) {
      labelBox.set(key, { width: group.labelBBox.width, height: group.labelBBox.height });
    }
  }

  const edgeBox = new Map<string, Box>();
  for (const edge of fixture.edges ?? []) {
    edgeBox.set(edge.id, { width: edge.width, height: edge.height });
  }

  const resolver: BoxResolver = {
    unresolvedReads: 0,
    syntheticTextReads: 0,
    resolve(element: Element): Box {
      // Edge labels first: their `g.label` carries `data-id`, and unlike nodes
      // they have no outer box to disambiguate against.
      const edgeHost = element.closest?.('[data-id]');
      const edgeId = edgeHost?.getAttribute('data-id');
      if (edgeId) {
        const box = edgeBox.get(edgeId);
        if (box) {
          return box;
        }
      }

      const known = (id: string) => nodeBox.has(id) || labelBox.has(id);
      // Upwards first, then downwards: a node carrying a link is wrapped in an
      // `<a>` that sits OUTSIDE the shape group, so `insertMeasuredNode`
      // measures an element whose id is on a descendant rather than an ancestor.
      const host = closestKnownHost(element, known) ?? knownDescendantHost(element, known);
      if (host) {
        const id = host.getAttribute('id')!;
        // A read from inside the shape group's own `g.label` is the label
        // measurement; anything else on that group is the node's outer box.
        const insideLabel = element.closest?.('g.label');
        if (insideLabel && host.contains(insideLabel)) {
          const box = labelBox.get(id);
          if (box) {
            return box;
          }
        }
        const box = nodeBox.get(id);
        if (box) {
          return box;
        }
        // Groups have a label box but no captured outer box: their size is an
        // OUTPUT of layout, so there is nothing to report here.
        const groupLabel = labelBox.get(id);
        if (groupLabel) {
          return groupLabel;
        }
      }

      const estimated = estimateTextBox(element);
      if (estimated) {
        resolver.syntheticTextReads++;
        return estimated;
      }

      resolver.unresolvedReads++;
      return { width: 0, height: 0 };
    },
  };
  return resolver;
}

/**
 * Nearest descendant whose `id` names something we have a box for.
 *
 * The mirror of {@link closestKnownHost}, for the wrapper case: an element that
 * contains the shape group rather than being contained by it.
 */
function knownDescendantHost(element: Element, known: (id: string) => boolean): Element | null {
  for (const candidate of element.querySelectorAll?.('[id]') ?? []) {
    const id = candidate.getAttribute('id');
    if (id && known(id)) {
      return candidate;
    }
  }
  return null;
}

/** Nearest ancestor-or-self whose `id` attribute names something we have a box for. */
function closestKnownHost(element: Element, known: (id: string) => boolean): Element | null {
  let current: Element | null = element;
  while (current) {
    const id = current.getAttribute?.('id');
    if (id && known(id)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Patch the measurement primitives JSDOM does not implement, returning an undo.
 *
 * Patched on `Element.prototype` rather than per element because the render path
 * measures elements this module never sees — the label `div` inside a
 * `foreignObject` among them.
 */
function installMeasurementStubs(resolver: BoxResolver): () => void {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const saved = new Map<string, PropertyDescriptor | undefined>();

  const patch = (name: string, value: unknown) => {
    saved.set(name, Object.getOwnPropertyDescriptor(proto, name));
    Object.defineProperty(proto, name, { value, configurable: true, writable: true });
  };

  patch('getBBox', function (this: Element) {
    const { width, height } = resolver.resolve(this);
    return { x: 0, y: 0, width, height, top: 0, left: 0, right: width, bottom: height };
  });
  patch('getBoundingClientRect', function (this: Element) {
    const { width, height } = resolver.resolve(this);
    return {
      x: 0,
      y: 0,
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      toJSON: () => ({ width, height }),
    };
  });
  // Text-length reads feed wrapping decisions. The captured label box already
  // reflects whatever wrapping the browser did, so returning the resolved width
  // keeps the two consistent instead of introducing a second, invented metric.
  patch('getComputedTextLength', function (this: Element) {
    return resolver.resolve(this).width;
  });

  return () => {
    for (const [name, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(proto, name, descriptor);
      } else {
        delete proto[name];
      }
    }
  };
}
