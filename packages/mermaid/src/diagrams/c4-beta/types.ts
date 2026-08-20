export type C4DiagramKind = 'context' | 'container' | 'component' | 'dynamic' | 'deployment';

export type C4Direction = 'TB' | 'BT' | 'LR' | 'RL';

export type C4ElementKind =
  | 'person'
  | 'softwareSystem'
  | 'container'
  | 'component'
  | 'group'
  | 'deploymentNode'
  | 'infrastructureNode';

export type C4Arrow = '-->' | '<--' | '<-->';

export interface C4BetaElement {
  id: string;
  kind: C4ElementKind;
  name: string;
  description?: string;
  technology?: string;
  instances?: string;
  tags: string[];
  parentId?: string;
}

export type C4LinePattern = 'solid' | 'dashed' | 'dotted';

export interface C4BetaTagStyle {
  shape?: 'cylinder';
  fill?: string;
  stroke?: string;
  color?: string;
  line?: C4LinePattern;
}

export interface C4BetaLegendItem {
  label: string;
  // Element-kind rows resolve their swatch colour from the theme at render time
  // (no theme is available when the legend items are built at parse time).
  kind?: C4ElementKind;
  external?: boolean;
  // Tag rows carry the user's explicit, theme-independent colours.
  fill?: string;
  stroke?: string;
}

export interface C4BetaRelationship {
  sourceId: string;
  targetId: string;
  arrow: C4Arrow;
  description?: string;
  technology?: string;
  step?: number;
  tags: string[];
}
