import type { DiagramDB } from '../../diagram-api/types.js';

/**
 * AST Node types for Railroad diagram expressions
 */
export interface TerminalNode {
  type: 'terminal';
  value: string;
}

export interface NonTerminalNode {
  type: 'nonterminal';
  name: string;
}

export interface SequenceNode {
  type: 'sequence';
  elements: ASTNode[];
}

export interface ChoiceNode {
  type: 'choice';
  alternatives: ASTNode[];
}

export interface OptionalNode {
  type: 'optional';
  element: ASTNode;
}

export interface RepetitionNode {
  type: 'repetition';
  element: ASTNode;
  min: number; // 0 for *, 1 for +
  max: number; // Infinity for unlimited
  separator?: ASTNode; // Optional separator (e.g., comma)
}

export interface GroupNode {
  type: 'group';
  element: ASTNode;
}

export interface SpecialNode {
  type: 'special';
  text: string;
}

export interface ExceptionNode {
  type: 'exception';
  base: ASTNode;
  except: ASTNode;
}

/**
 * Union type for all AST nodes
 */
export type ASTNode =
  | TerminalNode
  | NonTerminalNode
  | SequenceNode
  | ChoiceNode
  | OptionalNode
  | RepetitionNode
  | GroupNode
  | SpecialNode
  | ExceptionNode;

/**
 * Railroad diagram rule definition
 */
export interface RailroadRule {
  name: string;
  definition: ASTNode;
  comment?: string;
}

/**
 * Configuration for Railroad diagram styling
 */
export interface RailroadStyleOptions {
  // Layout
  orientation?: 'LR' | 'TB';
  compactMode?: boolean;

  // Spacing
  padding?: number;
  verticalSeparation?: number;
  horizontalSeparation?: number;
  arcRadius?: number;

  // Typography
  fontSize?: number;
  fontFamily?: string;

  // Colors - Terminal
  terminalFill?: string;
  terminalStroke?: string;
  terminalTextColor?: string;

  // Colors - Non-terminal
  nonTerminalFill?: string;
  nonTerminalStroke?: string;
  nonTerminalTextColor?: string;

  // Colors - Lines
  lineColor?: string;
  strokeWidth?: number;

  // Colors - Markers
  markerFill?: string;

  // Colors - Comment
  commentFill?: string;
  commentStroke?: string;
  commentTextColor?: string;

  // Colors - Special
  specialFill?: string;
  specialStroke?: string;

  // Other
  ruleNameColor?: string;
  showMarkers?: boolean;
  markerRadius?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_RAILROAD_CONFIG: Required<RailroadStyleOptions> = {
  // Layout
  orientation: 'LR',
  compactMode: false,

  // Spacing
  padding: 10,
  verticalSeparation: 8,
  horizontalSeparation: 10,
  arcRadius: 10,

  // Typography
  fontSize: 14,
  fontFamily: 'monospace',

  // Colors - Terminal
  terminalFill: '#FFFFC0',
  terminalStroke: '#000000',
  terminalTextColor: '#000000',

  // Colors - Non-terminal
  nonTerminalFill: '#FFFFFF',
  nonTerminalStroke: '#000000',
  nonTerminalTextColor: '#000000',

  // Colors - Lines
  lineColor: '#000000',
  strokeWidth: 2,

  // Colors - Markers
  markerFill: '#000000',

  // Colors - Comment
  commentFill: '#E8E8E8',
  commentStroke: '#888888',
  commentTextColor: '#666666',

  // Colors - Special
  specialFill: '#F0E0FF',
  specialStroke: '#8800CC',

  // Other
  ruleNameColor: '#000066',
  showMarkers: true,
  markerRadius: 5,
};

/**
 * Diagram dimensions for rendering
 */
export interface DiagramDimensions {
  width: number;
  height: number;
  up: number; // Height above center line
  down: number; // Height below center line
}

/**
 * Render result containing SVG element and dimensions
 */
export interface RenderResult {
  element: SVGElement;
  dimensions: DiagramDimensions;
}

/**
 * Railroad diagram Database interface
 */
export interface RailroadDB extends DiagramDB {
  clear: () => void;
  setTitle: (title: string) => void;
  getTitle: () => string;
  addRule: (rule: RailroadRule) => void;
  getRules: () => RailroadRule[];
  getRule: (name: string) => RailroadRule | undefined;
  setAccTitle: (title: string) => void;
  getAccTitle: () => string;
  setAccDescription: (description: string) => void;
  getAccDescription: () => string;
  setDiagramTitle: (title: string) => void;
  getDiagramTitle: () => string;
}
