import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parser } from './domainstorytellingParser.js';
import { DomainStorytellingDb } from './domainstorytellingDb.js';
import { log } from '../../logger.js';

const header = 'domainstorytelling-beta';

const buildInput = (...lines: string[]) => [header, ...lines].join('\n');

describe('domainstorytelling parser', () => {
  let db: DomainStorytellingDb;

  beforeEach(() => {
    db = new DomainStorytellingDb();
    parser.parser!.yy = db;
  });

  describe('common metadata', () => {
    it('stores title from diagram text', async () => {
      const input = buildInput('title Domain Storytelling Title', 'A_A : 01 -- "works on" -> W_W');

      await expect(parser.parse(input)).resolves.not.toThrow();
      expect(db.getDiagramTitle()).toBe('Domain Storytelling Title');
    });

    it('keeps pre-populated title metadata when no inline title is present', async () => {
      const input = buildInput('A_A : 01 -- "works on" -> W_W');

      db.setDiagramTitle('Frontmatter Domain Storytelling Title');

      await expect(parser.parse(input)).resolves.not.toThrow();
      expect(db.getDiagramTitle()).toBe('Frontmatter Domain Storytelling Title');
    });

    it('stores accessibility fields', async () => {
      const input = buildInput(
        'accTitle: Domain Storytelling Accessibility Title',
        'accDescr: Domain Storytelling Accessibility Description',
        'A_A : 01 -- "works on" -> W_W'
      );

      await expect(parser.parse(input)).resolves.not.toThrow();
      expect(db.getAccTitle()).toBe('Domain Storytelling Accessibility Title');
      expect(db.getAccDescription()).toBe('Domain Storytelling Accessibility Description');
    });
  });

  describe('sentences and continuations', () => {
    it('parses sentence with single workobject', async () => {
      await parser.parse(buildInput('A_A : 01 -- "works on" -> W_W'));

      expect(db.actors.map((a) => a.id)).toEqual(['A_A']);
      expect(db.workobjects.map((a) => a.id)).toEqual(['W_W-1']);
      expect(db.edges).toEqual([
        { from: 'A_A', to: 'W_W-1', label: 'works on', noOfSeq: 1, sentenceRef: '#1' },
      ]);
    });

    it('parses AdditionalWorkObject continuation in source order', async () => {
      await parser.parse(buildInput('A_A : 01 -- "uses" -> W_W -- "to produce" -> W_V'));

      expect(db.workobjects.map((a) => a.id)).toEqual(['W_W-1', 'W_V-1']);
      expect(db.edges).toEqual([
        { from: 'A_A', to: 'W_W-1', label: 'uses', noOfSeq: 1, sentenceRef: '#1' },
        {
          from: 'W_W-1',
          to: 'W_V-1',
          label: 'to produce',
          noOfSeq: undefined,
          sentenceRef: '#1',
        },
      ]);
    });

    it('parses AdditionalActor continuation as workobject->actor edge', async () => {
      await parser.parse(buildInput('A_A : 01 -- "hands over" -> W_W -- "to" -> A_B'));

      expect(db.actors.map((a) => a.id)).toEqual(['A_A', 'A_B']);
      expect(db.edges).toEqual([
        { from: 'A_A', to: 'W_W-1', label: 'hands over', noOfSeq: 1, sentenceRef: '#1' },
        { from: 'W_W-1', to: 'A_B', label: 'to', noOfSeq: undefined, sentenceRef: '#1' },
      ]);
    });

    it('parses ReverseActor continuation as actor->workobject edge', async () => {
      await parser.parse(buildInput('A_A : 01 -- "collaborates on" -> W_W <- "via" -- A_B'));

      expect(db.actors.map((a) => a.id)).toEqual(['A_A', 'A_B']);
      const reverseEdge = db.edges.find((e) => e.from === 'A_B');
      expect(reverseEdge).toEqual({
        from: 'A_B',
        to: 'W_W-1',
        label: 'via',
        noOfSeq: 1,
        sentenceRef: '#1',
      });
    });

    it('parses mixed continuations following source order', async () => {
      await parser.parse(
        buildInput('A_A : 01 -- "a" -> W_W -- "b" -> A_B <- "c" -- A_C -- "d" -> W_V')
      );

      expect(db.actors.map((a) => a.id)).toEqual(['A_A', 'A_B', 'A_C']);
      expect(db.workobjects.map((a) => a.id)).toEqual(['W_W-1', 'W_V-1']);
      // ReverseActor anchors to the latest workobject. AdditionalActor does NOT advance
      // `latestWorkobjectId`, so after `-> A_B` the reverse `<- "c" -- A_C` still targets W_W-1
      // (and inherits noOfSeq because latestWorkobjectId still equals the main workobjectId).
      // The trailing `-- "d" -> W_V` is an AdditionalWorkObject, so the source is W_W-1.
      expect(db.edges).toEqual([
        { from: 'A_A', to: 'W_W-1', label: 'a', noOfSeq: 1, sentenceRef: '#1' },
        { from: 'W_W-1', to: 'A_B', label: 'b', noOfSeq: undefined, sentenceRef: '#1' },
        { from: 'A_C', to: 'W_W-1', label: 'c', noOfSeq: 1, sentenceRef: '#1' },
        { from: 'W_W-1', to: 'W_V-1', label: 'd', noOfSeq: undefined, sentenceRef: '#1' },
      ]);
    });

    it('uses explicit sentence id when present', async () => {
      await parser.parse(buildInput('A_A : 01 -- "works on" -> W_W id S_Hello'));

      expect(db.workobjects.map((a) => a.id)).toEqual(['W_W-S_Hello']);
      expect(db.getSentenceTarget('S_Hello')).toBe('A_A');
      const edge = db.edges[0];
      expect(edge.sentenceRef).toBe('S_Hello');
    });
  });

  describe('declarations', () => {
    it('parses actor declaration with label, icon, and group', async () => {
      await parser.parse(
        buildInput(
          'group G_X "Team X"',
          'A_A "Alice" mdi:account in G_X',
          'A_A : 01 -- "works on" -> W_W'
        )
      );

      const actor = db.actors.find((a) => a.id === 'A_A');
      expect(actor).toMatchObject({
        id: 'A_A',
        label: 'Alice',
        icon: 'mdi:account',
        group: 'G_X',
      });
    });

    it('parses workobject declaration with label and icon', async () => {
      await parser.parse(
        buildInput('W_W "Spec" fa6-solid:file-lines', 'A_A : 01 -- "writes" -> W_W')
      );

      const workobject = db.workobjects.find((w) => w.id === 'W_W-1');
      expect(workobject).toMatchObject({
        id: 'W_W-1',
        label: 'Spec',
        icon: 'fa6-solid:file-lines',
      });
    });

    it('parses prefix-less icon names from the built-in pack', async () => {
      await parser.parse(
        buildInput('A_A "Alice" person', 'W_W "Spec" document', 'A_A : 01 -- "writes" -> W_W')
      );

      expect(db.actors.find((a) => a.id === 'A_A')).toMatchObject({ icon: 'person' });
      expect(db.workobjects.find((w) => w.id === 'W_W-1')).toMatchObject({ icon: 'document' });
    });

    it('applies declared label when sentence reuses the actor without label', async () => {
      await parser.parse(buildInput('A_A "Alice"', 'A_A : 01 -- "works on" -> W_W'));

      const actor = db.actors.find((a) => a.id === 'A_A');
      expect(actor?.label).toBe('Alice');
    });

    it('falls back to the id without its prefix when no label is declared', async () => {
      await parser.parse(buildInput('A_Customer : 01 -- "places" -> W_Order'));

      expect(db.actors.find((a) => a.id === 'A_Customer')?.label).toBe('Customer');
      const workobject = db.workobjects.find((w) => w.id === 'W_Order-1');
      expect(workobject?.label).toBe('Order');
    });

    it('accepts underscores inside actor, workobject, and group ids', async () => {
      await parser.parse(
        buildInput(
          'group G_Back_Office "Back Office"',
          'A_Service_Clerk in G_Back_Office',
          'A_Service_Clerk : 01 -- "files" -> W_Purchase_Order'
        )
      );

      expect(db.actors.find((a) => a.id === 'A_Service_Clerk')).toMatchObject({
        // Only the domain prefix is stripped for the fallback label.
        label: 'Service_Clerk',
        group: 'G_Back_Office',
      });
      expect(db.workobjects.find((w) => w.id === 'W_Purchase_Order-1')?.label).toBe(
        'Purchase_Order'
      );
    });
  });

  describe('groups', () => {
    it('parses group definition with title and parent', async () => {
      await parser.parse(
        buildInput(
          'group G_Parent "Parent"',
          'group G_Child "Child" in G_Parent',
          'A_A : 01 -- "x" -> W_W'
        )
      );

      const groups = db.getGroups();
      expect(groups).toContainEqual({ id: 'G_Parent', title: 'Parent', parentId: undefined });
      expect(groups).toContainEqual({ id: 'G_Child', title: 'Child', parentId: 'G_Parent' });
    });

    it('assigns workobjects defined in a group block to that group', async () => {
      await parser.parse(
        buildInput('group G_X "Team X" {', '  A_A : 01 -- "works on" -> W_W', '}')
      );

      const workobject = db.workobjects.find((w) => w.id === 'W_W-1');
      expect(workobject?.group).toBe('G_X');
    });

    it('keeps group title from the block when no separate definition exists', async () => {
      await parser.parse(
        buildInput('group G_X "Team X" {', '  A_A : 01 -- "works on" -> W_W', '}')
      );

      const groups = db.getGroups();
      expect(groups).toContainEqual({ id: 'G_X', title: 'Team X', parentId: undefined });
    });
  });

  describe('annotations', () => {
    it('parses actor annotation', async () => {
      await parser.parse(
        buildInput('A_A : 01 -- "works on" -> W_W', 'annotate actor A_A "important note"')
      );

      expect(db.getActorComment('A_A')).toBe('important note');
    });

    it('parses group annotation', async () => {
      await parser.parse(
        buildInput(
          'group G_X "Team X"',
          'A_A : 01 -- "works on" -> W_W',
          'annotate group G_X "team note"'
        )
      );

      expect(db.getGroupComment('G_X')).toBe('team note');
    });

    it('parses sentence annotation by seqNo', async () => {
      await parser.parse(
        buildInput('A_A : 01 -- "works on" -> W_W', 'annotate sentence 01 "sentence note"')
      );

      expect(db.getSentenceComment('#1')).toBe('sentence note');
    });

    it('parses sentence annotation by sentence id', async () => {
      await parser.parse(
        buildInput(
          'A_A : 01 -- "works on" -> W_W id S_Hello',
          'annotate sentence S_Hello "id note"'
        )
      );

      expect(db.getSentenceComment('S_Hello')).toBe('id note');
    });

    it('parses workobject annotation by seqNo', async () => {
      await parser.parse(
        buildInput('A_A : 01 -- "works on" -> W_W', 'annotate workobject W_W@01 "workobject note"')
      );

      expect(db.getWorkobjectComment('W_W-1')).toBe('workobject note');
    });

    it('parses workobject annotation by sentence id', async () => {
      await parser.parse(
        buildInput(
          'A_A : 01 -- "works on" -> W_W id S_Hello',
          'annotate workobject W_W@S_Hello "workobject note"'
        )
      );

      expect(db.getWorkobjectComment('W_W-S_Hello')).toBe('workobject note');
    });

    it('preserves newlines in a multiline quoted body', async () => {
      await parser.parse(
        buildInput('A_A : 01 -- "works on" -> W_W', 'annotate actor A_A "line one', 'line two"')
      );

      expect(db.getActorComment('A_A')).toBe('line one\nline two');
    });
  });

  describe('errors', () => {
    it('throws on unknown sentence id in annotation', async () => {
      const input = buildInput(
        'A_A : 01 -- "works on" -> W_W',
        'annotate sentence S_Missing "note"'
      );

      await expect(parser.parse(input)).rejects.toThrow(/Unknown sentence reference 'S_Missing'/);
    });

    it('throws on ambiguous seqNo in annotation', async () => {
      const input = buildInput(
        'A_A : 01 -- "x" -> W_W',
        'A_B : 01 -- "y" -> W_V',
        'annotate sentence 01 "note"'
      );

      await expect(parser.parse(input)).rejects.toThrow(/Ambiguous sentence sequence number/);
    });

    it('throws on unknown actor in annotation', async () => {
      const input = buildInput('A_A : 01 -- "works on" -> W_W', 'annotate actor A_Missing "note"');

      await expect(parser.parse(input)).rejects.toThrow(/Unknown actor 'A_Missing'/);
    });

    it('throws on unknown group in annotation', async () => {
      const input = buildInput('A_A : 01 -- "works on" -> W_W', 'annotate group G_Missing "note"');

      await expect(parser.parse(input)).rejects.toThrow(/Unknown group 'G_Missing'/);
    });

    it('throws on ambiguous workobject in sentence annotation', async () => {
      const input = buildInput(
        'A_A : 01 -- "first" -> W_W -- "second" -> W_W',
        'annotate workobject W_W@01 "note"'
      );

      await expect(parser.parse(input)).rejects.toThrow(/Ambiguous workobject 'W_W'/);
    });
  });

  describe('warnings', () => {
    it('warns on conflicting actor label across declarations', async () => {
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      try {
        await parser.parse(buildInput('A_A "Alice"', 'A_A "Bob"', 'A_A : 01 -- "works on" -> W_W'));
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining("Conflicting declaration label for 'A_A'")
        );
      } finally {
        spy.mockRestore();
      }
    });

    it('warns on conflicting workobject label across declarations', async () => {
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      try {
        await parser.parse(buildInput('W_W "Spec"', 'W_W "Plan"', 'A_A : 01 -- "writes" -> W_W'));
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining("Conflicting declaration label for 'W_W'")
        );
      } finally {
        spy.mockRestore();
      }
    });

    it('warns and clears group assignment when actor references unknown group', async () => {
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      try {
        await parser.parse(buildInput('A_A in G_Missing', 'A_A : 01 -- "works on" -> W_W'));
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining("Unknown group 'G_Missing' for actor 'A_A'")
        );
        expect(db.actors.find((a) => a.id === 'A_A')?.group).toBeUndefined();
      } finally {
        spy.mockRestore();
      }
    });

    it('warns on conflicting group title across declarations', async () => {
      const spy = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
      try {
        await parser.parse(
          buildInput('group G_X "First"', 'group G_X "Second"', 'A_A : 01 -- "works on" -> W_W')
        );
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining("Conflicting group title for 'G_X'")
        );
        // First title wins
        expect(db.getGroups().find((g) => g.id === 'G_X')?.title).toBe('First');
      } finally {
        spy.mockRestore();
      }
    });
  });
});

describe('domainstorytelling db', () => {
  it('clear() resets both array and id-keyed lookup state', () => {
    const db = new DomainStorytellingDb();
    db.addActor('A_A', 'Actor');
    db.addWorkobject('W_W-1', 'Workobject', 'W_W');
    expect(db.hasActor('A_A')).toBe(true);
    expect(db.hasWorkobject('W_W-1')).toBe(true);

    db.clear();

    expect(db.actors).toEqual([]);
    expect(db.workobjects).toEqual([]);
    expect(db.hasActor('A_A')).toBe(false);
    expect(db.hasWorkobject('W_W-1')).toBe(false);
  });
});
