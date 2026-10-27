import { select } from 'd3';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import type { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import { renderer } from './orgchartRenderer.js';
import { createOrgChartDb } from './orgchartDb.js';

addDiagrams();

const example = `orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        staff HR "Carina Carlson"
        Engineering "David Dahl"
            Development "Eva Ek"
            Systems "Fred Ford"
        Sales "Greta Gran"`;

describe('orgchart rendering through mermaidAPI', () => {
  beforeEach(() => mermaidAPI.initialize({}));
  afterEach(() => vi.restoreAllMocks());

  jsdomIt('renders nodes, staff nodes and connectors', async () => {
    const { svg } = await mermaidAPI.render('orgchart-test', example);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const nodes = [...doc.querySelectorAll('g.orgchart-node')];
    expect(nodes).toHaveLength(7);
    const staff = doc.querySelectorAll('g.orgchart-node-staff');
    expect([...staff].map((n) => n.querySelector('.orgchart-label')?.textContent)).toEqual([
      'CFO',
      'HR',
    ]);
    expect(doc.querySelectorAll('g.orgchart-node-regular')).toHaveLength(5);
    expect(doc.querySelectorAll('path.orgchart-connector-staff')).toHaveLength(2);
    expect(doc.querySelectorAll('path.orgchart-connector-reporting').length).toBeGreaterThan(0);
    expect(doc.querySelector('svg')?.getAttribute('aria-roledescription')).toBe('orgchart');
    expect(svg).toContain('Anna Andersson');
  });

  jsdomIt('renders visible and accessible titles', async () => {
    const source = `orgchart-beta
title Company structure
accTitle: Organization chart
accDescr: Reporting relationships and staff functions
  CEO`;
    const { svg } = await mermaidAPI.render('orgchart-titles', source);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('title')?.textContent).toBe('Organization chart');
    expect(doc.querySelector('desc')?.textContent).toBe(
      'Reporting relationships and staff functions'
    );
    expect(doc.querySelectorAll('title')).toHaveLength(1);
    expect(doc.querySelectorAll('desc')).toHaveLength(1);
    expect(doc.querySelector('svg')?.getAttribute('aria-labelledby')).toBe(
      'chart-title-orgchart-titles'
    );
    expect(doc.querySelector('svg')?.getAttribute('aria-describedby')).toBe(
      'chart-desc-orgchart-titles'
    );
    expect(doc.querySelector('.orgchart-title')?.textContent).toBe('Company structure');
  });

  jsdomIt('renders sanitized labels and titles as plain SVG text', async () => {
    const source = `orgchart-beta
title Company &amp; partners
  "<b>Anna</b> &amp; team"
    staff CFO "<i>Bo</i>"`;
    const { svg } = await mermaidAPI.render('orgchart-plain-text', source);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');

    expect(doc.querySelector('.orgchart-title')?.textContent).toBe('Company & partners');
    expect(doc.querySelector('.orgchart-label')?.textContent).toBe('<b>Anna</b> & team');
    expect(doc.querySelector('.orgchart-secondary-label')?.textContent).toBe('<i>Bo</i>');
  });

  jsdomIt('rejects rendering when the chart has no root node', () => {
    const id = 'orgchart-no-root';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = id;
    document.body.appendChild(svg);
    const diagram = { db: createOrgChartDb() } as unknown as Diagram;

    expect(() => renderer.draw('', id, '', diagram)).toThrow(
      'Cannot render an orgchart without a root node'
    );
  });

  jsdomIt('reports when an SVG label cannot be measured', () => {
    const id = 'orgchart-unmeasurable';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = id;
    document.body.appendChild(svg);
    const db = createOrgChartDb();
    db.addNode({ indent: 0, line: 1, column: 1, kind: 'regular', label: 'CEO' });
    const diagram = { db } as unknown as Diagram;
    const selectionPrototype = Object.getPrototypeOf(select(svg)) as {
      node: (this: unknown) => SVGElement | null;
    };
    const originalNode = selectionPrototype.node;
    vi.spyOn(selectionPrototype, 'node').mockImplementation(function (this: unknown) {
      const node = originalNode.call(this);
      return node?.nodeName.toLowerCase() === 'text' ? null : node;
    });

    expect(() => renderer.draw('', id, '', diagram)).toThrow('Could not measure orgchart label');
  });

  jsdomIt('preserves frontmatter titles through parsing', async () => {
    const source = `---
title: Organization overview
---
orgchart-beta
  CEO`;
    const { svg } = await mermaidAPI.render('orgchart-frontmatter-title', source);
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('.orgchart-title')?.textContent).toBe('Organization overview');
  });

  jsdomIt('maps validation errors to source lines before frontmatter is removed', async () => {
    const source = `---
title: Invalid organization
---
orgchart-beta
CEO
CFO`;
    await expect(mermaidAPI.render('orgchart-frontmatter-error', source)).rejects.toThrow(
      /line 6, column 1.*exactly one root/
    );
  });

  jsdomIt('keeps concurrent diagram parses isolated', async () => {
    const [first, second] = await Promise.all([
      mermaidAPI.render('orgchart-concurrent-first', example),
      mermaidAPI.render('orgchart-concurrent-second', `orgchart-beta\n  COO\n    Operations`),
    ]);
    const firstDoc = new DOMParser().parseFromString(first.svg, 'image/svg+xml');
    const secondDoc = new DOMParser().parseFromString(second.svg, 'image/svg+xml');

    expect(firstDoc.querySelectorAll('g.orgchart-node')).toHaveLength(7);
    expect(secondDoc.querySelectorAll('g.orgchart-node')).toHaveLength(2);
    expect(firstDoc.querySelector('.orgchart-label')?.textContent).toBe('CEO');
    expect(secondDoc.querySelector('.orgchart-label')?.textContent).toBe('COO');
  });

  jsdomIt('rejects an invalid chart with an error', async () => {
    await expect(mermaidAPI.render('orgchart-bad', 'orgchart-beta\n  A\n  B')).rejects.toThrow(
      /exactly one root/
    );
  });

  jsdomIt(
    'renders hand-drawn boxes and both connector kinds without changing the hierarchy',
    async () => {
      mermaidAPI.initialize({ look: 'handDrawn', handDrawnSeed: 42 });
      const { svg } = await mermaidAPI.render('orgchart-hand-drawn', example);
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      expect(doc.querySelectorAll('g.orgchart-node-regular')).toHaveLength(5);
      expect(doc.querySelectorAll('g.orgchart-node-staff')).toHaveLength(2);
      expect(doc.querySelectorAll('.orgchart-node rect')).toHaveLength(0);
      expect(doc.querySelectorAll('.orgchart-node-shape')).toHaveLength(7);
      expect(doc.querySelectorAll('.orgchart-node-fill')).toHaveLength(7);
      expect(doc.querySelectorAll('.orgchart-node-outline')).toHaveLength(7);
      expect(doc.querySelectorAll('.orgchart-connector-staff path')).toHaveLength(2);
      expect(doc.querySelectorAll('.orgchart-connector-reporting path')).toHaveLength(2);
      expect(doc.querySelector('.orgchart-label')?.textContent).toBe('CEO');
      expect(svg).toContain('Anna Andersson');
      for (const path of doc.querySelectorAll('.orgchart-node-outline, .orgchart-connector path')) {
        expect(path.getAttribute('d')).toContain('C');
      }
    }
  );

  jsdomIt('uses the configured seed for repeatable hand-drawn paths', async () => {
    const geometry = async (id: string, seed: number) => {
      mermaidAPI.initialize({ look: 'handDrawn', handDrawnSeed: seed });
      const { svg } = await mermaidAPI.render(id, example);
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      return [...doc.querySelectorAll('.orgchart-node-shape path, .orgchart-connector path')].map(
        (path) => path.getAttribute('d')
      );
    };
    const first = await geometry('orgchart-seed-first', 42);
    expect(await geometry('orgchart-seed-repeat', 42)).toEqual(first);
    expect(await geometry('orgchart-seed-different', 43)).not.toEqual(first);
  });
});
