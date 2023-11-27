export interface FlowVertex {
  id: string;
  labelType: 'text';
  dir?: string;
  props?: any;
  type?: string;
  text?: string;
  link?: string;
  linkTarget?: string;
  haveCallback?: boolean;
  domId: string;
  styles: any[];
  classes: any[];
}

export interface FlowText {
  text: string;
  type: 'text';
}

export interface FlowEdge {
  start: string;
  end: string;
  type?: string;
  stroke?: string;
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
  id: string;
  nodes: string[];
  title: string;
  classes: string[];
  dir?: string;
  labelType: string;
}

export interface FlowLink {
  type: string;
  stroke: string;
  length?: number;
}
