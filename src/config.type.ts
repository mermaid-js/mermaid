// TODO: This was auto generated from defaultConfig. Needs to be verified.

import type DOMPurify from 'dompurify';

export interface MermaidConfig {
  altFontFamily?: string;
  arrowMarkerAbsolute?: boolean;
  c4?: C4DiagramConfig;
  class?: ClassDiagramConfig;
  darkMode?: boolean;
  deterministicIDSeed?: string;
  deterministicIds?: boolean;
  dompurifyConfig?: DOMPurify.Config;
  er?: ErDiagramConfig;
  flowchart?: FlowchartDiagramConfig;
  fontFamily?: string;
  fontSize?: number;
  gantt?: GanttDiagramConfig;
  gitGraph?: GitGraphDiagramConfig;
  htmlLabels?: boolean;
  journey?: JourneyDiagramConfig;
  logLevel?: number;
  maxTextSize?: number;
  mindmap?: MindmapDiagramConfig;
  pie?: PieDiagramConfig;
  requirement?: RequirementDiagramConfig;
  secure?: string[];
  securityLevel?: string;
  sequence?: SequenceDiagramConfig;
  startOnLoad?: boolean;
  state?: StateDiagramConfig;
  theme?: string;
  themeCSS?: string;
  themeVariables?: any;
  wrap?: boolean;
}

// TODO: More configs needs to be moved in here
export interface BaseDiagramConfig {
  width?: number;
  height?: number;
  useWidth?: number;
  useMaxWidth?: boolean;
}

export interface C4DiagramConfig extends BaseDiagramConfig {
  boundaryFont?: FontCalculator;
  boundaryFontFamily?: string;
  boundaryFontSize?: string | number;
  boundaryFontWeight?: string | number;
  boxMargin?: number;
  c4BoundaryInRow?: number;
  c4ShapeInRow?: number;
  c4ShapeMargin?: number;
  c4ShapePadding?: number;
  componentFont?: FontCalculator;
  componentFontFamily?: string;
  componentFontSize?: string | number;
  componentFontWeight?: string | number;
  component_bg_color?: string;
  component_border_color?: string;
  component_dbFont?: FontCalculator;
  component_dbFontFamily?: string;
  component_dbFontSize?: string | number;
  component_dbFontWeight?: string | number;
  component_db_bg_color?: string;
  component_db_border_color?: string;
  component_queueFont?: FontCalculator;
  component_queueFontFamily?: string;
  component_queueFontSize?: string | number;
  component_queueFontWeight?: string | number;
  component_queue_bg_color?: string;
  component_queue_border_color?: string;
  containerFont?: FontCalculator;
  containerFontFamily?: string;
  containerFontSize?: string | number;
  containerFontWeight?: string | number;
  container_bg_color?: string;
  container_border_color?: string;
  container_dbFont?: FontCalculator;
  container_dbFontFamily?: string;
  container_dbFontSize?: string | number;
  container_dbFontWeight?: string | number;
  container_db_bg_color?: string;
  container_db_border_color?: string;
  container_queueFont?: FontCalculator;
  container_queueFontFamily?: string;
  container_queueFontSize?: string | number;
  container_queueFontWeight?: string | number;
  container_queue_bg_color?: string;
  container_queue_border_color?: string;
  diagramMarginX?: number;
  diagramMarginY?: number;
  external_componentFont?: FontCalculator;
  external_componentFontFamily?: string;
  external_componentFontSize?: string | number;
  external_componentFontWeight?: string | number;
  external_component_bg_color?: string;
  external_component_border_color?: string;
  external_component_dbFont?: FontCalculator;
  external_component_dbFontFamily?: string;
  external_component_dbFontSize?: string | number;
  external_component_dbFontWeight?: string | number;
  external_component_db_bg_color?: string;
  external_component_db_border_color?: string;
  external_component_queueFont?: FontCalculator;
  external_component_queueFontFamily?: string;
  external_component_queueFontSize?: string | number;
  external_component_queueFontWeight?: string | number;
  external_component_queue_bg_color?: string;
  external_component_queue_border_color?: string;
  external_containerFont?: FontCalculator;
  external_containerFontFamily?: string;
  external_containerFontSize?: string | number;
  external_containerFontWeight?: string | number;
  external_container_bg_color?: string;
  external_container_border_color?: string;
  external_container_dbFont?: FontCalculator;
  external_container_dbFontFamily?: string;
  external_container_dbFontSize?: string | number;
  external_container_dbFontWeight?: string | number;
  external_container_db_bg_color?: string;
  external_container_db_border_color?: string;
  external_container_queueFont?: FontCalculator;
  external_container_queueFontFamily?: string;
  external_container_queueFontSize?: string | number;
  external_container_queueFontWeight?: string | number;
  external_container_queue_bg_color?: string;
  external_container_queue_border_color?: string;
  external_personFont?: FontCalculator;
  external_personFontFamily?: string;
  external_personFontSize?: string | number;
  external_personFontWeight?: string | number;
  external_person_bg_color?: string;
  external_person_border_color?: string;
  external_systemFont?: FontCalculator;
  external_systemFontFamily?: string;
  external_systemFontSize?: string | number;
  external_systemFontWeight?: string | number;
  external_system_bg_color?: string;
  external_system_border_color?: string;
  external_system_dbFont?: FontCalculator;
  external_system_dbFontFamily?: string;
  external_system_dbFontSize?: string | number;
  external_system_dbFontWeight?: string | number;
  external_system_db_bg_color?: string;
  external_system_db_border_color?: string;
  external_system_queueFont?: FontCalculator;
  external_system_queueFontFamily?: string;
  external_system_queueFontSize?: string | number;
  external_system_queueFontWeight?: string | number;
  external_system_queue_bg_color?: string;
  external_system_queue_border_color?: string;
  messageFont?: FontCalculator;
  messageFontFamily?: string;
  messageFontSize?: string | number;
  messageFontWeight?: string | number;
  nextLinePaddingX?: number;
  personFont?: FontCalculator;
  personFontFamily?: string;
  personFontSize?: string | number;
  personFontWeight?: string | number;
  person_bg_color?: string;
  person_border_color?: string;
  systemFont?: FontCalculator;
  systemFontFamily?: string;
  systemFontSize?: string | number;
  systemFontWeight?: string | number;
  system_bg_color?: string;
  system_border_color?: string;
  system_dbFont?: FontCalculator;
  system_dbFontFamily?: string;
  system_dbFontSize?: string | number;
  system_dbFontWeight?: string | number;
  system_db_bg_color?: string;
  system_db_border_color?: string;
  system_queueFont?: FontCalculator;
  system_queueFontFamily?: string;
  system_queueFontSize?: string | number;
  system_queueFontWeight?: string | number;
  system_queue_bg_color?: string;
  system_queue_border_color?: string;
  wrap?: boolean;
  wrapPadding?: number;
}

export interface GitGraphDiagramConfig extends BaseDiagramConfig {
  arrowMarkerAbsolute?: boolean;
  diagramPadding?: number;
  mainBranchName?: string;
  mainBranchOrder?: number;
  nodeLabel?: NodeLabel;
  rotateCommitLabel?: boolean;
  showBranches?: boolean;
  showCommitLabel?: boolean;
}

export interface NodeLabel {
  height?: number;
  width?: number;
  x?: number;
  y?: number;
}

export interface RequirementDiagramConfig extends BaseDiagramConfig {
  fontSize?: number;
  line_height?: number;
  rect_border_color?: string;
  rect_border_size?: string;
  rect_fill?: string;
  rect_min_height?: number;
  rect_min_width?: number;
  rect_padding?: number;
  text_color?: string;
}

export interface MindmapDiagramConfig extends BaseDiagramConfig {
  padding?: number;
  maxNodeWidth?: number;
}
export interface PieDiagramConfig extends BaseDiagramConfig {}

export interface ErDiagramConfig extends BaseDiagramConfig {
  diagramPadding?: number;
  entityPadding?: number;
  fill?: string;
  fontSize?: number;
  layoutDirection?: string;
  minEntityHeight?: number;
  minEntityWidth?: number;
  stroke?: string;
}

export interface StateDiagramConfig extends BaseDiagramConfig {
  arrowMarkerAbsolute?: boolean;
  compositTitleSize?: number;
  defaultRenderer?: string;
  dividerMargin?: number;
  edgeLengthFactor?: string;
  fontSize?: number;
  fontSizeFactor?: number;
  forkHeight?: number;
  forkWidth?: number;
  labelHeight?: number;
  miniPadding?: number;
  noteMargin?: number;
  padding?: number;
  radius?: number;
  sizeUnit?: number;
  textHeight?: number;
  titleShift?: number;
}

export interface ClassDiagramConfig extends BaseDiagramConfig {
  arrowMarkerAbsolute?: boolean;
  defaultRenderer?: string;
  dividerMargin?: number;
  padding?: number;
  textHeight?: number;
}

export interface JourneyDiagramConfig extends BaseDiagramConfig {
  activationWidth?: number;
  actorColours?: string[];
  bottomMarginAdj?: number;
  boxMargin?: number;
  boxTextMargin?: number;
  diagramMarginX?: number;
  diagramMarginY?: number;
  leftMargin?: number;
  messageAlign?: string;
  messageMargin?: number;
  noteMargin?: number;
  rightAngles?: boolean;
  sectionColours?: string[];
  sectionFills?: string[];
  taskFontFamily?: string;
  taskFontSize?: string | number;
  taskMargin?: number;
  textPlacement?: string;
}

export interface GanttDiagramConfig extends BaseDiagramConfig {
  axisFormat?: string;
  barGap?: number;
  barHeight?: number;
  fontSize?: number;
  gridLineStartPadding?: number;
  leftPadding?: number;
  numberSectionStyles?: number;
  rightPadding?: number;
  sectionFontSize?: string | number;
  titleTopMargin?: number;
  topAxis?: boolean;
  topPadding?: number;
}

export interface SequenceDiagramConfig extends BaseDiagramConfig {
  activationWidth?: number;
  actorFont?: FontCalculator;
  actorFontFamily?: string;
  actorFontSize?: string | number;
  actorFontWeight?: string | number;
  actorMargin?: number;
  arrowMarkerAbsolute?: boolean;
  bottomMarginAdj?: number;
  boxMargin?: number;
  boxTextMargin?: number;
  diagramMarginX?: number;
  diagramMarginY?: number;
  forceMenus?: boolean;
  hideUnusedParticipants?: boolean;
  labelBoxHeight?: number;
  labelBoxWidth?: number;
  messageAlign?: string;
  messageFont?: FontCalculator;
  messageFontFamily?: string;
  messageFontSize?: string | number;
  messageFontWeight?: string | number;
  messageMargin?: number;
  mirrorActors?: boolean;
  noteAlign?: string;
  noteFont?: FontCalculator;
  noteFontFamily?: string;
  noteFontSize?: string | number;
  noteFontWeight?: string | number;
  noteMargin?: number;
  rightAngles?: boolean;
  showSequenceNumbers?: boolean;
  wrap?: boolean;
  wrapPadding?: number;
}

export interface FlowchartDiagramConfig extends BaseDiagramConfig {
  arrowMarkerAbsolute?: boolean;
  curve?: string;
  defaultRenderer?: string;
  diagramPadding?: number;
  htmlLabels?: boolean;
  nodeSpacing?: number;
  padding?: number;
  rankSpacing?: number;
}

export interface FontConfig {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
}

export type FontCalculator = () => Partial<FontConfig>;

export {};
