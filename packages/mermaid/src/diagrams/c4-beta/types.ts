export type C4DiagramKind = 'context' | 'container' | 'component' | 'dynamic' | 'deployment';

export type C4Direction = 'TB' | 'BT' | 'LR' | 'RL';

export type C4ElementKind = 'person' | 'system' | 'container' | 'component' | 'group' | 'node';

export type C4Arrow = '-->' | '<--' | '<-->';

export interface C4BetaElement {
  id: string;
  kind: C4ElementKind;
  name: string;
  description?: string;
  technology?: string;
  external: boolean;
  tags: string[];
  parentId?: string;
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
