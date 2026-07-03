import { FlowDB } from './flowDb.js';
import type { FlowSubGraph, FlowText } from './types.js';

describe('flow db subgraphs', () => {
  let flowDb: FlowDB;
  let subgraphs: FlowSubGraph[];
  beforeEach(() => {
    flowDb = new FlowDB();
    subgraphs = [
      { nodes: ['a', 'b', 'c', 'e'] },
      { nodes: ['f', 'g', 'h'] },
      { nodes: ['i', 'j'] },
      { nodes: ['k'] },
    ] as FlowSubGraph[];
  });
  describe('exist', () => {
    it('should return true when the is exists in a subgraph', () => {
      expect(flowDb.exists(subgraphs, 'a')).toBe(true);
      expect(flowDb.exists(subgraphs, 'h')).toBe(true);
      expect(flowDb.exists(subgraphs, 'j')).toBe(true);
      expect(flowDb.exists(subgraphs, 'k')).toBe(true);
    });
    it('should return false when the is exists in a subgraph', () => {
      expect(flowDb.exists(subgraphs, 'a2')).toBe(false);
      expect(flowDb.exists(subgraphs, 'l')).toBe(false);
    });
  });

  describe('makeUniq', () => {
    it('should remove ids from sungraph that already exists in another subgraph even if it gets empty', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['i', 'j'] } as FlowSubGraph, subgraphs);

      expect(subgraph.nodes).toEqual([]);
    });
    it('should remove ids from sungraph that already exists in another subgraph', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['i', 'j', 'o'] } as FlowSubGraph, subgraphs);

      expect(subgraph.nodes).toEqual(['o']);
    });
    it('should not remove ids from subgraph if they are unique', () => {
      const subgraph = flowDb.makeUniq({ nodes: ['q', 'r', 's'] } as FlowSubGraph, subgraphs);

      expect(subgraph.nodes).toEqual(['q', 'r', 's']);
    });
  });
});

describe('flow db addClass', () => {
  let flowDb: FlowDB;
  beforeEach(() => {
    flowDb = new FlowDB();
  });
  it('should detect many classes', () => {
    flowDb.addClass('a,b', ['stroke-width: 8px']);
    const classes = flowDb.getClasses();

    expect(classes.has('a')).toBe(true);
    expect(classes.has('b')).toBe(true);
    expect(classes.get('a')?.styles).toEqual(['stroke-width: 8px']);
    expect(classes.get('b')?.styles).toEqual(['stroke-width: 8px']);
  });

  it('should detect single class', () => {
    flowDb.addClass('a', ['stroke-width: 8px']);
    const classes = flowDb.getClasses();

    expect(classes.has('a')).toBe(true);
    expect(classes.get('a')?.styles).toEqual(['stroke-width: 8px']);
  });
});

describe('flow db class', () => {
  let flowDb: FlowDB;
  beforeEach(() => {
    flowDb = new FlowDB();
  });
  // This is to ensure that functions used in flow JISON are exposed as function from FlowDB
  it('should have functions used in flow JISON as own property', () => {
    const functionsUsedInParser = [
      'setDirection',
      'addSubGraph',
      'setAccTitle',
      'setAccDescription',
      'addVertex',
      'addLink',
      'setClass',
      'destructLink',
      'addClass',
      'setClickEvent',
      'setTooltip',
      'setLink',
      'updateLink',
      'updateLinkInterpolate',
    ] as const satisfies (keyof FlowDB)[];

    for (const fun of functionsUsedInParser) {
      expect(Object.hasOwn(flowDb, fun)).toBe(true);
    }
  });
});

describe('flow db getData', () => {
  let flowDb: FlowDB;
  beforeEach(() => {
    flowDb = new FlowDB();
  });

  it('should use defaultInterpolate for edges without specific interpolate', () => {
    flowDb.addVertex('A', { text: 'A', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addVertex('B', { text: 'B', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addLink(['A'], ['B'], {});
    flowDb.updateLinkInterpolate(['default'], 'stepBefore');

    const { edges } = flowDb.getData();
    expect(edges[0].curve).toBe('stepBefore');
  });

  it('should prioritize edge-specific interpolate over defaultInterpolate', () => {
    flowDb.addVertex('A', { text: 'A', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addVertex('B', { text: 'B', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addLink(['A'], ['B'], {});
    flowDb.updateLinkInterpolate(['default'], 'stepBefore');
    flowDb.updateLinkInterpolate([0], 'basis');

    const { edges } = flowDb.getData();
    expect(edges[0].curve).toBe('basis');
  });

  it('should support modifying interpolate using edge id syntax', () => {
    flowDb.addVertex('A', { text: 'A', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addVertex('B', { text: 'B', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addVertex('C', { text: 'C', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addVertex('D', { text: 'D', type: 'text' }, undefined, [], [], '', {}, undefined);
    flowDb.addLink(['A'], ['B'], {});
    flowDb.addLink(['A'], ['C'], { id: 'e2' });
    flowDb.addLink(['B'], ['D'], { id: 'e3' });
    flowDb.addLink(['C'], ['D'], {});
    flowDb.updateLinkInterpolate(['default'], 'stepBefore');
    flowDb.updateLinkInterpolate([0], 'basis');
    flowDb.addVertex(
      'e2',
      { text: 'Shouldnt be used', type: 'text' },
      undefined,
      [],
      [],
      '',
      {},
      ' curve: monotoneX '
    );
    flowDb.addVertex(
      'e3',
      { text: 'Shouldnt be used', type: 'text' },
      undefined,
      [],
      [],
      '',
      {},
      ' curve: catmullRom '
    );

    const { edges } = flowDb.getData();
    expect(edges[0].curve).toBe('basis');
    expect(edges[1].curve).toBe('monotoneX');
    expect(edges[2].curve).toBe('catmullRom');
    expect(edges[3].curve).toBe('stepBefore');
  });
});

describe('flow db collapsible subgraphs', () => {
  let flowDb: FlowDB;
  beforeEach(() => {
    flowDb = new FlowDB();
  });

  const addVertex = (id: string) =>
    flowDb.addVertex(id, { text: id, type: 'text' }, undefined, [], [], '', {}, undefined);

  // Attach `@{ view: ... }` metadata to an already-declared subgraph, mirroring
  // how the parser reduces a bare `sub1@{ view: collapsed }` statement.
  const attachMeta = (id: string, meta: string) =>
    flowDb.addVertex(id, undefined as unknown as FlowText, undefined, [], [], '', {}, meta);

  it('renders a subgraph normally (as a group) when no collapse metadata is set', () => {
    addVertex('A');
    addVertex('B');
    addVertex('C');
    flowDb.addLink(['A'], ['B'], {});
    flowDb.addLink(['C'], ['A'], {});
    flowDb.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'My Group', type: 'text' });

    const { nodes, edges } = flowDb.getData();
    const sub = nodes.find((n) => n.id === 'sub1');
    expect(sub?.isGroup).toBe(true);
    expect(nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['A', 'B', 'C', 'sub1']));
    // edge endpoints unchanged
    expect(edges.find((e) => e.start === 'C' && e.end === 'A')).toBeDefined();
  });

  it('renders a collapsed subgraph as a single collapsedGroup node and hides its members', () => {
    addVertex('A');
    addVertex('B');
    addVertex('C');
    flowDb.addLink(['A'], ['B'], {});
    flowDb.addLink(['C'], ['A'], {});
    flowDb.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'My Group', type: 'text' });
    attachMeta('sub1', ' view: collapsed ');

    const { nodes } = flowDb.getData();
    const sub = nodes.find((n) => n.id === 'sub1');
    expect(sub).toBeDefined();
    expect(sub?.shape).toBe('collapsedGroup');
    expect(sub?.isGroup).toBe(false);
    // The collapsed node keeps the subgraph's title
    expect(sub?.label).toBe('My Group');
    // Internal members are hidden
    expect(nodes.find((n) => n.id === 'A')).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')).toBeUndefined();
    // External node remains
    expect(nodes.find((n) => n.id === 'C')).toBeDefined();
  });

  it('redirects edges crossing into a collapsed subgraph to the collapsed node', () => {
    addVertex('A');
    addVertex('B');
    addVertex('C');
    flowDb.addLink(['C'], ['A'], {});
    flowDb.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'My Group', type: 'text' });
    attachMeta('sub1', ' view: collapsed ');

    const { edges } = flowDb.getData();
    // C --> A becomes C --> sub1
    expect(edges.find((e) => e.start === 'C' && e.end === 'sub1')).toBeDefined();
    expect(edges.find((e) => e.end === 'A')).toBeUndefined();
  });

  it('drops edges fully internal to a collapsed subgraph (avoids a self-loop)', () => {
    addVertex('A');
    addVertex('B');
    flowDb.addLink(['A'], ['B'], {});
    flowDb.addSubGraph({ text: 'sub1' }, ['A', 'B'], { text: 'My Group', type: 'text' });
    attachMeta('sub1', ' view: collapsed ');

    const { edges } = flowDb.getData();
    // A --> B is internal to sub1; it would collapse to sub1 --> sub1 and is dropped
    expect(edges).toHaveLength(0);
  });

  it('redirects edges to the outermost collapsed ancestor for nested collapsed subgraphs', () => {
    addVertex('A');
    addVertex('B');
    addVertex('C');
    flowDb.addLink(['C'], ['A'], {});
    // inner subgraph contains A, B; outer subgraph contains inner + C-less
    flowDb.addSubGraph({ text: 'inner' }, ['A', 'B'], { text: 'Inner', type: 'text' });
    flowDb.addSubGraph({ text: 'outer' }, ['inner'], { text: 'Outer', type: 'text' });
    attachMeta('inner', ' view: collapsed ');
    attachMeta('outer', ' view: collapsed ');

    const { nodes, edges } = flowDb.getData();
    // Only the outer collapsed node is visible
    expect(nodes.find((n) => n.id === 'outer')?.shape).toBe('collapsedGroup');
    expect(nodes.find((n) => n.id === 'inner')).toBeUndefined();
    expect(nodes.find((n) => n.id === 'A')).toBeUndefined();
    // C --> A redirects all the way to the outer collapsed node
    expect(edges.find((e) => e.start === 'C' && e.end === 'outer')).toBeDefined();
  });
});

describe('flow db direction', () => {
  let flowDb: FlowDB;
  beforeEach(() => {
    flowDb = new FlowDB();
  });

  it('should set direction to TB when TD is set', () => {
    flowDb.setDirection('TD');
    expect(flowDb.getDirection()).toBe('TB');
  });

  it('should correctly set direction irrespective of leading spaces', () => {
    flowDb.setDirection(' TD');
    expect(flowDb.getDirection()).toBe('TB');
  });
});
