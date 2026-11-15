import { describe, it, expect } from 'vitest';
import { followMovedEndpoints, runElkLayoutCore, slideTerminalLabelsOffFrames } from '../render.js';
import { terminalLabelTranslate } from '../../common/index.js';
import type { TerminalLabelKey, TerminalLabelSize } from '../../../types.js';

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const elkRenderContext = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

// Sizes as `insertEdgeLabel` measures them; every terminal label is centred on its group's origin.
const label = (width: number): TerminalLabelSize => ({ width, height: 16.5 });

// A class box is a rectangle; `intersect` stands in for the one the DOM shape provides.
const classNode = (id: string, width: number, height: number) => {
  const node: any = { id, isGroup: false, width, height, label: id, shape: 'classBox' };
  node.intersect = (point: { x: number; y: number }) => {
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    const scale = Math.min(
      dx ? width / 2 / Math.abs(dx) : Infinity,
      dy ? height / 2 / Math.abs(dy) : Infinity
    );
    return { x: node.x + dx * Math.min(scale, 1), y: node.y + dy * Math.min(scale, 1) };
  };
  return node;
};

const relation = (
  id: string,
  start: string,
  end: string,
  arrowTypeStart: string,
  startText: string,
  endText: string
) => ({
  id,
  start,
  end,
  arrowTypeStart,
  arrowTypeEnd: 'none',
  label: '',
  startLabelRight: startText,
  endLabelLeft: endText,
  terminalLabelSizes: {
    startRight: label(startText.length * 6.1),
    endLeft: label(endText.length * 6.7),
  },
});

const distanceToBox = (
  p: { x: number; y: number },
  b: { x1: number; y1: number; x2: number; y2: number }
) => Math.hypot(Math.max(b.x1 - p.x, 0, p.x - b.x2), Math.max(b.y1 - p.y, 0, p.y - b.y2));

// Relation markers are 18px long and 12px across (see `markers.js`).
const markerBox = (points: { x: number; y: number }[], atStart: boolean) => {
  const [tip, next] = atStart ? [points[0], points[1]] : [points.at(-1)!, points.at(-2)!];
  const length = Math.hypot(next.x - tip.x, next.y - tip.y);
  const base = {
    x: tip.x + ((next.x - tip.x) / length) * 18,
    y: tip.y + ((next.y - tip.y) / length) * 18,
  };
  return {
    x1: Math.min(tip.x, base.x) - 6,
    y1: Math.min(tip.y, base.y) - 6,
    x2: Math.max(tip.x, base.x) + 6,
    y2: Math.max(tip.y, base.y) + 6,
  };
};

const boxGap = (
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number }
) => Math.hypot(Math.max(a.x1 - b.x2, 0, b.x1 - a.x2), Math.max(a.y1 - b.y2, 0, b.y1 - a.y2));

// Which side of the direction of travel a point lies on, at the edge's start or end (screen
// coordinates, y down). Dagre puts `…Right` labels on the right and `…Left` on the left.
const sideOfTravel = (
  points: { x: number; y: number }[],
  atStart: boolean,
  p: { x: number; y: number }
) => {
  const [a, b] = atStart ? [points[0], points[1]] : [points.at(-2)!, points.at(-1)!];
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  return cross > 0 ? 'right' : 'left';
};

// Whether segment a-b passes through the box (Liang–Barsky clip).
const segmentHitsBox = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  box: { x1: number; y1: number; x2: number; y2: number }
) => {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - box.x1],
    [dx, box.x2 - a.x],
    [-dy, a.y - box.y1],
    [dy, box.y2 - a.y],
  ]) {
    if (p === 0) {
      if (q < 0) {
        return false;
      }
    } else {
      const t = q / p;
      if (p < 0) {
        t0 = Math.max(t0, t);
      } else {
        t1 = Math.min(t1, t);
      }
    }
  }
  return t0 < t1;
};

const overlaps = (
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number }
) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

describe('ELK terminal (cardinality) labels', () => {
  // #8329: `Animal "1" <|-- "many" Duck` in an LR class diagram.
  it('keeps every cardinality label beside its own end, clear of its marker and the class boxes', async () => {
    const data = animalDiagram();
    await runElkLayoutCore(data, elkRenderContext);
    assertLabelsPlaced(data);
  });

  // Sizes measured in the browser (arial). Customer's two ports are ~22px apart, so the
  // dagre side for "0..1" is taken by the neighbouring edge; it must stay on the free side.
  it('keeps a label off a neighbouring edge that leaves an adjacent port', async () => {
    const data = adjacentPortsDiagram();
    await runElkLayoutCore(data, elkRenderContext);
    assertLabelsPlaced(data, { dagreSides: false });
  });

  // #8329: the issue's top-down example; start and end labels go on opposite sides, as in dagre.
  it('puts start and end labels on the same sides of a top-down edge as dagre', async () => {
    const data = customerDiagram();
    await runElkLayoutCore(data, elkRenderContext);
    assertLabelsPlaced(data);
  });

  // Only layered places end labels; the others leave them at the origin.
  it.each(['elk.mrtree', 'elk.force'])(
    'leaves the labels on the path default with %s',
    async (algorithm) => {
      const data = animalDiagram();
      await runElkLayoutCore(data, { ...elkRenderContext, options: { algorithm } });
      for (const edge of data.edges) {
        expect(edge.terminalLabelCenters).toBeUndefined();
      }
    }
  );

  it('drops centres from an earlier layered run when the same data is laid out again', async () => {
    const data = animalDiagram();
    await runElkLayoutCore(data, elkRenderContext);
    await runElkLayoutCore(data, { ...elkRenderContext, options: { algorithm: 'elk.mrtree' } });
    for (const edge of data.edges) {
      expect(edge.terminalLabelCenters).toBeUndefined();
    }
  });

  // #8335: an LR edge into another namespace; ELK put the HEAD label across that frame's border.
  it('keeps a label that enters another namespace clear of its frame', async () => {
    const data = crossNamespaceDiagram();
    await runElkLayoutCore(data, elkRenderContext);
    assertLabelsPlaced(data);
    const frames = data.nodes
      .filter((node: any) => node.isGroup)
      .map((node: any) => ({
        id: node.id,
        x1: node.x - node.width / 2,
        y1: node.y - node.height / 2,
        x2: node.x + node.width / 2,
        y2: node.y + node.height / 2,
      }));
    const problems: string[] = [];
    for (const edge of data.edges) {
      for (const [key, size] of Object.entries(edge.terminalLabelSizes) as [
        TerminalLabelKey,
        TerminalLabelSize,
      ][]) {
        const { x, y } = terminalLabelTranslate(edge, key, edge.points);
        const box = {
          x1: x! - size.width / 2,
          y1: y! - size.height / 2,
          x2: x! + size.width / 2,
          y2: y! + size.height / 2,
        };
        // The renderer keeps a slid label 2px off every frame border.
        const padded = { x1: box.x1 - 2, y1: box.y1 - 2, x2: box.x2 + 2, y2: box.y2 + 2 };
        for (const frame of frames) {
          const inside =
            padded.x1 >= frame.x1 &&
            padded.x2 <= frame.x2 &&
            padded.y1 >= frame.y1 &&
            padded.y2 <= frame.y2;
          if (overlaps(padded, frame) && !inside) {
            problems.push(`${edge.id} ${key} is within 2px of the ${frame.id} frame`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  // Clearing the frame outwards would need the label past the bend, off its end segment.
  it('does not slide a label past the far end of its end segment', () => {
    const edge = {
      id: 'e',
      label: '',
      points: [
        { x: 80, y: -40 },
        { x: 80, y: 0 },
        { x: 100, y: 0 },
      ],
      terminalLabelSizes: { endLeft: { width: 16, height: 16 } },
      terminalLabelCenters: { endLeft: { x: 92, y: 12 } },
    } as any;
    const nodes = [
      { id: 'G', isGroup: true, x: 145, y: 0, width: 110, height: 200 },
      { id: 'N', isGroup: false, x: 130, y: 0, width: 60, height: 40 },
    ] as any;
    slideTerminalLabelsOffFrames([edge], nodes);
    expect(edge.terminalLabelCenters.endLeft).toEqual({ x: 92, y: 12 });
  });

  it('moves a placed label with an endpoint that a later pass slid along the side', () => {
    const edge = {
      id: 'e',
      points: [
        { x: 100, y: 58 },
        { x: 140, y: 58 },
        { x: 140, y: 20 },
      ],
      terminalLabelCenters: { startRight: { x: 105, y: 70 }, endLeft: { x: 150, y: 30 } },
    } as any;
    followMovedEndpoints(edge, { start: { x: 100, y: 50 }, end: { x: 140, y: 20 } });
    expect(edge.terminalLabelCenters).toEqual({
      startRight: { x: 105, y: 78 },
      endLeft: { x: 150, y: 30 },
    });
  });
});

function animalDiagram() {
  return {
    type: 'classDiagram',
    direction: 'LR',
    config: { elk: {} },
    nodes: [
      classNode('Animal', 131, 135),
      classNode('Duck', 58.2, 81),
      classNode('Fish', 52.8, 81),
      classNode('Feather', 74.6, 81),
    ],
    edges: [
      relation('id_Animal_Duck_1', 'Animal', 'Duck', 'extension', '1', 'many'),
      relation('id_Animal_Fish_2', 'Animal', 'Fish', 'extension', '1', '0..n'),
      relation('id_Duck_Feather_3', 'Duck', 'Feather', 'aggregation', '1', '2..*'),
    ],
  } as any;
}

function customerDiagram() {
  return {
    type: 'classDiagram',
    direction: 'TB',
    config: { elk: {} },
    nodes: [
      classNode('Customer', 90, 81),
      classNode('Order', 62, 81),
      classNode('LineItem', 82, 81),
      classNode('Product', 77, 81),
      classNode('Address', 80, 81),
    ],
    edges: [
      { ...relation('places', 'Customer', 'Order', 'none', '1', '*'), arrowTypeEnd: 'dependency' },
      relation('contains', 'Order', 'LineItem', 'composition', '1', '1..*'),
      {
        ...relation('refersTo', 'LineItem', 'Product', 'none', '*', '1'),
        arrowTypeEnd: 'dependency',
      },
      relation('livesAt', 'Customer', 'Address', 'none', '1', '0..1'),
    ],
  } as any;
}

function adjacentPortsDiagram() {
  const sized = (edge: any, start: number, end: number) => ({
    ...edge,
    terminalLabelSizes: { startRight: label(start), endLeft: label(end) },
  });
  return {
    type: 'classDiagram',
    direction: 'TB',
    // The schema defaults, so ELK orders the ports as it does in the browser.
    config: {
      elk: {
        mergeEdges: false,
        preset: 'default',
        straightenEdges: true,
        forceNodeModelOrder: false,
        considerModelOrder: 'NODES_AND_EDGES',
      },
    },
    nodes: [
      classNode('Customer', 89.36, 81),
      classNode('Order', 62.13, 81),
      classNode('LineItem', 81.58, 81),
      classNode('Address', 80.03, 81),
    ],
    edges: [
      sized(
        {
          ...relation('places', 'Customer', 'Order', 'none', '1', '*'),
          arrowTypeEnd: 'dependency',
        },
        6.13,
        4.28
      ),
      sized(relation('contains', 'Order', 'LineItem', 'composition', '1', '1..*'), 6.13, 16.52),
      sized(relation('livesAt', 'Customer', 'Address', 'none', '0..1', '1'), 18.36, 6.13),
    ],
  } as any;
}

// Sizes measured in the browser (arial), as `Order "*" --> "1..*" Product` across namespaces.
function crossNamespaceDiagram() {
  const group = (id: string) => ({ id, isGroup: true, label: id, shape: 'rect', padding: 16 });
  return {
    type: 'classDiagram',
    direction: 'LR',
    config: { elk: {} },
    nodes: [
      group('Shop'),
      group('Catalog'),
      // `intersect` reads the node it was built for, so set the parent on that object.
      Object.assign(classNode('Order', 62.13, 81), { parentId: 'Shop' }),
      Object.assign(classNode('Product', 76.94, 81), { parentId: 'Catalog' }),
    ],
    edges: [
      {
        ...relation('contains', 'Order', 'Product', 'none', '*', '1..*'),
        arrowTypeEnd: 'dependency',
        terminalLabelSizes: { startRight: label(4.28), endLeft: label(16.52) },
      },
    ],
  } as any;
}

function assertLabelsPlaced(data: any, { dagreSides = true } = {}) {
  // A group is hollow; the frame test covers its border.
  const nodeBoxes = data.nodes
    .filter((node: any) => !node.isGroup)
    .map((node: any) => ({
      id: node.id,
      x1: node.x - node.width / 2,
      y1: node.y - node.height / 2,
      x2: node.x + node.width / 2,
      y2: node.y + node.height / 2,
    }));

  const problems: string[] = [];
  for (const edge of data.edges) {
    for (const key of ['startRight', 'endLeft'] as TerminalLabelKey[]) {
      const size = edge.terminalLabelSizes[key];
      const { x, y } = terminalLabelTranslate(edge, key, edge.points);
      const cx = x!;
      const cy = y!;
      const labelBox = {
        x1: cx - size.width / 2,
        y1: cy - size.height / 2,
        x2: cx + size.width / 2,
        y2: cy + size.height / 2,
      };
      const end = key.startsWith('start') ? edge.points[0] : edge.points.at(-1);
      const marker = key.startsWith('start') ? edge.arrowTypeStart : edge.arrowTypeEnd;
      const nearest = marker === 'none' ? end : markerBox(edge.points, key.startsWith('start'));
      const gap = 'x1' in nearest ? boxGap(nearest, labelBox) : distanceToBox(nearest, labelBox);
      if (gap > 12) {
        problems.push(`${edge.id} ${key} is ${Math.round(gap)}px from its end`);
      }
      if (
        marker !== 'none' &&
        overlaps(labelBox, markerBox(edge.points, key.startsWith('start')))
      ) {
        problems.push(`${edge.id} ${key} touches its marker`);
      }
      const wantSide = key.endsWith('Right') ? 'right' : 'left';
      const side = sideOfTravel(edge.points, key.startsWith('start'), { x: cx, y: cy });
      if (dagreSides && side !== wantSide) {
        problems.push(
          `${edge.id} ${key} is on the ${side} of its edge, dagre puts it on the ${wantSide}`
        );
      }
      for (const other of data.edges) {
        if (other === edge) {
          continue;
        }
        for (let i = 0; i < other.points.length - 1; i++) {
          if (segmentHitsBox(other.points[i], other.points[i + 1], labelBox)) {
            problems.push(`${edge.id} ${key} is crossed by edge ${other.id}`);
            break;
          }
        }
      }
      for (const box of nodeBoxes) {
        if (overlaps(labelBox, box)) {
          problems.push(`${edge.id} ${key} under ${box.id}`);
        }
      }
    }
  }

  expect(problems).toEqual([]);
}
