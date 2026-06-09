import type {
  CynefinThemeVariables,
  RadarThemeVariables,
  WardleyThemeVariables,
  XYChartThemeVariables,
} from './theme-helpers.js';

/**
 * Union of the keys of `T` that consist of the prefix `P` followed by a number,
 * e.g. `NumberedThemeKey<Theme, 'cScale'>` is `'cScale0' | 'cScale1' | ...`.
 */
export type NumberedThemeKey<T, P extends string> = Extract<keyof T, `${P}${number}`>;

/**
 * Theme variables shared by every theme.
 *
 * The theme classes do not extend each other at runtime; instead each theme
 * file declaration-merges its `class Theme` with an `interface Theme` that
 * extends one of the interfaces below, so the member declarations are shared
 * without changing the constructor property-insertion order.
 */
export interface CoreThemeVariables {
  background: string;
  primaryColor: string;
  noteBkgColor: string;
  noteTextColor: string;
  THEME_COLOR_LIMIT: number;
  radius: number;
  strokeWidth: number;
  fontFamily: string;
  fontSize: string;
  useGradient: boolean;
  dropShadow: string;
  primaryTextColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  primaryBorderColor: string;
  secondaryBorderColor: string;
  tertiaryBorderColor: string;
  noteBorderColor: string;
  secondaryTextColor: string;
  tertiaryTextColor: string;
  lineColor: string;
  arrowheadColor: string;
  textColor: string;
  border2: string;
  nodeBkg: string;
  mainBkg: string;
  nodeBorder: string;
  clusterBkg: string;
  clusterBorder: string;
  defaultLinkColor: string;
  titleColor: string;
  edgeLabelBackground: string;
  actorBorder: string;
  actorBkg: string;
  actorTextColor: string;
  actorLineColor: string;
  labelBoxBkgColor: string;
  signalColor: string;
  signalTextColor: string;
  labelBoxBorderColor: string;
  labelTextColor: string;
  loopTextColor: string;
  activationBorderColor: string;
  activationBkgColor: string;
  sequenceNumberColor: string;
  rectBkgColor: string;
  sectionBkgColor: string;
  altSectionBkgColor: string;
  sectionBkgColor2: string;
  excludeBkgColor: string;
  taskBorderColor: string;
  taskBkgColor: string;
  activeTaskBorderColor: string;
  activeTaskBkgColor: string;
  gridColor: string;
  doneTaskBkgColor: string;
  doneTaskBorderColor: string;
  critBorderColor: string;
  critBkgColor: string;
  todayLineColor: string;
  vertLineColor: string;
  taskTextColor: string;
  taskTextOutsideColor: string;
  taskTextLightColor: string;
  taskTextDarkColor: string;
  taskTextClickableColor: string;
  personBorder: string;
  personBkg: string;
  transitionColor: string;
  transitionLabelColor: string;
  stateLabelColor: string;
  stateBkg: string;
  labelBackgroundColor: string;
  compositeBackground: string;
  altBackground: string;
  compositeTitleBackground: string;
  innerEndBackground: string;
  errorBkgColor: string;
  errorTextColor: string;
  specialStateColor: string;
  scaleLabelColor: string;
  classText: string;
  fillType0: string;
  fillType1: string;
  fillType2: string;
  fillType3: string;
  fillType4: string;
  fillType5: string;
  fillType6: string;
  fillType7: string;
  pie1: string;
  pie2: string;
  pie3: string;
  pie4: string;
  pie5: string;
  pie6: string;
  pie7: string;
  pie8: string;
  pie9: string;
  pie10: string;
  pie11: string;
  pieTitleTextSize: string;
  pieTitleTextColor: string;
  pieSectionTextSize: string;
  pieSectionTextColor: string;
  pieLegendTextSize: string;
  pieLegendTextColor: string;
  pieStrokeColor: string;
  pieStrokeWidth: string;
  pieOuterStrokeWidth: string;
  pieOuterStrokeColor: string;
  pieOpacity: string;
  vennTitleTextColor: string;
  vennSetTextColor: string;
  archEdgeColor: string;
  archEdgeArrowColor: string;
  archEdgeWidth: string;
  archGroupBorderColor: string;
  archGroupBorderWidth: string;
  quadrant1Fill: string;
  quadrant2Fill: string;
  quadrant3Fill: string;
  quadrant4Fill: string;
  quadrant1TextFill: string;
  quadrant2TextFill: string;
  quadrant3TextFill: string;
  quadrant4TextFill: string;
  quadrantPointFill: string;
  quadrantPointTextFill: string;
  quadrantXAxisTextFill: string;
  quadrantYAxisTextFill: string;
  quadrantInternalBorderStrokeFill: string;
  quadrantExternalBorderStrokeFill: string;
  quadrantTitleFill: string;
  requirementBackground: string;
  requirementBorderColor: string;
  requirementBorderSize: string;
  requirementTextColor: string;
  relationColor: string;
  relationLabelBackground: string;
  relationLabelColor: string;
  git0: string;
  git1: string;
  git2: string;
  git3: string;
  git4: string;
  git5: string;
  git6: string;
  git7: string;
  gitInv0: string;
  gitInv1: string;
  gitInv2: string;
  gitInv3: string;
  gitInv4: string;
  gitInv5: string;
  gitInv6: string;
  gitInv7: string;
  gitBranchLabel0: string;
  gitBranchLabel1: string;
  gitBranchLabel2: string;
  gitBranchLabel3: string;
  gitBranchLabel4: string;
  gitBranchLabel5: string;
  gitBranchLabel6: string;
  gitBranchLabel7: string;
  tagLabelColor: string;
  tagLabelBackground: string;
  tagLabelBorder: string;
  tagLabelFontSize: string;
  commitLabelColor: string;
  commitLabelBackground: string;
  commitLabelFontSize: string;
  attributeBackgroundColorOdd: string;
  attributeBackgroundColorEven: string;
  gradientStart: string;
  gradientStop: string;
  cScale0: string;
  cScale1: string;
  cScale2: string;
  cScale3: string;
  cScale4: string;
  cScale5: string;
  cScale6: string;
  cScale7: string;
  cScale8: string;
  cScale9: string;
  cScale10: string;
  cScale11: string;
  cScaleInv0: string;
  cScaleInv1: string;
  cScaleInv2: string;
  cScaleInv3: string;
  cScaleInv4: string;
  cScaleInv5: string;
  cScaleInv6: string;
  cScaleInv7: string;
  cScaleInv8: string;
  cScaleInv9: string;
  cScaleInv10: string;
  cScaleInv11: string;
  cScalePeer0: string;
  cScalePeer1: string;
  cScalePeer2: string;
  cScalePeer3: string;
  cScalePeer4: string;
  cScalePeer5: string;
  cScalePeer6: string;
  cScalePeer7: string;
  cScalePeer8: string;
  cScalePeer9: string;
  cScalePeer10: string;
  cScalePeer11: string;
  cScaleLabel0: string;
  cScaleLabel1: string;
  cScaleLabel2: string;
  cScaleLabel3: string;
  cScaleLabel4: string;
  cScaleLabel5: string;
  cScaleLabel6: string;
  cScaleLabel7: string;
  cScaleLabel8: string;
  cScaleLabel9: string;
  cScaleLabel10: string;
  cScaleLabel11: string;
  surface0: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surface4: string;
  surfacePeer0: string;
  surfacePeer1: string;
  surfacePeer2: string;
  surfacePeer3: string;
  surfacePeer4: string;
  darkMode?: boolean;
  tagBorder?: string;
}

/** Theme variables shared by the classic themes (base, dark, default, forest, neutral). */
export interface ClassicThemeVariables extends CoreThemeVariables {
  noteFontWeight: string;
  fontWeight: string;
  rowOdd: string;
  rowEven: string;
  venn1: string;
  venn2: string;
  venn3: string;
  venn4: string;
  venn5: string;
  venn6: string;
  venn7: string;
  venn8: string;
  cynefin: CynefinThemeVariables;
  radar: RadarThemeVariables;
  wardleyEvolutionColor: string;
  wardley: WardleyThemeVariables;
  xyChart: XYChartThemeVariables;
  emUiFill: string;
  emUiStroke: string;
  emProcessorFill: string;
  emProcessorStroke: string;
  emReadModelFill: string;
  emReadModelStroke: string;
  emCommandFill: string;
  emCommandStroke: string;
  emEventFill: string;
  emEventStroke: string;
  emSwimlaneBackgroundOdd: string;
  emSwimlaneBackgroundStroke: string;
  emArrowhead: string;
  emRelationStroke: string;
}

/** Theme variables shared by the modern themes (neo and redux families). */
export interface ModernThemeVariables extends CoreThemeVariables {
  nodeTextColor: string;
  branchLabelColor: string;
  pie12: string;
  compositeBorder: string;
  xyChart: Omit<XYChartThemeVariables, 'dataLabelColor'>;
}

/** Theme variables shared by the neo themes (neo, neo-dark). */
export interface NeoThemeVariables extends ModernThemeVariables {
  noteFontWeight: string;
  fontWeight: string;
}

/** Theme variables shared by the redux themes (redux, redux-dark, redux-color, redux-dark-color). */
export interface ReduxThemeVariables extends ModernThemeVariables {
  noteFontWeight: number;
  fontWeight: number;
  nodeShadow: boolean;
  filterColor: string;
  commitLineColor: string;
  erEdgeLabelBackground: string;
  stateBorder: string;
}

/** Theme variables shared by the dark theme variants (dark, neo-dark, redux-dark, redux-dark-color). */
export interface DarkThemeVariables {
  border1: string;
  secondBkg: string;
  mainContrastColor: string;
  darkTextColor: string;
  labelBackground: string;
}
