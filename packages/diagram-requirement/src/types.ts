import type { RequirementBoxData } from '@mermaid-js/core/rendering-util/rendering-elements/shapes/requirementBox.js';

export type RequirementType =
  | 'Requirement'
  | 'Functional Requirement'
  | 'Interface Requirement'
  | 'Performance Requirement'
  | 'Physical Requirement'
  | 'Design Constraint';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type VerifyType = 'Analysis' | 'Demonstration' | 'Inspection' | 'Test';

export interface Requirement extends RequirementBoxData {
  name: string;
  type: RequirementType;
  requirementId: string;
  text: string;
  risk: RiskLevel;
  verifyMethod: VerifyType;
  cssStyles: string[];
  classes: string[];
}

export type RelationshipType =
  | 'contains'
  | 'copies'
  | 'derives'
  | 'satisfies'
  | 'verifies'
  | 'refines'
  | 'traces';

export interface Relation {
  type: RelationshipType;
  src: string;
  dst: string;
}

export interface Element extends RequirementBoxData {
  name: string;
  type: string;
  docRef: string;
  cssStyles: string[];
  classes: string[];
}

export interface RequirementClass {
  id: string;
  styles: string[];
  textStyles: string[];
}
