import type { OrgNode } from './orgchartTypes.js';

export interface OrgChartLayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  /** Horizontal space between sibling subtrees. */
  siblingGap: number;
  /** Vertical space between a manager (or its staff) and the reporting level below. */
  levelGap: number;
  /** Horizontal space between the stem and a staff node. */
  staffGap: number;
  /** Vertical space between stacked staff rows. */
  staffRowGap: number;
}

export interface PositionedNode {
  node: OrgNode;
  /** Top-left corner. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Connector {
  kind: 'reporting' | 'staff';
  /** Orthogonal polyline segments, each as [x1, y1, x2, y2]. */
  segments: [number, number, number, number][];
}

export interface OrgChartLayout {
  nodes: PositionedNode[];
  connectors: Connector[];
  width: number;
  height: number;
}

/** A laid-out subtree. Coordinates are relative to the subtree root's centre (x) and top (y). */
interface SubtreeLayout {
  nodes: PositionedNode[];
  connectors: Connector[];
  extentLeft: number;
  extentRight: number;
  height: number;
}

const translate = (layout: SubtreeLayout, dx: number, dy: number): void => {
  for (const n of layout.nodes) {
    n.x += dx;
    n.y += dy;
  }
  for (const c of layout.connectors) {
    for (const s of c.segments) {
      s[0] += dx;
      s[1] += dy;
      s[2] += dx;
      s[3] += dy;
    }
  }
};

const layoutSubtree = (
  node: OrgNode,
  o: OrgChartLayoutOptions,
  levelTops: number[],
  depth: number
): SubtreeLayout => {
  const { nodeWidth: w, nodeHeight: h } = o;
  const nodes: PositionedNode[] = [{ node, x: -w / 2, y: 0, width: w, height: h }];
  const connectors: Connector[] = [];
  let extentLeft = w / 2;
  let extentRight = w / 2;

  // Staff alternate left/right of the stem, two per row, in source order.
  let bottom = h;
  let lastStaffCentre: number | undefined;
  node.staff.forEach((staff, i) => {
    const isLeft = i % 2 === 0;
    const y = h + o.levelGap + Math.floor(i / 2) * (h + o.staffRowGap);
    const x = isLeft ? -o.staffGap - w : o.staffGap;
    nodes.push({ node: staff, x, y, width: w, height: h });
    const innerEdge = isLeft ? -o.staffGap : o.staffGap;
    connectors.push({
      kind: 'staff',
      segments: [[0, y + h / 2, innerEdge, y + h / 2]],
    });
    bottom = y + h;
    lastStaffCentre = y + h / 2;
    if (isLeft) {
      extentLeft = Math.max(extentLeft, o.staffGap + w);
    } else {
      extentRight = Math.max(extentRight, o.staffGap + w);
    }
  });

  if (node.children.length === 0) {
    if (lastStaffCentre !== undefined) {
      connectors.push({ kind: 'reporting', segments: [[0, h, 0, lastStaffCentre]] });
    }
    return { nodes, connectors, extentLeft, extentRight, height: bottom };
  }

  const childTop = levelTops[depth + 1] - levelTops[depth];
  const busY = childTop - o.levelGap / 2;
  const subtrees = node.children.map((child) => layoutSubtree(child, o, levelTops, depth + 1));

  const centres: number[] = [];
  let cursor = 0;
  for (const sub of subtrees) {
    const centre = cursor + sub.extentLeft;
    centres.push(centre);
    cursor = centre + sub.extentRight + o.siblingGap;
  }
  const parentCentre = (centres[0] + centres[centres.length - 1]) / 2;

  const segments: Connector['segments'] = [[0, h, 0, busY]];
  if (centres.length > 1) {
    segments.push([
      centres[0] - parentCentre,
      busY,
      centres[centres.length - 1] - parentCentre,
      busY,
    ]);
  }
  let childrenHeight = 0;
  subtrees.forEach((sub, i) => {
    const dx = centres[i] - parentCentre;
    translate(sub, dx, childTop);
    nodes.push(...sub.nodes);
    connectors.push(...sub.connectors);
    segments.push([dx, busY, dx, childTop]);
    extentLeft = Math.max(extentLeft, -dx + sub.extentLeft);
    extentRight = Math.max(extentRight, dx + sub.extentRight);
    childrenHeight = Math.max(childrenHeight, sub.height);
  });
  connectors.push({ kind: 'reporting', segments });

  return { nodes, connectors, extentLeft, extentRight, height: childTop + childrenHeight };
};

/**
 * Deterministic top-down layout. Regular children are centred under their manager on a shared
 * bus; staff nodes hang beside the manager's vertical stem. Only the source order matters.
 */
export const layoutOrgChart = (root: OrgNode, options: OrgChartLayoutOptions): OrgChartLayout => {
  // Reserve the largest staff band at each depth so cousins stay on the same reporting level.
  const staffRows: number[] = [];
  const pending = [{ node: root, depth: 0 }];
  while (pending.length) {
    const { node, depth } = pending.pop()!;
    staffRows[depth] = Math.max(staffRows[depth] ?? 0, Math.ceil(node.staff.length / 2));
    for (const child of node.children) {
      pending.push({ node: child, depth: depth + 1 });
    }
  }
  const levelTops = [0];
  for (const rows of staffRows) {
    const staffHeight = rows
      ? options.levelGap + rows * options.nodeHeight + (rows - 1) * options.staffRowGap
      : 0;
    levelTops.push(
      levelTops[levelTops.length - 1] + options.nodeHeight + staffHeight + options.levelGap
    );
  }
  const layout = layoutSubtree(root, options, levelTops, 0);
  translate(layout, layout.extentLeft, 0);
  return {
    nodes: layout.nodes,
    connectors: layout.connectors,
    width: layout.extentLeft + layout.extentRight,
    height: layout.height,
  };
};
