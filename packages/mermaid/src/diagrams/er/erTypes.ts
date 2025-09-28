export interface EntityNode {
  id: string;
  label: string;
  attributes: Attribute[];
  alias: string;
  shape: string;
  look?: string;
  cssClasses?: string;
  cssStyles?: string[];
  cssCompiledStyles?: string[];
}

export interface Attribute {
  type: string;
  name: string;
  keys: ('PK' | 'FK' | 'UK')[];
  comment: string;
}

export interface Relationship {
  entityA: string;
  roleA: string;
  entityB: string;
  relSpec: RelSpec;
}

export interface RelSpec {
  cardA: string;
  cardB: string;
  relType: string;
}

export interface EntityClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

// Aggregation relationship types
export const AggregationType = {
  AGGREGATION: 'AGGREGATION',
  AGGREGATION_DASHED: 'AGGREGATION_DASHED',
} as const;

// Line types for aggregation
export const AggregationLineType = {
  SOLID: 'SOLID',
  DASHED: 'DASHED',
} as const;
