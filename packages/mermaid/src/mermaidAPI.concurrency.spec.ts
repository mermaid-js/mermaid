import { assert, beforeEach, describe, expect, it } from 'vitest';

import * as configApi from './config.js';
import mermaidAPI from './mermaidAPI.js';
import { FlowDB } from './diagrams/flowchart/flowDb.js';
import { PieDB } from './diagrams/pie/pieDb.js';
import { jsdomIt } from './tests/util.js';

/**
 * These tests exercise concurrent `mermaidAPI.render`/`parse` calls, which the
 * former global execution queue used to forbid. Every render must produce the
 * same SVG no matter how the calls interleave, and per-diagram state (config,
 * db contents, accessibility titles) must never leak between jobs.
 */

const PIE_TEXT = `pie title Pets adopted by volunteers
  accTitle: Pets adopted
  accDescr: How many pets were adopted
  "Dogs": 386
  "Cats": 85`;

const PIE_TEXT_2 = `pie title Favourite drinks
  accTitle: Favourite drinks
  accDescr: Drinks by popularity
  "Coffee": 60
  "Tea": 40`;

const FLOW_TEXT = `flowchart TD
  accTitle: Flow acc title
  accDescr: Flow acc description
  A[Start] --> B{Decision}
  B -->|Yes| C[Finish]`;

const SEQUENCE_TEXT = `sequenceDiagram
  accTitle: Sequence acc title
  accDescr: Sequence acc description
  Alice->>Bob: Hello Bob
  Bob-->>Alice: Hi Alice`;

const JOURNEY_TEXT = `journey
  title My working day
  accTitle: Journey acc title
  accDescr: Journey acc description
  section Go to work
    Make tea: 5: Me`;

const THEMED_PIE_TEXT = `---
config:
  theme: forest
---
pie title Forest pie
  "Sun": 30
  "Rain": 70`;

describe('mermaidAPI concurrency', () => {
  beforeEach(() => {
    mermaidAPI.globalReset();
    mermaidAPI.initialize({ startOnLoad: false });
  });

  describe('rendering', () => {
    const jobs: { id: string; text: string }[] = [
      { id: 'concurrent-pie', text: PIE_TEXT },
      { id: 'concurrent-pie-2', text: PIE_TEXT_2 },
      { id: 'concurrent-flow', text: FLOW_TEXT },
      { id: 'concurrent-sequence', text: SEQUENCE_TEXT },
      { id: 'concurrent-journey', text: JOURNEY_TEXT },
      { id: 'concurrent-themed-pie', text: THEMED_PIE_TEXT },
    ];

    /**
     * The sequence renderer numbers actor DOM elements with a global counter
     * that is intentionally never reset, so the ids stay unique when several
     * sequence diagrams share a page. Those numbers depend on how many actors
     * were drawn before (also with the old serial queue), so they are
     * canonicalized before comparing renders from different runs.
     */
    const normalizeVolatileIds = (svg: string | undefined) =>
      svg?.replace(/actor(\d+)/g, 'actor<n>').replace(/root-(\d+)/g, 'root-<n>');

    jsdomIt('produces the same SVGs concurrently as sequentially', async () => {
      const sequential = new Map<string, string>();
      for (const { id, text } of jobs) {
        const { svg } = await mermaidAPI.render(id, text);
        sequential.set(id, svg);
      }

      const concurrent = new Map<string, string>();
      await Promise.all(
        jobs.map(async ({ id, text }) => {
          const { svg } = await mermaidAPI.render(id, text);
          concurrent.set(id, svg);
        })
      );

      for (const { id } of jobs) {
        expect(normalizeVolatileIds(concurrent.get(id)), `svg of ${id}`).toBe(
          normalizeVolatileIds(sequential.get(id))
        );
      }
    });

    jsdomIt('keeps accessibility titles and descriptions per diagram', async () => {
      const results = new Map<string, string>();
      await Promise.all(
        jobs.map(async ({ id, text }) => {
          const { svg } = await mermaidAPI.render(id, text);
          results.set(id, svg);
        })
      );

      expect(results.get('concurrent-pie')).toContain('Pets adopted');
      expect(results.get('concurrent-pie')).toContain('How many pets were adopted');
      expect(results.get('concurrent-pie')).toContain('Pets adopted by volunteers');
      expect(results.get('concurrent-pie-2')).toContain('Favourite drinks');
      expect(results.get('concurrent-pie-2')).not.toContain('Pets adopted');
      expect(results.get('concurrent-flow')).toContain('Flow acc title');
      expect(results.get('concurrent-flow')).toContain('Flow acc description');
      expect(results.get('concurrent-flow')).not.toContain('Sequence acc title');
      expect(results.get('concurrent-sequence')).toContain('Sequence acc title');
      expect(results.get('concurrent-sequence')).toContain('Sequence acc description');
      expect(results.get('concurrent-journey')).toContain('Journey acc title');
    });

    jsdomIt('applies frontmatter config only to its own diagram', async () => {
      const [plain, themed] = await Promise.all([
        mermaidAPI.render('concurrent-plain-pie', PIE_TEXT),
        mermaidAPI.render('concurrent-forest-pie', THEMED_PIE_TEXT),
      ]);

      const [plainSequential, themedSequential] = [
        await mermaidAPI.render('concurrent-plain-pie', PIE_TEXT),
        await mermaidAPI.render('concurrent-forest-pie', THEMED_PIE_TEXT),
      ];

      expect(plain.svg).toBe(plainSequential.svg);
      expect(themed.svg).toBe(themedSequential.svg);
      // The forest theme must not leak into the global config.
      expect(configApi.getSiteConfig().theme).not.toBe('forest');
    });

    jsdomIt('renders an error diagram for invalid input without disturbing others', async () => {
      const results = await Promise.allSettled([
        mermaidAPI.render('concurrent-ok-pie', PIE_TEXT),
        mermaidAPI.render('concurrent-broken', 'this is not a diagram'),
        mermaidAPI.render('concurrent-ok-flow', FLOW_TEXT),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      const pieSvg = (results[0] as PromiseFulfilledResult<{ svg: string }>).value.svg;
      expect(pieSvg).toContain('Pets adopted by volunteers');
    });
  });

  describe('parsing', () => {
    it('returns each diagram its own type and config', async () => {
      const themes = ['forest', 'dark', 'neutral', 'base', 'default'];
      const parses = await Promise.all([
        ...themes.map((theme) =>
          mermaidAPI.parse(`---
config:
  theme: ${theme}
---
pie
  "a": 1`)
        ),
        mermaidAPI.parse(FLOW_TEXT),
        mermaidAPI.parse(SEQUENCE_TEXT),
        mermaidAPI.parse(JOURNEY_TEXT),
      ]);

      themes.forEach((theme, i) => {
        expect(parses[i].diagramType).toBe('pie');
        expect(parses[i].config.theme).toBe(theme);
      });
      expect(parses[themes.length].diagramType).toBe('flowchart-v2');
      expect(parses[themes.length + 1].diagramType).toBe('sequence');
      expect(parses[themes.length + 2].diagramType).toBe('journey');
    });

    it('parses concurrently with mixed valid and invalid diagrams', async () => {
      const results = await Promise.all([
        mermaidAPI.parse(PIE_TEXT, { suppressErrors: true }),
        mermaidAPI.parse('pie\n  "broken', { suppressErrors: true }),
        mermaidAPI.parse(FLOW_TEXT, { suppressErrors: true }),
        mermaidAPI.parse('flowchart TD\n  A-->', { suppressErrors: true }),
      ]);

      expect(results[0]).toMatchObject({ diagramType: 'pie' });
      expect(results[1]).toBe(false);
      expect(results[2]).toMatchObject({ diagramType: 'flowchart-v2' });
      expect(results[3]).toBe(false);
    });
  });

  describe('diagram db isolation', () => {
    it('gives concurrent diagrams of the same type their own db', async () => {
      const [flow1, flow2, pie1, pie2] = await Promise.all([
        mermaidAPI.getDiagramFromText('flowchart LR\n  A --> B'),
        mermaidAPI.getDiagramFromText('flowchart TD\n  C --> D\n  D --> E'),
        mermaidAPI.getDiagramFromText('pie title First\n  "a": 1'),
        mermaidAPI.getDiagramFromText('pie title Second\n  "b": 2\n  "c": 3'),
      ]);

      expect(flow1.db).not.toBe(flow2.db);
      assert(flow1.db instanceof FlowDB);
      assert(flow2.db instanceof FlowDB);
      expect([...flow1.db.getVertices().keys()]).toEqual(['A', 'B']);
      expect([...flow2.db.getVertices().keys()]).toEqual(['C', 'D', 'E']);

      expect(pie1.db).not.toBe(pie2.db);
      assert(pie1.db instanceof PieDB);
      assert(pie2.db instanceof PieDB);
      expect(pie1.db.getDiagramTitle()).toBe('First');
      expect(pie2.db.getDiagramTitle()).toBe('Second');
      expect([...pie1.db.getSections().keys()]).toEqual(['a']);
      expect([...pie2.db.getSections().keys()]).toEqual(['b', 'c']);
    });
  });
});
