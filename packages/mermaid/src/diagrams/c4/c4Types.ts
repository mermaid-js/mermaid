import type { ShapeID } from '../../rendering-util/rendering-elements/shapes.js';

export interface C4Node {
  cssStyles: string[];
  classes: string[];
  nodeType?: string;
  isBoundary: boolean;
  type?: string;
  alias: string;
  label: string;
  techn?: string;
  descr?: string;
  sprite?: string;
  tags?: string;
  link?: string;
  linkTarget?: string;
  parent?: string;
  wrap: boolean;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shadowing?: string;
  shape: ShapeID;
  legendText?: string;
  legendSprite?: string;
}

export interface C4Relation {
  type: string;
  from: string;
  to: string;
  label: string;
  techn?: string;
  descr?: string;
  link?: string;
  sprite?: string;
  tags?: string;
  wrap: boolean;
  textColor?: string;
  lineColor?: string;
  offsetX?: number;
  offsetY?: number;
}

export interface C4Class {
  id: string;
  styles: string[];
  textStyles: string[];
}

export interface Tag {
  tagStereo: string;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shadowing?: string;
  shape?: string;
  sprite?: string;
  techn?: string;
  legendText?: string;
  legendSprite?: string;
  borderStyle?: string;
  borderThickness?: number;
  textColor?: string;
  lineColor?: string;
  lineStyle?: string;
  lineThickness?: number;
  type?: string;
}

export interface Legend {
  title: string;
  items: LegendItem[];
}

export interface LegendItem {
  text: string;
  styles: string[];
  sprite: string;
  type: 'node' | 'rel';
}
