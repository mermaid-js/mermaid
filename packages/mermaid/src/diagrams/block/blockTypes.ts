export type { BlockDiagramConfig as BlockConfig } from '../../config.type.js';

export type BlockType =
  | 'na'
  | 'column-setting'
  | 'edge'
  | 'round'
  | 'block_arrow'
  | 'space'
  | 'square'
  | 'diamond'
  | 'hexagon'
  | 'odd'
  | 'lean_right'
  | 'lean_left'
  | 'trapezoid'
  | 'inv_trapezoid'
  | 'rect_left_inv_arrow'
  | 'odd_right'
  | 'circle'
  | 'ellipse'
  | 'stadium'
  | 'subroutine'
  | 'cylinder'
  | 'group'
  | 'doublecircle'
  | 'classDef'
  | 'applyClass'
  | 'applyStyles'
  | 'composite';

export interface Block {
  // When the block have the type edge, the start and end are the id of the source and target blocks
  start?: string;
  end?: string;
  arrowTypeEnd?: string;
  arrowTypeStart?: string;
  width?: number;
  id: string;
  label?: string;
  intersect?: any;
  parent?: Block;
  type?: BlockType;
  children: Block[];
  size?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  node?: any;
  columns?: number; // | TBlockColumnsDefaultValue;
  classes?: string[];
  directions?: string[];
  css?: string;
  styleClass?: string;
  styles?: string[];
  stylesStr?: string;
  widthInColumns?: number;
}

export interface ClassDef {
  id: string;
  textStyles: string[];
  styles: string[];
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'x' | 'y';
