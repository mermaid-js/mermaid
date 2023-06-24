// TODO: This was auto generated from defaultConfig. Needs to be verified.

import DOMPurify from 'dompurify';

export interface MermaidConfig {
  theme?: string;
  themeVariables?: any;
  themeCSS?: string;
  maxTextSize?: number;
  darkMode?: boolean;
  htmlLabels?: boolean;
  fontFamily?: string;
  altFontFamily?: string;
  logLevel?: number;
  securityLevel?: string;
  startOnLoad?: boolean;
  arrowMarkerAbsolute?: boolean;
  secure?: string[];
  deterministicIds?: boolean;
  deterministicIDSeed?: string;
  flowchart?: FlowchartDiagramConfig;
  sequence?: SequenceDiagramConfig;
  gantt?: GanttDiagramConfig;
  journey?: JourneyDiagramConfig;
  timeline?: TimelineDiagramConfig;
  class?: ClassDiagramConfig;
  state?: StateDiagramConfig;
  er?: ErDiagramConfig;
  pie?: PieDiagramConfig;
  quadrantChart?: QuadrantChartConfig;
  requirement?: RequirementDiagramConfig;
  mindmap?: MindmapDiagramConfig;
  gitGraph?: GitGraphDiagramConfig;
  c4?: C4DiagramConfig;
  sankey?: SankeyDiagramConfig;
  dompurifyConfig?: DOMPurify.Config;
  wrap?: boolean;
  fontSize?: number;
}

// TODO: More configs needs to be moved in here
export interface BaseDiagramConfig {
  useWidth?: number;
  useMaxWidth?: boolean;
}

export interface C4DiagramConfig extends BaseDiagramConfig {
  diagramMarginX?: number;
  diagramMarginY?: number;
  c4ShapeMargin?: number;
  c4ShapePadding?: number;
  width?: number;
  height?: number;
  boxMargin?: number;
  c4ShapeInRow?: number;
  nextLinePaddingX?: number;
  c4BoundaryInRow?: number;
  personFontSize?: string | number;
  personFontFamily?: string;
  personFontWeight?: string | number;
  external_personFontSize?: string | number;
  external_personFontFamily?: string;
  external_personFontWeight?: string | number;
  systemFontSize?: string | number;
  systemFontFamily?: string;
  systemFontWeight?: string | number;
  external_systemFontSize?: string | number;
  external_systemFontFamily?: string;
  external_systemFontWeight?: string | number;
  system_dbFontSize?: string | number;
  system_dbFontFamily?: string;
  system_dbFontWeight?: string | number;
  external_system_dbFontSize?: string | number;
  external_system_dbFontFamily?: string;
  external_system_dbFontWeight?: string | number;
  system_queueFontSize?: string | number;
  system_queueFontFamily?: string;
  system_queueFontWeight?: string | number;
  external_system_queueFontSize?: string | number;
  external_system_queueFontFamily?: string;
  external_system_queueFontWeight?: string | number;
  boundaryFontSize?: string | number;
  boundaryFontFamily?: string;
  boundaryFontWeight?: string | number;
  messageFontSize?: string | number;
  messageFontFamily?: string;
  messageFontWeight?: string | number;
  containerFontSize?: string | number;
  containerFontFamily?: string;
  containerFontWeight?: string | number;
  external_containerFontSize?: string | number;
  external_containerFontFamily?: string;
  external_containerFontWeight?: string | number;
  container_dbFontSize?: string | number;
  container_dbFontFamily?: string;
  container_dbFontWeight?: string | number;
  external_container_dbFontSize?: string | number;
  external_container_dbFontFamily?: string;
  external_container_dbFontWeight?: string | number;
  container_queueFontSize?: string | number;
  container_queueFontFamily?: string;
  container_queueFontWeight?: string | number;
  external_container_queueFontSize?: string | number;
  external_container_queueFontFamily?: string;
  external_container_queueFontWeight?: string | number;
  componentFontSize?: string | number;
  componentFontFamily?: string;
  componentFontWeight?: string | number;
  external_componentFontSize?: string | number;
  external_componentFontFamily?: string;
  external_componentFontWeight?: string | number;
  component_dbFontSize?: string | number;
  component_dbFontFamily?: string;
  component_dbFontWeight?: string | number;
  external_component_dbFontSize?: string | number;
  external_component_dbFontFamily?: string;
  external_component_dbFontWeight?: string | number;
  component_queueFontSize?: string | number;
  component_queueFontFamily?: string;
  component_queueFontWeight?: string | number;
  external_component_queueFontSize?: string | number;
  external_component_queueFontFamily?: string;
  external_component_queueFontWeight?: string | number;
  wrap?: boolean;
  wrapPadding?: number;
  person_bg_color?: string;
  person_border_color?: string;
  external_person_bg_color?: string;
  external_person_border_color?: string;
  system_bg_color?: string;
  system_border_color?: string;
  system_db_bg_color?: string;
  system_db_border_color?: string;
  system_queue_bg_color?: string;
  system_queue_border_color?: string;
  external_system_bg_color?: string;
  external_system_border_color?: string;
  external_system_db_bg_color?: string;
  external_system_db_border_color?: string;
  external_system_queue_bg_color?: string;
  external_system_queue_border_color?: string;
  container_bg_color?: string;
  container_border_color?: string;
  container_db_bg_color?: string;
  container_db_border_color?: string;
  container_queue_bg_color?: string;
  container_queue_border_color?: string;
  external_container_bg_color?: string;
  external_container_border_color?: string;
  external_container_db_bg_color?: string;
  external_container_db_border_color?: string;
  external_container_queue_bg_color?: string;
  external_container_queue_border_color?: string;
  component_bg_color?: string;
  component_border_color?: string;
  component_db_bg_color?: string;
  component_db_border_color?: string;
  component_queue_bg_color?: string;
  component_queue_border_color?: string;
  external_component_bg_color?: string;
  external_component_border_color?: string;
  external_component_db_bg_color?: string;
  external_component_db_border_color?: string;
  external_component_queue_bg_color?: string;
  external_component_queue_border_color?: string;
  personFont?: FontCalculator;
  external_personFont?: FontCalculator;
  systemFont?: FontCalculator;
  external_systemFont?: FontCalculator;
  system_dbFont?: FontCalculator;
  external_system_dbFont?: FontCalculator;
  system_queueFont?: FontCalculator;
  external_system_queueFont?: FontCalculator;
  containerFont?: FontCalculator;
  external_containerFont?: FontCalculator;
  container_dbFont?: FontCalculator;
  external_container_dbFont?: FontCalculator;
  container_queueFont?: FontCalculator;
  external_container_queueFont?: FontCalculator;
  componentFont?: FontCalculator;
  external_componentFont?: FontCalculator;
  component_dbFont?: FontCalculator;
  external_component_dbFont?: FontCalculator;
  component_queueFont?: FontCalculator;
  external_component_queueFont?: FontCalculator;
  boundaryFont?: FontCalculator;
  messageFont?: FontCalculator;
}

export interface GitGraphDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  diagramPadding?: number;
  nodeLabel?: NodeLabel;
  mainBranchName?: string;
  mainBranchOrder?: number;
  showCommitLabel?: boolean;
  showBranches?: boolean;
  rotateCommitLabel?: boolean;
  arrowMarkerAbsolute?: boolean;
}

export interface NodeLabel {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface RequirementDiagramConfig extends BaseDiagramConfig {
  rect_fill?: string;
  text_color?: string;
  rect_border_size?: string;
  rect_border_color?: string;
  rect_min_width?: number;
  rect_min_height?: number;
  fontSize?: number;
  rect_padding?: number;
  line_height?: number;
}

export interface MindmapDiagramConfig extends BaseDiagramConfig {
  useMaxWidth: boolean;
  padding: number;
  maxNodeWidth: number;
}

export interface PieDiagramConfig extends BaseDiagramConfig {
  textPosition?: number;
}

export interface QuadrantChartConfig extends BaseDiagramConfig {
  chartWidth: number;
  chartHeight: number;
  titleFontSize: number;
  titlePadding: number;
  quadrantPadding: number;
  xAxisLabelPadding: number;
  yAxisLabelPadding: number;
  xAxisLabelFontSize: number;
  yAxisLabelFontSize: number;
  quadrantLabelFontSize: number;
  quadrantTextTopPadding: number;
  pointTextPadding: number;
  pointLabelFontSize: number;
  pointRadius: number;
  xAxisPosition: 'top' | 'bottom';
  yAxisPosition: 'left' | 'right';
  quadrantInternalBorderStrokeWidth: number;
  quadrantExternalBorderStrokeWidth: number;
}

export interface ErDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  diagramPadding?: number;
  layoutDirection?: string;
  minEntityWidth?: number;
  minEntityHeight?: number;
  entityPadding?: number;
  stroke?: string;
  fill?: string;
  fontSize?: number;
}

export interface StateDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  arrowMarkerAbsolute?: boolean;
  dividerMargin?: number;
  sizeUnit?: number;
  padding?: number;
  textHeight?: number;
  titleShift?: number;
  noteMargin?: number;
  forkWidth?: number;
  forkHeight?: number;
  miniPadding?: number;
  fontSizeFactor?: number;
  fontSize?: number;
  labelHeight?: number;
  edgeLengthFactor?: string;
  compositTitleSize?: number;
  radius?: number;
  defaultRenderer?: string;
}

export interface ClassDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  arrowMarkerAbsolute?: boolean;
  dividerMargin?: number;
  padding?: number;
  textHeight?: number;
  defaultRenderer?: string;
  nodeSpacing?: number;
  rankSpacing?: number;
  diagramPadding?: number;
  htmlLabels?: boolean;
}

export interface JourneyDiagramConfig extends BaseDiagramConfig {
  diagramMarginX?: number;
  diagramMarginY?: number;
  leftMargin?: number;
  width?: number;
  height?: number;
  boxMargin?: number;
  boxTextMargin?: number;
  noteMargin?: number;
  messageMargin?: number;
  messageAlign?: string;
  bottomMarginAdj?: number;
  rightAngles?: boolean;
  taskFontSize?: string | number;
  taskFontFamily?: string;
  taskMargin?: number;
  activationWidth?: number;
  textPlacement?: string;
  actorColours?: string[];
  sectionFills?: string[];
  sectionColours?: string[];
}

export interface TimelineDiagramConfig extends BaseDiagramConfig {
  diagramMarginX?: number;
  diagramMarginY?: number;
  leftMargin?: number;
  width?: number;
  height?: number;
  padding?: number;
  boxMargin?: number;
  boxTextMargin?: number;
  noteMargin?: number;
  messageMargin?: number;
  messageAlign?: string;
  bottomMarginAdj?: number;
  rightAngles?: boolean;
  taskFontSize?: string | number;
  taskFontFamily?: string;
  taskMargin?: number;
  activationWidth?: number;
  textPlacement?: string;
  actorColours?: string[];
  sectionFills?: string[];
  sectionColours?: string[];
  disableMulticolor?: boolean;
  useMaxWidth?: boolean;
}

export interface GanttDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  barHeight?: number;
  barGap?: number;
  topPadding?: number;
  rightPadding?: number;
  leftPadding?: number;
  gridLineStartPadding?: number;
  fontSize?: number;
  sectionFontSize?: string | number;
  numberSectionStyles?: number;
  axisFormat?: string;
  tickInterval?: string;
  topAxis?: boolean;
  displayMode?: string;
}

export interface SequenceDiagramConfig extends BaseDiagramConfig {
  arrowMarkerAbsolute?: boolean;
  hideUnusedParticipants?: boolean;
  activationWidth?: number;
  diagramMarginX?: number;
  diagramMarginY?: number;
  actorMargin?: number;
  width?: number;
  height?: number;
  boxMargin?: number;
  boxTextMargin?: number;
  noteMargin?: number;
  messageMargin?: number;
  messageAlign?: string;
  mirrorActors?: boolean;
  forceMenus?: boolean;
  bottomMarginAdj?: number;
  rightAngles?: boolean;
  showSequenceNumbers?: boolean;
  actorFontSize?: string | number;
  actorFontFamily?: string;
  actorFontWeight?: string | number;
  noteFontSize?: string | number;
  noteFontFamily?: string;
  noteFontWeight?: string | number;
  noteAlign?: string;
  messageFontSize?: string | number;
  messageFontFamily?: string;
  messageFontWeight?: string | number;
  wrap?: boolean;
  wrapPadding?: number;
  labelBoxWidth?: number;
  labelBoxHeight?: number;
  messageFont?: FontCalculator;
  noteFont?: FontCalculator;
  actorFont?: FontCalculator;
}

export interface FlowchartDiagramConfig extends BaseDiagramConfig {
  titleTopMargin?: number;
  arrowMarkerAbsolute?: boolean;
  diagramPadding?: number;
  htmlLabels?: boolean;
  nodeSpacing?: number;
  rankSpacing?: number;
  curve?: string;
  padding?: number;
  defaultRenderer?: string;
  wrappingWidth?: number;
}

export enum SankeyLinkColor {
  source = 'source',
  target = 'target',
  gradient = 'gradient',
}

export interface SankeyDiagramConfig extends BaseDiagramConfig {
  width?: number;
  height?: number;
  linkColor?: SankeyLinkColor | string;
}

export interface FontConfig {
  fontSize?: string | number;
  fontFamily?: string;
  fontWeight?: string | number;
}

export type FontCalculator = () => Partial<FontConfig>;

export {};
