import { beforeEach, describe, expect, it } from 'vitest';
import { parser } from './parser/orgchart.chevrotain.js';
import { db } from './orgchartDb.js';
import { layoutOrgChart } from './orgchartLayout.js';
import type { OrgChartLayout, PositionedNode } from './orgchartLayout.js';

const options = {
  nodeWidth: 100,
  nodeHeight: 40,
  siblingGap: 20,
  levelGap: 30,
  staffGap: 16,
  staffRowGap: 10,
};

const layoutOf = async (text: string): Promise<OrgChartLayout> => {
  await parser.parse(text + '\n');
  return layoutOrgChart(db.getRoot()!, options);
};
const find = (layout: OrgChartLayout, label: string): PositionedNode =>
  layout.nodes.find((n) => n.node.label === label)!;
const centre = (n: PositionedNode) => n.x + n.width / 2;
const overlaps = (a: PositionedNode, b: PositionedNode) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const example = `orgchart-beta
    CEO "Anna Andersson"
        staff CFO "Bo Berg"
        staff HR "Carina Carlson"
        Engineering "David Dahl"
            Development "Eva Ek"
            Systems "Fred Ford"
        Sales "Greta Gran"`;

describe('orgchart layout', () => {
  beforeEach(() => db.clear());

  it('puts the root on top, centred over its regular children', async () => {
    const layout = await layoutOf(example);
    const ceo = find(layout, 'CEO');
    const eng = find(layout, 'Engineering');
    const sales = find(layout, 'Sales');
    expect(ceo.y).toBe(0);
    expect(eng.y).toBeGreaterThan(ceo.y + ceo.height);
    expect(eng.y).toBe(sales.y);
    expect(centre(ceo)).toBeCloseTo((centre(eng) + centre(sales)) / 2);
    expect(find(layout, 'Development').y).toBeGreaterThan(eng.y);
  });

  it('places staff on both sides of the stem, between the manager and its children', async () => {
    const layout = await layoutOf(example);
    const ceo = find(layout, 'CEO');
    const cfo = find(layout, 'CFO');
    const hr = find(layout, 'HR');
    expect(cfo.y).toBe(hr.y);
    expect(cfo.y).toBeGreaterThan(ceo.y + ceo.height);
    expect(cfo.y + cfo.height).toBeLessThan(find(layout, 'Engineering').y);
    expect(cfo.x + cfo.width).toBeLessThan(centre(ceo));
    expect(hr.x).toBeGreaterThan(centre(ceo));
  });

  it('stacks further staff in rows, alternating sides', async () => {
    const layout = await layoutOf(`orgchart-beta
  A
    staff S1
    staff S2
    staff S3
    B`);
    const [s1, s2, s3] = ['S1', 'S2', 'S3'].map((l) => find(layout, l));
    expect(s1.x).toBeLessThan(s2.x);
    expect(s3.x).toBe(s1.x);
    expect(s3.y).toBeGreaterThan(s1.y + s1.height);
    expect(find(layout, 'B').y).toBeGreaterThan(s3.y + s3.height);
  });

  it('aligns cousins even when their managers have different numbers of staff', async () => {
    const layout = await layoutOf(`orgchart-beta
  Root
    A
      staff Advisor
      staff Finance
      staff Legal
      A1
        A2
    B
      B1
        B2`);
    expect(find(layout, 'A1').y).toBe(find(layout, 'B1').y);
    expect(find(layout, 'A2').y).toBe(find(layout, 'B2').y);
    expect(find(layout, 'A1').y).toBeGreaterThan(find(layout, 'Legal').y + options.nodeHeight);
  });

  it('never overlaps nodes, also for unbalanced branches with staff on deeper levels', async () => {
    const layout = await layoutOf(`orgchart-beta
  A
    staff S
    B
      staff T
      staff U
      B1
      B2
      B3
    C
      C1
    D`);
    for (const a of layout.nodes) {
      for (const b of layout.nodes) {
        if (a !== b) {
          expect(overlaps(a, b), `${a.node.label} vs ${b.node.label}`).toBe(false);
        }
      }
    }
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x + n.width).toBeLessThanOrEqual(layout.width);
      expect(n.y + n.height).toBeLessThanOrEqual(layout.height);
    }
  });

  it('is deterministic and independent of explicit ids', async () => {
    const a = await layoutOf(example);
    db.clear();
    const b = await layoutOf(example);
    const pos = (l: OrgChartLayout) => l.nodes.map((n) => [n.node.label, n.x, n.y]);
    expect(pos(a)).toEqual(pos(b));
  });

  it('handles deep reporting chains without imposing a diagram depth limit', async () => {
    const source = [
      'orgchart-beta',
      ...Array.from({ length: 40 }, (_, depth) => `${'  '.repeat(depth)}Level${depth}`),
    ].join('\n');
    const layout = await layoutOf(source);
    expect(layout.nodes).toHaveLength(40);
    for (const [depth, node] of layout.nodes.entries()) {
      expect(node.y).toBe(depth * (options.nodeHeight + options.levelGap));
      expect(centre(node)).toBe(options.nodeWidth / 2);
    }
  });

  it('keeps many reports in source order on a shared level', async () => {
    const source = [
      'orgchart-beta',
      'Root',
      ...Array.from({ length: 12 }, (_, index) => `  Report${index}`),
    ].join('\n');
    const layout = await layoutOf(source);
    const reports = layout.nodes.slice(1);
    expect(reports).toHaveLength(12);
    for (const [index, report] of reports.entries()) {
      expect(report.node.label).toBe(`Report${index}`);
      expect(report.y).toBe(options.nodeHeight + options.levelGap);
      if (index > 0) {
        expect(report.x - (reports[index - 1].x + options.nodeWidth)).toBe(options.siblingGap);
      }
    }
  });

  it('lays out a lone root and a root with staff only', async () => {
    const lone = await layoutOf('orgchart-beta\n  A');
    expect(lone.nodes).toHaveLength(1);
    expect(lone.connectors).toHaveLength(0);
    expect(lone.width).toBe(options.nodeWidth);
    const staffOnly = await layoutOf('orgchart-beta\n  A\n    staff S');
    expect(staffOnly.connectors.map((c) => c.kind).sort()).toEqual(['reporting', 'staff']);
  });

  it('uses only orthogonal segments', async () => {
    const layout = await layoutOf(example);
    for (const c of layout.connectors) {
      for (const [x1, y1, x2, y2] of c.segments) {
        expect(x1 === x2 || y1 === y2).toBe(true);
      }
    }
  });

  it.each([
    { width: 100, height: 40 },
    { width: 420, height: 90 },
    { width: 800, height: 160 },
  ])('keeps nodes and connectors clear for $width x $height boxes', async ({ width, height }) => {
    await parser.parse(`orgchart-beta
  Root
    staff Finance
    staff HR
    staff Legal
    A
      staff Support
      A1
        A2
    B
      B1
      B2
      B3
    C
      staff Advisor
      staff Quality
      staff Operations
    D
`);
    const layout = layoutOrgChart(db.getRoot()!, {
      ...options,
      nodeWidth: width,
      nodeHeight: height,
    });
    for (const [index, node] of layout.nodes.entries()) {
      for (const other of layout.nodes.slice(index + 1)) {
        expect(overlaps(node, other), `${node.node.label} vs ${other.node.label}`).toBe(false);
      }
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(layout.width);
      expect(node.y + node.height).toBeLessThanOrEqual(layout.height);
      for (const connector of layout.connectors) {
        for (const [x1, y1, x2, y2] of connector.segments) {
          const crossesInterior =
            x1 === x2
              ? x1 > node.x &&
                x1 < node.x + node.width &&
                Math.max(y1, y2) > node.y &&
                Math.min(y1, y2) < node.y + node.height
              : y1 > node.y &&
                y1 < node.y + node.height &&
                Math.max(x1, x2) > node.x &&
                Math.min(x1, x2) < node.x + node.width;
          expect(crossesInterior, `connector through ${node.node.label}`).toBe(false);
        }
      }
    }
  });
});
