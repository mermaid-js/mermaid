import { beforeEach, describe, expect, it } from 'vitest';
import { diagram } from './wardleyDiagram.js';
import type WardleyDb from './wardleyDb.js';

const parser = diagram.parser;
const db = diagram.db as typeof WardleyDb;

const parse = async (lines: string[], newline = '\n') => {
  db.clear();
  await parser.parse(['wardley-beta', ...lines].join(newline));
  return db.getWardleyData();
};

// Names that are, start with, or begin with the word of a statement keyword.
const keywordNames = [
  // a keyword with more letters after it
  'notebook',
  'sizes',
  'labeller',
  'anchorage',
  'inertial',
  'evolver',
  'evolutions',
  'pipelines',
  'components',
  'annotations list',
  'accelerators',
  'deaccelerators',
  'note-taking',
  // a keyword as the first word
  'note taking app',
  'size guide',
  'label printer',
  'inertia field',
  'pipeline monitor',
  'anchor point',
  'component library',
  'evolve service',
  'annotation service',
  'accelerator board',
  // a keyword on its own
  'size',
  'note',
  'label',
  'inertia',
  'pipeline',
  'anchor',
  'component',
  'evolve',
  'annotation',
  'annotations',
  'accelerator',
  'deaccelerator',
];

describe('wardley names that contain statement keywords', () => {
  beforeEach(() => {
    // @ts-expect-error - since type is set to undefined we will have error
    parser.parser.yy = db;
    db.clear();
  });

  it.each(keywordNames)(
    'parses %s as a component, link end, evolve and accelerator name',
    async (name) => {
      const data = await parse([
        `component ${name} [0.5, 0.5] label [10, -5] inertia`,
        'component Platform [0.3, 0.3] (inertia)',
        `${name} -> Platform`,
        `Platform -> ${name}`,
        `evolve ${name} 0.8`,
        `accelerator ${name} [0.2, 0.2]`,
        `deaccelerator ${name} [0.2, 0.8]`,
      ]);

      const node = data.nodes.find((n) => n.id === name);
      expect(node?.label).toBe(name);
      expect(node?.labelOffsetX).toBe(10);
      expect(node?.labelOffsetY).toBe(-5);
      expect(node?.inertia).toBe(true);
      expect(data.nodes.find((n) => n.id === 'Platform')?.inertia).toBe(true);
      expect(data.links.map((l) => [l.source, l.target])).toEqual([
        [name, 'Platform'],
        ['Platform', name],
      ]);
      expect(data.trends.map((t) => t.nodeId)).toEqual([name]);
      expect(data.accelerators.map((a) => a.name)).toEqual([name]);
      expect(data.deaccelerators.map((d) => d.name)).toEqual([name]);
    }
  );

  it.each(keywordNames)('parses %s as an anchor name', async (name) => {
    const data = await parse([
      `anchor ${name} [0.9, 0.5]`,
      'component Hub [0.5, 0.5]',
      `${name} -> Hub`,
    ]);

    expect(data.nodes.find((n) => n.id === name)?.className).toBe('anchor');
    expect(data.links.map((l) => [l.source, l.target])).toEqual([[name, 'Hub']]);
  });

  it.each(keywordNames)('parses %s as a pipeline and pipeline component name', async (name) => {
    const data = await parse([
      `component ${name} [0.5, 0.5]`,
      `pipeline ${name} {`,
      `  component ${name} [0.6] label [5, 5]`,
      '}',
    ]);

    expect(data.pipelines).toEqual([{ nodeId: name, componentIds: [`${name}_${name}`] }]);
    expect(data.nodes.find((n) => n.id === `${name}_${name}`)?.label).toBe(name);
  });

  // `evolution Genesis -> Custom` and a link from a node named `evolution tracker` look
  // the same, so a line that starts with the word `evolution` stays an evolution statement,
  // and a link from such a node needs the name quoted.
  it.each(['evolution tracker', 'evolution', 'evolutions'])(
    'parses %s as a name, quoted at the start of a link line',
    async (name) => {
      const data = await parse([
        `component ${name} [0.5, 0.5]`,
        'anchor User [0.9, 0.5]',
        'component Hub [0.3, 0.3]',
        `User -> ${name}`,
        `"${name}" -> Hub`,
        `evolve ${name} 0.8`,
      ]);

      expect(data.nodes.find((n) => n.id === name)?.label).toBe(name);
      expect(data.links.map((l) => [l.source, l.target])).toEqual([
        ['User', name],
        [name, 'Hub'],
      ]);
      expect(data.trends.map((t) => t.nodeId)).toEqual([name]);
    }
  );

  it('keeps every statement working on indented lines and with CRLF line endings', async () => {
    const data = await parse(
      [
        '  size [800, 600]',
        '  evolution Genesis -> Custom -> Product -> Commodity',
        '  anchor User [0.9, 0.5]',
        '  component API [0.6, 0.5] label [10, -5] (buy) inertia',
        '  component DB [0.3, 0.5] ( inertia )',
        '  User -> API',
        '  evolve API 0.8',
        '  pipeline API {',
        '    component Cache [0.4]',
        '  }',
        '  note "Watch costs" [0.5, 0.5]',
        '  annotations [0.1, 0.9]',
        '  annotation 1,[0.5, 0.5] "Critical"',
        '  accelerator Speed [0.2, 0.2]',
        '  deaccelerator Drag [0.2, 0.8]',
      ],
      '\r\n'
    );

    expect(data.size).toEqual({ width: 800, height: 600 });
    expect(data.axes.stages).toEqual(['Genesis', 'Custom', 'Product', 'Commodity']);
    expect(data.nodes.map((n) => n.id)).toEqual(['User', 'API', 'DB', 'API_Cache']);
    const api = data.nodes.find((n) => n.id === 'API');
    expect(api).toMatchObject({ labelOffsetX: 10, labelOffsetY: -5, inertia: true });
    expect(api?.sourceStrategy).toBe('buy');
    expect(data.nodes.find((n) => n.id === 'DB')?.inertia).toBe(true);
    expect(data.links.map((l) => [l.source, l.target])).toEqual([['User', 'API']]);
    expect(data.trends.map((t) => t.nodeId)).toEqual(['API']);
    expect(data.notes.map((n) => n.text)).toEqual(['Watch costs']);
    expect(data.annotationsBox).toBeDefined();
    expect(data.annotations.map((a) => a.text)).toEqual(['Critical']);
    expect(data.accelerators.map((a) => a.name)).toEqual(['Speed']);
    expect(data.deaccelerators.map((d) => d.name)).toEqual(['Drag']);
  });
});
