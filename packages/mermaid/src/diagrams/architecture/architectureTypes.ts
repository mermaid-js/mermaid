import type { DiagramDB } from '../../diagram-api/types.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import type { D3Element } from '../../types.js';
import type cytoscape from 'cytoscape';

/*=======================================*\
|       Architecture Diagram Types        |
\*=======================================*/

export type ArchitectureAlignment = 'vertical' | 'horizontal' | 'bend';

export type ArchitectureDirection = 'L' | 'R' | 'T' | 'B';
export type ArchitectureDirectionX = Extract<ArchitectureDirection, 'L' | 'R'>;
export type ArchitectureDirectionY = Extract<ArchitectureDirection, 'T' | 'B'>;

/**
 * Contains LL, RR, TT, BB which are impossible connections
 */
export type InvalidArchitectureDirectionPair = `${ArchitectureDirection}${ArchitectureDirection}`;
export type ArchitectureDirectionPair = Exclude<
  InvalidArchitectureDirectionPair,
  'LL' | 'RR' | 'TT' | 'BB'
>;
export type ArchitectureDirectionPairXY = Exclude<
  InvalidArchitectureDirectionPair,
  'LL' | 'RR' | 'TT' | 'BB' | 'LR' | 'RL' | 'TB' | 'BT'
>;

export const ArchitectureDirectionName = {
  L: 'left',
  R: 'right',
  T: 'top',
  B: 'bottom',
} as const;

export const ArchitectureDirectionArrow = {
  L: (scale: number) => `${scale},${scale / 2} 0,${scale} 0,0`,
  R: (scale: number) => `0,${scale / 2} ${scale},0 ${scale},${scale}`,
  T: (scale: number) => `0,0 ${scale},0 ${scale / 2},${scale}`,
  B: (scale: number) => `${scale / 2},0 ${scale},${scale} 0,${scale}`,
} as const;

export const ArchitectureDirectionArrowShift = {
  L: (orig: number, arrowSize: number) => orig - arrowSize + 2,
  R: (orig: number, _arrowSize: number) => orig - 2,
  T: (orig: number, arrowSize: number) => orig - arrowSize + 2,
  B: (orig: number, _arrowSize: number) => orig - 2,
} as const;

export const getOppositeArchitectureDirection = function (
  x: ArchitectureDirection
): ArchitectureDirection {
  if (isArchitectureDirectionX(x)) {
    return x === 'L' ? 'R' : 'L';
  } else {
    return x === 'T' ? 'B' : 'T';
  }
};

export const isArchitectureDirection = function (x: unknown): x is ArchitectureDirection {
  const temp = x as ArchitectureDirection;
  return temp === 'L' || temp === 'R' || temp === 'T' || temp === 'B';
};

export const isArchitectureDirectionX = function (
  x: ArchitectureDirection
): x is ArchitectureDirectionX {
  const temp = x as ArchitectureDirectionX;
  return temp === 'L' || temp === 'R';
};

export const isArchitectureDirectionY = function (
  x: ArchitectureDirection
): x is ArchitectureDirectionY {
  const temp = x as ArchitectureDirectionY;
  return temp === 'T' || temp === 'B';
};

export const isArchitectureDirectionXY = function (
  a: ArchitectureDirection,
  b: ArchitectureDirection
) {
  const aX_bY = isArchitectureDirectionX(a) && isArchitectureDirectionY(b);
  const aY_bX = isArchitectureDirectionY(a) && isArchitectureDirectionX(b);
  return aX_bY || aY_bX;
};

export const isArchitecturePairXY = function (
  pair: ArchitectureDirectionPair
): pair is ArchitectureDirectionPairXY {
  const lhs = pair[0] as ArchitectureDirection;
  const rhs = pair[1] as ArchitectureDirection;
  const aX_bY = isArchitectureDirectionX(lhs) && isArchitectureDirectionY(rhs);
  const aY_bX = isArchitectureDirectionY(lhs) && isArchitectureDirectionX(rhs);
  return aX_bY || aY_bX;
};

/**
 * Verifies that the architecture direction pair does not contain an invalid match (LL, RR, TT, BB)
 * @param x - architecture direction pair which could potentially be invalid
 * @returns true if the pair is not LL, RR, TT, or BB
 */
export const isValidArchitectureDirectionPair = function (
  x: InvalidArchitectureDirectionPair
): x is ArchitectureDirectionPair {
  return x !== 'LL' && x !== 'RR' && x !== 'TT' && x !== 'BB';
};

export type ArchitectureDirectionPairMap = {
  [key in ArchitectureDirectionPair]?: string;
};

/**
 * Creates a pair of the directions of each side of an edge. This function should be used instead of manually creating it to ensure that the source is always the first character.
 *
 * Note: Undefined is returned when sourceDir and targetDir are the same. In theory this should never happen since the diagram parser throws an error if a user defines it as such.
 * @param sourceDir - source direction
 * @param targetDir - target direction
 * @returns
 */
export const getArchitectureDirectionPair = function (
  sourceDir: ArchitectureDirection,
  targetDir: ArchitectureDirection
): ArchitectureDirectionPair | undefined {
  const pair: `${ArchitectureDirection}${ArchitectureDirection}` = `${sourceDir}${targetDir}`;
  return isValidArchitectureDirectionPair(pair) ? pair : undefined;
};

/**
 * Given an x,y position for an arrow and the direction of the edge it belongs to, return a factor for slightly shifting the edge
 * @param param0 - [x, y] coordinate pair
 * @param pair - architecture direction pair
 * @returns a new [x, y] coordinate pair
 */
export const shiftPositionByArchitectureDirectionPair = function (
  [x, y]: number[],
  pair: ArchitectureDirectionPair
): number[] {
  const lhs = pair[0] as ArchitectureDirection;
  const rhs = pair[1] as ArchitectureDirection;
  if (isArchitectureDirectionX(lhs)) {
    if (isArchitectureDirectionY(rhs)) {
      return [x + (lhs === 'L' ? -1 : 1), y + (rhs === 'T' ? 1 : -1)];
    } else {
      return [x + (lhs === 'L' ? -1 : 1), y];
    }
  } else {
    if (isArchitectureDirectionX(rhs)) {
      return [x + (rhs === 'L' ? 1 : -1), y + (lhs === 'T' ? 1 : -1)];
    } else {
      return [x, y + (lhs === 'T' ? 1 : -1)];
    }
  }
};

/**
 * Given the directional pair of an XY edge, get the scale factors necessary to shift the coordinates inwards towards the edge
 * @param pair - XY pair of an edge
 * @returns - number[] containing [+/- 1, +/- 1]
 */
export const getArchitectureDirectionXYFactors = function (
  pair: ArchitectureDirectionPairXY
): number[] {
  if (pair === 'LT' || pair === 'TL') {
    return [1, 1];
  } else if (pair === 'BL' || pair === 'LB') {
    return [1, -1];
  } else if (pair === 'BR' || pair === 'RB') {
    return [-1, -1];
  } else {
    return [-1, 1];
  }
};

export const getArchitectureDirectionAlignment = function (
  a: ArchitectureDirection,
  b: ArchitectureDirection
): ArchitectureAlignment {
  if (isArchitectureDirectionXY(a, b)) {
    return 'bend';
  } else if (isArchitectureDirectionX(a)) {
    return 'horizontal';
  }
  return 'vertical';
};

export interface ArchitectureStyleOptions {
  archEdgeColor: string;
  archEdgeArrowColor: string;
  archEdgeWidth: string;
  archGroupBorderColor: string;
  archGroupBorderWidth: string;
}

export interface ArchitectureService {
  id: string;
  type: 'service';
  edges: ArchitectureEdge[];
  icon?: string;
  iconText?: string;
  title?: string;
  in?: string;
  width?: number;
  height?: number;
}

export interface ArchitectureJunction {
  id: string;
  type: 'junction';
  edges: ArchitectureEdge[];
  in?: string;
  width?: number;
  height?: number;
}

export type ArchitectureNode = ArchitectureService | ArchitectureJunction;

export const isArchitectureService = function (x: ArchitectureNode): x is ArchitectureService {
  const temp = x as ArchitectureService;
  return temp.type === 'service';
};

export const isArchitectureJunction = function (x: ArchitectureNode): x is ArchitectureJunction {
  const temp = x as ArchitectureJunction;
  return temp.type === 'junction';
};

export interface ArchitectureGroup {
  id: string;
  icon?: string;
  title?: string;
  in?: string;
}

export interface ArchitectureEdge<DT = ArchitectureDirection> {
  lhsId: string;
  lhsDir: DT;
  lhsInto?: boolean;
  lhsGroup?: boolean;
  rhsId: string;
  rhsDir: DT;
  rhsInto?: boolean;
  rhsGroup?: boolean;
  title?: string;
}

export interface ArchitectureDB extends DiagramDB {
  clear: () => void;
  addService: (service: Omit<ArchitectureService, 'edges'>) => void;
  getServices: () => ArchitectureService[];
  addJunction: (service: Omit<ArchitectureJunction, 'edges'>) => void;
  getJunctions: () => ArchitectureJunction[];
  getNodes: () => ArchitectureNode[];
  getNode: (id: string) => ArchitectureNode | null;
  addGroup: (group: ArchitectureGroup) => void;
  getGroups: () => ArchitectureGroup[];
  addEdge: (edge: ArchitectureEdge) => void;
  getEdges: () => ArchitectureEdge[];
  setElementForId: (id: string, element: D3Element) => void;
  getElementById: (id: string) => D3Element;
  getDataStructures: () => ArchitectureDataStructures;
}

export type ArchitectureAdjacencyList = Record<string, ArchitectureDirectionPairMap>;
export type ArchitectureSpatialMap = Record<string, number[]>;

/**
 * Maps the direction that groups connect from.
 *
 * **Outer key**: ID of group A
 *
 * **Inner key**: ID of group B
 *
 * **Value**: 'vertical' or 'horizontal'
 *
 * Note: tmp[groupA][groupB] == tmp[groupB][groupA]
 */
export type ArchitectureGroupAlignments = Record<
  string,
  Record<string, Exclude<ArchitectureAlignment, 'bend'>>
>;

export interface ArchitectureDataStructures {
  adjList: ArchitectureAdjacencyList;
  spatialMaps: ArchitectureSpatialMap[];
  groupAlignments: ArchitectureGroupAlignments;
}

export interface ArchitectureState extends Record<string, unknown> {
  nodes: Record<string, ArchitectureNode>;
  groups: Record<string, ArchitectureGroup>;
  edges: ArchitectureEdge[];
  registeredIds: Record<string, 'node' | 'group'>;
  dataStructures?: ArchitectureDataStructures;
  elements: Record<string, D3Element>;
  config: ArchitectureDiagramConfig;
}

/*=======================================*\
|        Cytoscape Override Types         |
\*=======================================*/

export interface EdgeSingularData {
  id: string;
  label?: string;
  source: string;
  sourceDir: ArchitectureDirection;
  sourceArrow?: boolean;
  sourceGroup?: boolean;
  target: string;
  targetDir: ArchitectureDirection;
  targetArrow?: boolean;
  targetGroup?: boolean;
  [key: string]: any;
}

export const edgeData = (edge: cytoscape.EdgeSingular) => {
  return edge.data() as EdgeSingularData;
};

export interface EdgeSingular extends cytoscape.EdgeSingular {
  _private: {
    bodyBounds: unknown;
    rscratch: {
      startX: number;
      startY: number;
      midX: number;
      midY: number;
      endX: number;
      endY: number;
    };
  };
  data(): EdgeSingularData;
  data<T extends keyof EdgeSingularData>(key: T): EdgeSingularData[T];
}

export type NodeSingularData =
  | {
      type: 'service';
      id: string;
      icon?: string;
      label?: string;
      parent?: string;
      width: number;
      height: number;
      [key: string]: any;
    }
  | {
      type: 'junction';
      id: string;
      parent?: string;
      width: number;
      height: number;
      [key: string]: any;
    }
  | {
      type: 'group';
      id: string;
      icon?: string;
      label?: string;
      parent?: string;
      [key: string]: any;
    };

export const nodeData = (node: cytoscape.NodeSingular) => {
  return node.data() as NodeSingularData;
};

export interface NodeSingular extends cytoscape.NodeSingular {
  _private: {
    bodyBounds: {
      h: number;
      w: number;
      x1: number;
      x2: number;
      y1: number;
      y2: number;
    };
    children: cytoscape.NodeSingular[];
  };
  data(): NodeSingularData;
  data<T extends keyof NodeSingularData>(key: T): NodeSingularData[T];
}
