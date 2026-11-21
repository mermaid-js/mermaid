import { beforeEach, describe, expect, it } from 'vitest';
import { setSiteConfig } from '../../config.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { MarbleDB } from './marbleDb.js';
import { diagram } from './marbleDiagram.js';
import { parser } from './parser/marble.chevrotain.js';

addDiagrams();

const parse = async (text: string): Promise<MarbleDB> => {
  const db = new MarbleDB();
  db.clear();
  parser.parser!.yy = db;
  await parser.parse(text);
  return db;
};

describe('marble parser', () => {
  beforeEach(() => {
    setSiteConfig({});
  });

  it('parses the header alone', async () => {
    const db = await parse('marble-beta');
    expect(db.getTimeline()).toEqual({ ticks: [], lanes: [], breaks: [], columns: 0 });
  });

  it('parses title, lanes, axis and labels', async () => {
    const db = await parse(`marble-beta
  title Debounced search
  axis   : 0    5    10
  input  : -a-b-c-----|
  output : -------c---|
  label a "first key"
  label = "debounce window"
`);
    expect(db.getDiagramTitle()).toBe('Debounced search');
    const { ticks, lanes } = db.getTimeline();
    expect(ticks.map(({ text }) => text)).toEqual(['0', '5', '10']);
    expect(lanes.map(({ name }) => name)).toEqual(['input', 'output']);
    expect(lanes[1].items[0]).toEqual({ kind: 'event', symbol: 'c', col: 7 });
    expect(db.getLabels()).toEqual([
      { symbol: 'a', text: 'first key', colorIndex: 0 },
      { symbol: '=', text: 'debounce window', colorIndex: 1 },
    ]);
  });

  it('measures every lane from the same source column', async () => {
    const db = await parse(`marble-beta
  source  : -a~b----
  inner   :    [===c
`);
    const [source, inner] = db.getTimeline().lanes;
    expect(source.items[0]).toMatchObject({ kind: 'event', col: 1 });
    expect(inner.items[0]).toMatchObject({ kind: 'span', from: 3, to: 7 });
  });

  it('accepts quoted lane names with spaces', async () => {
    const db = await parse(`marble-beta
  "user input" : --a--|
`);
    expect(db.getTimeline().lanes[0].name).toBe('user input');
  });

  it('keeps a lane named title apart from the title statement', async () => {
    const db = await parse(`marble-beta
  title : --a--|
`);
    expect(db.getDiagramTitle()).toBe('');
    expect(db.getTimeline().lanes[0].name).toBe('title');
  });

  it.each(['title  : --a|', 'title\t: --a|', 'title \t : --a|'])(
    'keeps a lane named title apart when blanks pad the colon (%j)',
    async (lane) => {
      const db = await parse(`marble-beta\n  ${lane}\n`);
      expect(db.getDiagramTitle()).toBe('');
      expect(db.getTimeline().lanes[0].name).toBe('title');
    }
  );

  it('labels punctuation symbols', async () => {
    const db = await parse(`marble-beta
  a : -[~~]-#
  label ~ "retrying"
  label # "timeout"
`);
    expect(db.getLabel('~')?.text).toBe('retrying');
    expect(db.getLabel('#')?.text).toBe('timeout');
  });

  it('parses accessibility statements', async () => {
    const db = await parse(`marble-beta
  accTitle: Search timeline
  accDescr {
    Keystrokes are debounced
    before a request is sent
  }
  input : -a-|
`);
    expect(db.getAccTitle()).toBe('Search timeline');
    expect(db.getAccDescription()).toBe('Keystrokes are debounced\nbefore a request is sent');
  });

  it('ignores comment lines', async () => {
    const db = await parse(`marble-beta
  %% a comment
  input : -a-|
`);
    expect(db.getTimeline().lanes).toHaveLength(1);
  });

  it.each([
    ['a lane without a body', 'marble-beta\n  input\n', 'at line 2'],
    ['an unknown statement', 'marble-beta\n  label : --\n', 'at line 2'],
    ['an unclosed label string', 'marble-beta\n  label a "oops\n', 'line 2, column 11'],
    ['a multi-character label symbol', 'marble-beta\n  label ab "x"\n', 'line 2, column 9'],
    ['a duplicate lane', 'marble-beta\n  a : --\n  a : --\n', 'line 3'],
    ['a duplicate label', 'marble-beta\n  label a "x"\n  label a "y"\n', 'line 3, column 9'],
    ['a second axis', 'marble-beta\n  axis : 0\n  axis : 1\n', 'line 3'],
    ['an unclosed group', 'marble-beta\n  a : -(ab-\n', 'line 2, column 8'],
    ['a stray group close', 'marble-beta\n  a : --)\n', 'line 2, column 9'],
    ['a nested group', 'marble-beta\n  a : -(a(b))\n', 'line 2, column 10'],
  ])('rejects %s with a position', async (_name, text, position) => {
    await expect(parse(text)).rejects.toThrow(position);
  });

  it('reports source lines after front matter', async () => {
    const db = new MarbleDB();
    db.setFrontmatterLineOffset(4);
    parser.parser!.yy = db;
    await expect(parser.parse('marble-beta\n  a : --)\n')).rejects.toThrow('at line 6');
  });
});

describe('marble db', () => {
  it('is a new instance on every read of the diagram definition', () => {
    expect(diagram.db).not.toBe(diagram.db);
  });

  it('clear resets everything', async () => {
    const db = await parse(`marble-beta
  title T
  axis : 0
  a : -!-|
  label ! "cancelled"
`);
    db.clear();
    expect(db.getDiagramTitle()).toBe('');
    expect(db.getLabels()).toEqual([]);
    expect(db.getTimeline().lanes).toEqual([]);
    db.build();
    expect(db.getTimeline()).toEqual({ ticks: [], lanes: [], breaks: [], columns: 0 });
  });

  it('merges diagram config over the defaults', () => {
    setSiteConfig({ marble: { columnWidth: 40 } });
    const config = new MarbleDB().getConfig();
    expect(config.columnWidth).toBe(40);
    expect(config.marbleRadius).toBe(10);
    setSiteConfig({});
  });
});

describe('marble detection', () => {
  it('detects marble-beta and gives it a descriptive id', async () => {
    const parsed = await Diagram.fromText('marble-beta\n  a : -a-|');
    expect(parsed.type).toBe('marbleDiagram');
  });

  it('does not claim other text that starts with "marble"', async () => {
    await expect(Diagram.fromText('marbles\n  a : -a-|')).rejects.toThrow(
      'No diagram type detected'
    );
  });

  it('keeps two diagrams on a page apart', async () => {
    const first = await Diagram.fromText('marble-beta\n  a : -a-|');
    const second = await Diagram.fromText('marble-beta\n  b : -b-b-|');
    expect((first.db as MarbleDB).getTimeline().lanes[0].name).toBe('a');
    expect((second.db as MarbleDB).getTimeline().lanes[0].name).toBe('b');
  });
});
