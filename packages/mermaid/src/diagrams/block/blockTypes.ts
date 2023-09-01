import type { BaseDiagramConfig } from '../../config.type.js';

export interface BlockConfig extends BaseDiagramConfig {
  padding?: number;
}

export type BlockType =
  | 'column-setting'
  | 'round'
  | 'square'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'lean_right'
  | 'lean_left'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'odd_right'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'cylinder'
  | 'group'
  | 'doublecircle'
  | 'composite';

export interface Block {
  id: string;
  label?: string;
  parent?: Block;
  type?: BlockType;
  children: Block[];
  columns?: number; // | TBlockColumnsDefaultValue;
}

export interface Link {
  source: Block;
  target: Block;
}
