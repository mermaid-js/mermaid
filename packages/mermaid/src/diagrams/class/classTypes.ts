export interface ClassNode {
  id: string;
  type: string;
  label: string;
  cssClasses: string[];
  methods: string[];
  members: string[];
  annotations: string[];
  domId: string;
  link?: string;
  linkTarget?: string;
  haveCallback?: boolean;
  tooltip?: string;
}

export interface ClassNote {
  id: string;
  class: string;
  text: string;
}

export interface EdgeData {
  arrowheadStyle?: string;
  labelpos?: string;
  labelType?: string;
  label?: string;
  classes: string;
  pattern: string;
  id: string;
  arrowhead: string;
  startLabelRight: string;
  endLabelLeft: string;
  arrowTypeStart: string;
  arrowTypeEnd: string;
  style: string;
  labelStyle: string;
  curve: any;
}

export type ClassRelation = {
  id1: string;
  id2: string;
  relationTitle1: string;
  relationTitle2: string;
  type: string;
  title: string;
  text: string;
  style: string[];
  relation: {
    type1: number;
    type2: number;
    lineType: number;
  };
};
export type ClassMap = Record<string, ClassNode>;
