/**
 * Regression guard: arbitrary `@{ ... }` metadata must never reach the rendered SVG unescaped.
 *
 * `FlowDB.addVertex` stores the raw, YAML-parsed shape-data map on the vertex
 * (`vertex.metadata = { ...vertex.metadata, ...doc }`) and copies it onto the layout node
 * (`node.metadata`). Unlike node labels, these values never pass through `sanitizeText`, so any
 * future code that writes a metadata value into an attribute, a text node, or an HTML label would
 * introduce an injection sink.
 *
 * At the time of writing, no shape handler reads `node.metadata` - the only consumers are the
 * `metadata?.view === 'collapsed'` checks in flowDb. These tests therefore pass trivially today.
 * That is the point: they are a tripwire, not a fix verification. If a shape starts rendering
 * metadata (tooltips, data-* attributes, links, custom labels), this file fails unless the value
 * is escaped on the way out.
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect } from 'vitest';
import mermaid from '../mermaid.js';
import { mermaidAPI } from '../mermaidAPI.js';
import { shapesDefs, shapes } from './rendering-elements/shapes.js';
import type { MermaidConfig } from '../config.type.js';

/**
 * Payloads are constrained by the flowchart lexer (flow.jison `shapeData` / `shapeDataStr`
 * states) and by `yaml.load(..., { schema: JSON_SCHEMA })`:
 * - no `"` - it toggles the lexer's string state and would terminate the scalar early
 * - no `^` - the `<shapeData>[^}^"]+` character class excludes it
 * - no newlines - `shapeDataStr` rewrites `\n\s*` to `<br/>`
 * `}` is fine inside the quoted scalar, and is included on purpose to prove it survives parsing.
 */
const PAYLOADS = {
  // Classic attribute-breakout / element injection.
  htmlTag: '<img src=x onerror=alert(1)>',
  // Breaks out of an SVG <text> node if metadata is ever concatenated into markup.
  textBreakout: '</text><script>alert(1)</script>',
  // Dangerous URL scheme, for any metadata value that becomes an href/src.
  jsUrl: 'javascript:alert(1)',
  // Pre-encoded entities: catches a sink that decodes once too often.
  entities: '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;',
  // Braces inside a quoted scalar, to confirm the payload reaches flowDb intact.
  braces: '<b onclick=alert(1)>{evil}</b>',
} as const;

/** Rendered as `key: "value"` pairs inside `@{ ... }`. */
const METADATA_ENTRIES = Object.entries(PAYLOADS)
  .map(([key, value]) => `${key}: "${value}"`)
  .join(', ');

const RAW_PAYLOADS = Object.values(PAYLOADS);

const BASE_CONFIG: MermaidConfig = {
  deterministicIds: true,
  deterministicIDSeed: '',
  securityLevel: 'loose',
  flowchart: { htmlLabels: true },
  logLevel: 5,
};

/**
 * Renders `code` inside a JSDOM window. Returns both the raw SVG string and the parsed subtree -
 * the string catches payloads that survived verbatim, the DOM catches payloads that were parsed
 * into live elements or attributes.
 */
async function renderInJsdom(
  id: string,
  code: string
): Promise<{ svg: string; container: Element }> {
  const oldWindow = global.window;
  const oldDocument = global.document;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = dom.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = dom.window.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = undefined;

    mermaidAPI.initialize(BASE_CONFIG);

    const { svg } = await mermaidAPI.render(id, code);

    const container = dom.window.document.getElementById('container')!;
    container.innerHTML = svg;

    return { svg, container };
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = oldWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = oldDocument;
  }
}

const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link'];
const URL_ATTRIBUTES = ['href', 'xlink:href', 'src', 'from', 'to', 'values', 'begin'];

/**
 * Payload-agnostic structural assertions. These are the ones that matter: a metadata value could
 * be mangled beyond a literal substring match and still be live markup.
 */
function assertNoLiveInjection(container: Element): void {
  const problems: string[] = [];

  for (const el of container.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (DANGEROUS_TAGS.includes(tag)) {
      problems.push(`<${tag}> element present in output`);
    }

    for (const attr of el.attributes) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith('on')) {
        problems.push(`event-handler attribute ${tag}[${name}="${value}"]`);
      }
      if (
        URL_ATTRIBUTES.includes(name) &&
        /^\s*(javascript|data:text\/html|vbscript):/i.test(value)
      ) {
        problems.push(`dangerous URL in ${tag}[${name}="${value}"]`);
      }
      if (name === 'style' && /expression\(|url\(\s*["']?\s*javascript:/i.test(value)) {
        problems.push(`dangerous style in ${tag}[${name}="${value}"]`);
      }
    }
  }

  if (problems.length > 0) {
    expect.fail(`Metadata reached the SVG as live markup:\n  ${problems.join('\n  ')}`);
  }
}

/**
 * Literal-substring assertion. Complements {@link assertNoLiveInjection}: a payload that is
 * escaped correctly appears as `&lt;img src=x ...` and never as the raw form.
 */
function assertNoRawPayload(svg: string): void {
  for (const payload of RAW_PAYLOADS) {
    expect(svg, `raw payload leaked into SVG: ${payload}`).not.toContain(payload);
  }
}

function assertClean(svg: string, container: Element): void {
  assertNoRawPayload(svg);
  assertNoLiveInjection(container);
}

/**
 * Undocumented shapes are not reachable through `@{ shape: ... }` in a way this suite can drive
 * - each needs its own diagram type, an icon pack, or a loader. Listed explicitly so the coverage
 * meta-test below fails when a new shape is registered without a decision being made.
 */
const EXCLUDED_SHAPES = new Map<string, string>([
  ['state', 'stateDiagram-only shape'],
  ['choice', 'stateDiagram-only shape'],
  ['note', 'stateDiagram-only shape'],
  ['composite', 'stateDiagram-only shape'],
  ['rectWithTitle', 'stateDiagram-only shape'],
  ['labelRect', 'internal label container, not user-selectable'],
  ['block_arrow', 'block-beta-only shape'],
  ['collapsedGroup', 'subgraph-only; covered by the subgraph tests below'],
  ['iconSquare', 'requires a registered icon pack'],
  ['iconCircle', 'requires a registered icon pack'],
  ['icon', 'requires a registered icon pack'],
  ['iconRounded', 'requires a registered icon pack'],
  ['imageSquare', 'requires image loading; covered by the img sink test below'],
  ['anchor', 'internal zero-size anchor, renders no user content'],
  ['kanbanItem', 'kanban-only shape'],
  ['mindmapCircle', 'mindmap-only; cytoscape crashes under JSDOM'],
  ['defaultMindmapNode', 'mindmap-only; cytoscape crashes under JSDOM'],
  ['classBox', 'classDiagram-only shape'],
  ['erBox', 'erDiagram-only shape'],
  ['requirementBox', 'requirementDiagram-only shape'],
]);

describe('Metadata escaping in rendered SVG', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
  });

  describe('every documented flowchart shape', () => {
    for (const { shortName, semanticName } of shapesDefs) {
      it(`"${shortName}" (${semanticName}) does not emit metadata unescaped`, async () => {
        const { svg, container } = await renderInJsdom(
          `metadata-escaping-${shortName}`,
          `flowchart LR
             N0@{ shape: ${shortName}, ${METADATA_ENTRIES} }`
        );
        assertClean(svg, container);
      });
    }

    it('every registered shape is covered by this suite or explicitly excluded', () => {
      const coveredHandlers = new Set<unknown>(shapesDefs.map((shape) => shape.handler));
      const uncovered = Object.entries(shapes)
        .filter(([, handler]) => !coveredHandlers.has(handler))
        .map(([name]) => name)
        .filter((name) => !EXCLUDED_SHAPES.has(name));

      if (uncovered.length > 0) {
        expect.fail(
          `Shape(s) not covered by the metadata-escaping suite: ${uncovered.join(', ')}.\n` +
            'Either drive them from a diagram in this file, or add them to EXCLUDED_SHAPES with a reason.'
        );
      }
    });
  });

  describe('metadata on subgraphs', () => {
    it('subgraph metadata does not emit unescaped values', async () => {
      const { svg, container } = await renderInJsdom(
        'metadata-escaping-subgraph',
        `flowchart LR
           subgraph sg1 [Group]
             A --> B
           end
           sg1@{ ${METADATA_ENTRIES} }`
      );
      assertClean(svg, container);
    });

    it('collapsed subgraph metadata does not emit unescaped values', async () => {
      // Exercises the collapsedGroup shape, which is the one shape that already reads
      // `metadata.view`, making it the most likely place for a second metadata read to appear.
      const { svg, container } = await renderInJsdom(
        'metadata-escaping-subgraph-collapsed',
        `flowchart LR
           subgraph sg1 [Group]
             A --> B
           end
           sg1@{ view: collapsed, ${METADATA_ENTRIES} }`
      );
      assertClean(svg, container);
    });
  });
});
