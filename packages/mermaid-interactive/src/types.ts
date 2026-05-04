/**
 * Parameter definition extracted from a template signature.
 */
export interface ParamDef {
  /** Parameter name, e.g. "serviceName" */
  name: string;
  /** True if the parameter is an array, e.g. "endpoints[]" */
  isArray: boolean;
}

/**
 * A parsed template definition.
 */
export interface Template {
  /** Template name as declared with `template NAME(...)` */
  name: string;
  /** Ordered parameter definitions */
  params: ParamDef[];
  /** Raw body text of the template (including any interaction blocks) */
  body: string;
}

/**
 * Properties declared inside an `interaction` block.
 */
export interface InteractionProps {
  /** Whether the node can be toggled to collapse/expand its children */
  collapsible?: boolean;
  /** Initial display state for collapsible nodes */
  defaultState?: 'expanded' | 'collapsed';
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Opacity (0–1) applied to the element when expanded */
  expandedOpacity?: number;
  /** Opacity (0–1) applied to the element when collapsed */
  collapsedOpacity?: number;
  /** Scale factor applied to the element when expanded */
  expandedZoom?: number;
  /** Scale factor applied to the element when collapsed */
  collapsedZoom?: number;
  /** CSS z-index applied to the element when expanded */
  expandedZIndex?: number;
  /** CSS z-index applied to the element when collapsed */
  collapsedZIndex?: number;
  /** Override compact stub width when collapsed (cluster only, px) */
  collapsedWidth?: number;
  /** Override compact stub height when collapsed (cluster only, px) */
  collapsedHeight?: number;
  /** Allow arbitrary extension properties */
  [key: string]: unknown;
}

/**
 * An extracted interaction definition for a single node.
 */
export interface InteractionDef {
  /** The Mermaid node ID this interaction applies to */
  nodeId: string;
  /** Interaction properties */
  props: InteractionProps;
}

/**
 * Result from the preprocessor.
 */
export interface PreprocessResult {
  /**
   * Standard Mermaid diagram text, with interaction metadata encoded as
   * `%% @interact <nodeId> <jsonProps>` comments.
   */
  diagram: string;
  /** All extracted interaction definitions */
  interactions: InteractionDef[];
}
