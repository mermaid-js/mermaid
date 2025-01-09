export interface C4Node {
  nodeType?: string;
  isBoundary: boolean;
  type: string;
  alias: string;
  label: string;
  techn?: string;
  descr?: string;
  sprite?: string;
  tags?: string;
  link?: string;
  parent?: string;
  wrap: boolean;
  bgColor?: string;
  fontColor?: string;
  borderColor?: string;
  shadowing?: string;
  shape?: string;
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
