import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import type { SVG } from '../../diagram-api/types.js';
import type {
  UsecaseLayoutCluster,
  UsecaseLayoutData,
  UsecaseLayoutEdge,
  UsecaseLayoutNode,
} from './usecaseTypes.js';
import { db } from './usecaseDb.js';
import {
  getUsecaseBoundaryAccessibleName,
  getUsecaseEdgeAccessibleName,
  getUsecaseNodeAccessibleName,
  prepareUsecaseLayoutData,
  renderer,
  USECASE_MARKERS,
  usecaseDomId,
} from './usecaseRenderer.js';

const renderCallStyles: (string | null)[] = [];

vi.mock('../../rendering-util/render.js', () => ({
  getRegisteredLayoutAlgorithm: () => 'dagre',
  render: (_data: UsecaseLayoutData, svg: SVG) => {
    // Labels are measured inside `render`, so record the fonts that were in force at that moment.
    renderCallStyles.push(svg.node()?.getAttribute('style') ?? null);
    return Promise.resolve();
  },
}));

const node = (overrides: Partial<UsecaseLayoutNode>): UsecaseLayoutNode =>
  ({
    id: 'Element',
    label: 'Element label',
    labelType: 'text',
    shape: 'usecaseEllipse',
    isGroup: false,
    ...overrides,
  }) as UsecaseLayoutNode;

const edge = (overrides: Partial<UsecaseLayoutEdge> = {}): UsecaseLayoutEdge =>
  ({
    id: 'edge-0',
    start: 'A',
    end: 'B',
    source: 'A',
    target: 'B',
    sourceLabel: 'Alpha',
    targetLabel: 'Beta',
    type: 'edge',
    relationshipType: 'association',
    pattern: 'solid',
    arrowTypeStart: 'none',
    arrowTypeEnd: 'point',
    internal: false,
    style: [],
    cssCompiledStyles: [],
    minlen: 1,
    ...overrides,
  }) as UsecaseLayoutEdge;

describe('usecase renderer integration', () => {
  it('requests every relationship marker and assigns sanitized pre-render node identities', () => {
    const data = {
      nodes: [node({ id: 'User' }), node({ id: 'quoted label/id' })],
      edges: [],
      markers: [],
      diagramId: '',
      nodeSpacing: 73,
      rankSpacing: 91,
      diagramPadding: 27,
      useMaxWidth: false,
    } as unknown as UsecaseLayoutData;

    prepareUsecaseLayoutData(data, 'diagram:id 1');

    expect(data.markers).toEqual(USECASE_MARKERS);
    expect(data.nodes.map(({ domId }) => domId)).toEqual([
      'usecase-User',
      'usecase-quoted_label_id',
    ]);
    expect(data).toMatchObject({
      nodeSpacing: 73,
      rankSpacing: 91,
      diagramPadding: 27,
      useMaxWidth: false,
    });
    expect(usecaseDomId('<diagram>', '<model>')).toBe('usecase-diagram-model');
  });

  it('renders plain labels as literal text while preserving measured Markdown stereotypes', () => {
    const data = {
      nodes: [
        node({ id: 'Hostile', label: '<img src=x>& **literal**', labelType: 'text' }),
        node({
          id: 'PlainStereotype',
          label: '**literal with stereotype**',
          labelType: 'text',
          shape: 'usecaseEllipse',
          stereotype: 'Primary *actor*',
        }),
        node({
          id: 'Markdown',
          label: '**formatted**',
          labelType: 'markdown',
          shape: 'usecaseEllipse',
          stereotype: 'Main',
        }),
        node({
          id: 'ActorStereotype',
          shape: 'usecaseActor',
          stereotype: '<img src=x>',
        }),
      ],
      edges: [edge({ label: '<b>edge</b> **literal**', labelType: 'text' })],
      markers: [],
      diagramId: '',
    } as unknown as UsecaseLayoutData;

    prepareUsecaseLayoutData(data, 'diagram');

    expect(data.nodes[0].label).toBe('&lt;img src=x&gt;&amp; **literal**');
    expect(data.nodes[1]).toMatchObject({
      label: '«Primary \\*actor\\*»<br/>\\*\\*literal with stereotype\\*\\*',
      labelType: 'markdown',
    });
    expect(data.nodes[2].label).toBe('«Main»<br/>**formatted**');
    expect(data.edges[0].label).toBe('&lt;b&gt;edge&lt;/b&gt; **literal**');
    expect(data.nodes[3].stereotype).toBe('&lt;img src=x&gt;');
  });

  it.each([
    [
      'normal actor',
      node({ shape: 'usecaseActor', actorType: 'normal', label: 'Customer' }),
      'actor Customer',
    ],
    [
      'hollow actor',
      node({ shape: 'usecaseActorHollow', actorType: 'hollow', label: 'Customer' }),
      'hollow actor Customer',
    ],
    [
      'awesome actor',
      node({ shape: 'usecaseActorAwesome', actorType: 'awesome', label: 'Customer' }),
      'awesome actor Customer',
    ],
    [
      'icon actor',
      node({ shape: 'usecaseActorIcon', actorType: 'icon', label: 'Robot' }),
      'icon actor Robot',
    ],
    [
      'business actor stereotype',
      node({
        shape: 'usecaseActorHollow',
        actorType: 'hollow',
        business: true,
        stereotype: 'External',
        label: 'Customer',
      }),
      'business hollow actor Customer, stereotype External',
    ],
    [
      'business use case stereotype',
      node({ shape: 'usecaseBusiness', business: true, stereotype: 'Main', label: 'Checkout' }),
      'business use case Checkout, stereotype Main',
    ],
  ])('builds the %s semantic name from typed fields', (_name, layoutNode, expected) => {
    expect(getUsecaseNodeAccessibleName(layoutNode)).toBe(expected);
  });

  it('names boundaries, notes, and JSON rows in their semantic order', () => {
    const boundary = {
      id: 'Auth',
      label: 'Authentication',
      labelType: 'text',
      shape: 'usecaseSystemBoundary',
      isGroup: true,
      boundaryType: 'package',
    } as UsecaseLayoutCluster;
    const note = node({
      id: 'note-0',
      shape: 'note',
      noteTarget: 'Login',
      noteTargetLabel: 'Sign in',
      label: 'Requires a session',
    });
    const json = node({
      id: 'Payload',
      shape: 'usecaseJsonTable',
      label: 'Payload',
      jsonRows: [
        { key: 'fruit', accessibleKey: 'fruit', value: 'Apple' },
        { key: '', accessibleKey: 'colors', value: 'Green' },
      ],
    });

    expect(getUsecaseBoundaryAccessibleName(boundary)).toBe(
      'package system boundary Authentication'
    );
    expect(getUsecaseNodeAccessibleName(note)).toBe('Note for Sign in: Requires a session');
    expect(getUsecaseNodeAccessibleName(json)).toBe('Payload: fruit: Apple; colors: Green');
  });

  it('names semantic and labelled association relationships without inspecting label substrings', () => {
    expect(
      getUsecaseEdgeAccessibleName(
        edge({
          relationshipType: 'include',
          label: 'include',
          sourceLabel: 'Checkout',
          targetLabel: 'Payment',
        })
      )
    ).toBe('include from Checkout to Payment');
    expect(
      getUsecaseEdgeAccessibleName(
        edge({ relationshipType: 'association', label: 'includes reporting' })
      )
    ).toBe('association includes reporting from Alpha to Beta');
    expect(getUsecaseEdgeAccessibleName(edge({ relationshipType: 'note', internal: true }))).toBe(
      ''
    );
  });
});

describe('usecase font custom properties', () => {
  const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

  beforeAll(() => {
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 120, height: 60 }),
    });
  });

  afterAll(() => {
    if (originalGetBBox) {
      Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
    } else {
      // @ts-expect-error -- jsdom does not implement getBBox, so remove the stand-in again.
      delete SVGElement.prototype.getBBox;
    }
  });

  it('keeps the label fonts identical between measurement and the final paint', async () => {
    renderCallStyles.length = 0;
    db.clear();
    document.body.innerHTML = '<svg id="usecase-font-vars"></svg>';

    await renderer.draw('usecase-beta', 'usecase-font-vars', '1.0.0', {
      db,
    } as unknown as Diagram);

    const svgElement = document.getElementById('usecase-font-vars') as unknown as SVGSVGElement;
    const expectedFonts = {
      '--mermaid-usecase-actor-font-size': '14px',
      '--mermaid-usecase-actor-font-family': '"Open Sans", sans-serif',
      '--mermaid-usecase-actor-font-weight': 'normal',
      '--mermaid-usecase-font-size': '12px',
      '--mermaid-usecase-font-family': '"Open Sans", sans-serif',
      '--mermaid-usecase-font-weight': 'normal',
    };

    // The labels are sized while `render` runs...
    expect(renderCallStyles).toHaveLength(1);
    for (const [property, value] of Object.entries(expectedFonts)) {
      expect(renderCallStyles[0]).toContain(`${property}: ${value}`);
    }

    // ...and `setupViewPortForSVG` must not drop the same fonts before the diagram is painted,
    // otherwise every label falls back to a different typeface and overflows its foreignObject.
    for (const [property, value] of Object.entries(expectedFonts)) {
      expect(svgElement.style.getPropertyValue(property)).toBe(value);
    }
  });
});
