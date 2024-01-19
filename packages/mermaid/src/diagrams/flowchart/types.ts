export interface FlowVertex {
  classes: string[];
  dir?: string;
  domId: string;
  haveCallback?: boolean;
  id: string;
  labelType: 'text';
  link?: string;
  linkTarget?: string;
  props?: any;
  styles: string[];
  text?: string;
  type?: string;
}

export interface FlowText {
  text: string;
  type: 'text';
}

export interface FlowEdge {
  start: string;
  end: string;
  interpolate?: string;
  type?: string;
  stroke?: string;
  style?: string[];
  length?: number;
  text: string;
  labelType: 'text';
}

export interface FlowClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

export interface FlowSubGraph {
  classes: string[];
  dir?: string;
  id: string;
  labelType: string;
  nodes: string[];
  title: string;
}

export interface FlowLink {
  length?: number;
  stroke: string;
  type: string;
  text?: string;
}
