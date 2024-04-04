import type { DiagramDB } from '../../diagram-api/types.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import type { D3Element } from '../../mermaidAPI.js';

export type ArchitectureDirection = 'L' | 'R' | 'T' | 'B';
export type ArchitectureDirectionX = Extract<ArchitectureDirection, 'L' | 'R'>;
export type ArchitectureDirectionY = Extract<ArchitectureDirection, 'T' | 'B'>;
export const ArchitectureDirectionName = {
  L: 'left',
  R: 'right',
  T: 'top',
  B: 'bottom',
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

/**
 * Contains LL, RR, TT, BB which are impossible conections
 */
export type InvalidArchitectureDirectionPair = `${ArchitectureDirection}${ArchitectureDirection}`;
export type ArchitectureDirectionPair = Exclude<
  InvalidArchitectureDirectionPair,
  'LL' | 'RR' | 'TT' | 'BB'
>;
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
 * @param sourceDir
 * @param targetDir
 * @returns
 */
export const getArchitectureDirectionPair = function (
  sourceDir: ArchitectureDirection,
  targetDir: ArchitectureDirection
): ArchitectureDirectionPair | undefined {
  const pair: `${ArchitectureDirection}${ArchitectureDirection}` = `${sourceDir}${targetDir}`;
  return isValidArchitectureDirectionPair(pair) ? pair : undefined;
};

export const shiftPositionByArchitectureDirectionPair = function (
  [x, y]: number[],
  pair: ArchitectureDirectionPair
): number[] {
  const lhs = pair[0] as ArchitectureDirection;
  const rhs = pair[1] as ArchitectureDirection;
  console.log(`${pair}: (${x},${y})`);
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

export interface ArchitectureStyleOptions {
  fontFamily: string;
}

export interface ArchitectureService {
  id: string;
  edges: ArchitectureLine[];
  icon?: string;
  title?: string;
  in?: string;
  width?: number;
  height?: number;
}

export interface ArchitectureGroup {
  id: string;
  icon?: string;
  title?: string;
  in?: string;
}

export interface ArchitectureLine {
  lhs_id: string;
  lhs_dir: ArchitectureDirection;
  title?: string;
  rhs_id: string;
  rhs_dir: ArchitectureDirection;
  lhs_into?: boolean;
  rhs_into?: boolean;
}

export interface ArchitectureDB extends DiagramDB {
  clear: () => void;
  addService: (id: string, opts: Omit<ArchitectureService, 'id'>) => void;
  getServices: () => ArchitectureService[];
  addGroup: (id: string, opts: Omit<ArchitectureGroup, 'id'>) => void;
  getGroups: () => ArchitectureGroup[];
  addLine: (
    lhs_id: string,
    lhs_dir: ArchitectureDirection,
    rhs_id: string,
    rhs_dir: ArchitectureDirection,
    opts: Omit<ArchitectureLine, 'lhs_id' | 'lhs_dir' | 'rhs_id' | 'rhs_dir'>
  ) => void;
  getLines: () => ArchitectureLine[];
  setElementForId: (id: string, element: D3Element) => void;
  getElementById: (id: string) => D3Element;
  getDataStructures: () => ArchitectureDataStructures;
}

export type ArchitectureAdjacencyList = { [id: string]: ArchitectureDirectionPairMap };
export type ArchitectureSpatialMap = Record<string, number[]>;
export type ArchitectureDataStructures = {
  adjList: ArchitectureAdjacencyList;
  spatialMaps: ArchitectureSpatialMap[];
};

export interface ArchitectureFields {
  services: Record<string, ArchitectureService>;
  groups: ArchitectureGroup[];
  lines: ArchitectureLine[];
  registeredIds: Record<string, 'service' | 'group'>;
  datastructures?: ArchitectureDataStructures;
  config: ArchitectureDiagramConfig;
}
