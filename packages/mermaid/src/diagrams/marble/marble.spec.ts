import { beforeEach, describe, expect, it } from 'vitest';
import { setSiteConfig } from '../../config.js';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../preprocess.js';
import { MarbleDB } from './marbleDb.js';
import { diagram } from './marbleDiagram.js';
import { parser } from './parser/marble.chevrotain.js';

addDiagrams();

/** Parses `text` the way `mermaid.parse` does: front matter split off, comments kept. */
const fromSource = (text: string) => Diagram.fromText(preprocessDiagram(text).code);

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

  it.each([
    ['a timeline error', 'marble-beta\n  a : --)\n', 'at line 6, column 9'],
    ['a parser error', 'marble-beta\n  input\n', 'at line 6'],
    ['a lexer error', 'marble-beta\n  label a "oops\n', 'at line 6, column 11'],
    ['a multi-character label symbol', 'marble-beta\n  label ab "x"\n', 'at line 6, column 9'],
    ['a duplicate label', 'marble-beta\n  label a "x"\n  label a "y"\n', 'at line 7, column 9'],
    ['a duplicate lane', 'marble-beta\n  a : --\n  a : --\n', 'at line 7'],
  ])('reports %s on its source line after front matter', async (_name, text, position) => {
    const db = new MarbleDB();
    db.setFrontmatterLineOffset(4);
    parser.parser!.yy = db;
    const error = await Promise.resolve(parser.parse(text)).then(
      () => expect.unreachable(),
      (error: unknown) => (error as Error).message
    );
    expect(error).toContain(position);
    expect(error.match(/ at line /g)).toHaveLength(1);
  });

  it('reports error lines that count comment lines', async () => {
    await expect(
      fromSource('%% leading\nmarble-beta\n  %% a comment\n  a : --\n  a : --\n')
    ).rejects.toThrow('at line 5');
  });

  it('reports error lines that count front matter and comment lines', async () => {
    await expect(
      fromSource('---\ntitle: T\n---\nmarble-beta\n  %% one\n  %% two\n  input\n')
    ).rejects.toThrow('at line 7');
    await expect(
      fromSource('---\ntitle: T\n---\nmarble-beta\n  %% one\n  label a "oops\n')
    ).rejects.toThrow('at line 6, column 11');
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
    expect(db.getAccTitle()).toBe('');
    expect(db.getAccDescription()).toBe('');
    expect(db.getLabels()).toEqual([]);
    expect(db.getTimeline().lanes).toEqual([]);
    db.build();
    expect(db.getTimeline()).toEqual({ ticks: [], lanes: [], breaks: [], columns: 0 });
  });

  it('keeps titles and accessibility text per instance', async () => {
    const first = await parse('marble-beta\n  title First\n  accTitle: A1\n  accDescr: D1\n');
    const second = await parse('marble-beta\n  title Second\n  accTitle: A2\n  accDescr: D2\n');
    expect(first.getDiagramTitle()).toBe('First');
    expect(first.getAccTitle()).toBe('A1');
    expect(first.getAccDescription()).toBe('D1');
    expect(second.getDiagramTitle()).toBe('Second');
    expect(second.getAccTitle()).toBe('A2');
    expect(second.getAccDescription()).toBe('D2');
    second.clear();
    expect(first.getDiagramTitle()).toBe('First');
    expect(second.getAccTitle()).toBe('');
  });

  it('sanitizes titles', () => {
    const db = new MarbleDB();
    db.setDiagramTitle('<script>alert(1)</script>Safe');
    expect(db.getDiagramTitle()).toBe('Safe');
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
