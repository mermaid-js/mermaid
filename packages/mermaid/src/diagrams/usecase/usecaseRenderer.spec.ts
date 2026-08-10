import { describe, expect, it } from 'vitest';
import type {
  UsecaseLayoutCluster,
  UsecaseLayoutData,
  UsecaseLayoutEdge,
  UsecaseLayoutNode,
} from './usecaseTypes.js';
import {
  getUsecaseBoundaryAccessibleName,
  getUsecaseEdgeAccessibleName,
  getUsecaseNodeAccessibleName,
  prepareUsecaseLayoutData,
  USECASE_MARKERS,
  usecaseDomId,
} from './usecaseRenderer.js';

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
