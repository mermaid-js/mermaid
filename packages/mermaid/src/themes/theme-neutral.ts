// @ts-expect-error Incorrect khroma types
import { invert, darken, lighten, adjust, isDark } from 'khroma';
import { mkBorder } from './theme-helpers.js';
import type {
  CynefinThemeVariables,
  RadarThemeVariables,
  WardleyThemeVariables,
  XYChartThemeVariables,
} from './theme-helpers.js';
import {
  oldAttributeBackgroundColorEven,
  oldAttributeBackgroundColorOdd,
} from './erDiagram-oldHardcodedValues.js';

// const Color = require ( 'khroma/dist/color' ).default
// Color.format.hex.stringify(Color.parse('hsl(210, 66.6666666667%, 95%)')); // => "#EAF2FB"

type NumberedThemeKey<P extends string> = Extract<keyof Theme, `${P}${number}`>;

class Theme {
  primaryColor: string;
  contrast: string;
  secondaryColor: string;
  background: string;
  tertiaryColor: string;
  primaryBorderColor: string;
  secondaryBorderColor: string;
  tertiaryBorderColor: string;
  noteBorderColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  tertiaryTextColor: string;
  lineColor: string;
  textColor: string;
  altBackground!: string;
  mainBkg: string;
  secondBkg: string;
  border1: string;
  border2: string;
  note: string;
  text: string;
  critical: string;
  done: string;
  arrowheadColor: string;
  fontFamily: string;
  fontSize: string;
  THEME_COLOR_LIMIT: number;
  radius: number;
  strokeWidth: number;
  nodeBkg: string;
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
  signalColor: string;
  signalTextColor: string;
  labelBoxBkgColor: string;
  labelBoxBorderColor: string;
  labelTextColor: string;
  loopTextColor: string;
  noteBkgColor: string;
  noteTextColor: string;
  activationBorderColor: string;
  activationBkgColor: string;
  sequenceNumberColor: string;
  sectionBkgColor: string;
  altSectionBkgColor: string;
  sectionBkgColor2: string;
  excludeBkgColor: string;
  taskBorderColor: string;
  taskBkgColor: string;
  taskTextLightColor: string;
  taskTextColor: string;
  taskTextDarkColor: string;
  taskTextOutsideColor: string;
  taskTextClickableColor: string;
  activeTaskBorderColor: string;
  activeTaskBkgColor: string;
  gridColor: string;
  doneTaskBkgColor: string;
  doneTaskBorderColor: string;
  critBkgColor: string;
  critBorderColor: string;
  todayLineColor: string;
  vertLineColor: string;
  personBorder: string;
  personBkg: string;
  archEdgeColor: string;
  archEdgeArrowColor: string;
  archEdgeWidth: string;
  archGroupBorderColor: string;
  archGroupBorderWidth: string;
  noteFontWeight: string;
  fontWeight: string;
  rowOdd!: string;
  rowEven!: string;
  labelColor: string;
  errorBkgColor: string;
  errorTextColor: string;
  useGradient: boolean;
  gradientStart: string;
  gradientStop: string;
  dropShadow: string;
  rectBkgColor!: string;
  scaleLabelColor!: string;
  transitionColor!: string;
  transitionLabelColor!: string;
  stateLabelColor!: string;
  stateBkg!: string;
  labelBackgroundColor!: string;
  compositeBackground!: string;
  compositeTitleBackground!: string;
  stateBorder!: string;
  innerEndBackground!: string;
  specialStateColor!: string;
  classText!: string;
  fillType0!: string;
  fillType1!: string;
  fillType2!: string;
  fillType3!: string;
  fillType4!: string;
  fillType5!: string;
  fillType6!: string;
  fillType7!: string;
  pie12!: string;
  pieTitleTextSize!: string;
  pieTitleTextColor!: string;
  pieSectionTextSize!: string;
  pieSectionTextColor!: string;
  pieLegendTextSize!: string;
  pieLegendTextColor!: string;
  pieStrokeColor!: string;
  pieStrokeWidth!: string;
  pieOuterStrokeWidth!: string;
  pieOuterStrokeColor!: string;
  pieOpacity!: string;
  vennTitleTextColor!: string;
  vennSetTextColor!: string;
  cynefin!: CynefinThemeVariables;
  quadrant1Fill!: string;
  quadrant2Fill!: string;
  quadrant3Fill!: string;
  quadrant4Fill!: string;
  quadrant1TextFill!: string;
  quadrant2TextFill!: string;
  quadrant3TextFill!: string;
  quadrant4TextFill!: string;
  quadrantPointFill!: string;
  quadrantPointTextFill!: string;
  quadrantXAxisTextFill!: string;
  quadrantYAxisTextFill!: string;
  quadrantInternalBorderStrokeFill!: string;
  quadrantExternalBorderStrokeFill!: string;
  quadrantTitleFill!: string;
  xyChart!: XYChartThemeVariables;
  radar!: RadarThemeVariables;
  wardleyEvolutionColor!: string;
  wardley!: WardleyThemeVariables;
  requirementBackground!: string;
  requirementBorderColor!: string;
  requirementBorderSize!: string;
  requirementTextColor!: string;
  relationColor!: string;
  relationLabelBackground!: string;
  relationLabelColor!: string;
  git0!: string;
  git1!: string;
  git2!: string;
  git3!: string;
  git4!: string;
  git5!: string;
  git6!: string;
  git7!: string;
  gitInv0!: string;
  gitInv1!: string;
  gitInv2!: string;
  gitInv3!: string;
  gitInv4!: string;
  gitInv5!: string;
  gitInv6!: string;
  gitInv7!: string;
  branchLabelColor!: string;
  gitBranchLabel0!: string;
  gitBranchLabel1!: string;
  gitBranchLabel2!: string;
  gitBranchLabel3!: string;
  gitBranchLabel4!: string;
  gitBranchLabel5!: string;
  gitBranchLabel6!: string;
  gitBranchLabel7!: string;
  tagLabelColor!: string;
  tagLabelBackground!: string;
  tagLabelBorder!: string;
  tagLabelFontSize!: string;
  commitLabelColor!: string;
  commitLabelBackground!: string;
  commitLabelFontSize!: string;
  emUiFill!: string;
  emUiStroke!: string;
  emProcessorFill!: string;
  emProcessorStroke!: string;
  emReadModelFill!: string;
  emReadModelStroke!: string;
  emCommandFill!: string;
  emCommandStroke!: string;
  emEventFill!: string;
  emEventStroke!: string;
  emSwimlaneBackgroundOdd!: string;
  emSwimlaneBackgroundStroke!: string;
  emArrowhead!: string;
  emRelationStroke!: string;
  attributeBackgroundColorOdd!: string;
  attributeBackgroundColorEven!: string;
  cScale0!: string;
  cScale1!: string;
  cScale2!: string;
  cScale3!: string;
  cScale4!: string;
  cScale5!: string;
  cScale6!: string;
  cScale7!: string;
  cScale8!: string;
  cScale9!: string;
  cScale10!: string;
  cScale11!: string;
  cScaleInv0!: string;
  cScaleInv1!: string;
  cScaleInv2!: string;
  cScaleInv3!: string;
  cScaleInv4!: string;
  cScaleInv5!: string;
  cScaleInv6!: string;
  cScaleInv7!: string;
  cScaleInv8!: string;
  cScaleInv9!: string;
  cScaleInv10!: string;
  cScaleInv11!: string;
  cScalePeer0!: string;
  cScalePeer1!: string;
  cScalePeer2!: string;
  cScalePeer3!: string;
  cScalePeer4!: string;
  cScalePeer5!: string;
  cScalePeer6!: string;
  cScalePeer7!: string;
  cScalePeer8!: string;
  cScalePeer9!: string;
  cScalePeer10!: string;
  cScalePeer11!: string;
  cScaleLabel0!: string;
  cScaleLabel1!: string;
  cScaleLabel2!: string;
  cScaleLabel3!: string;
  cScaleLabel4!: string;
  cScaleLabel5!: string;
  cScaleLabel6!: string;
  cScaleLabel7!: string;
  cScaleLabel8!: string;
  cScaleLabel9!: string;
  cScaleLabel10!: string;
  cScaleLabel11!: string;
  surface0!: string;
  surface1!: string;
  surface2!: string;
  surface3!: string;
  surface4!: string;
  surfacePeer0!: string;
  surfacePeer1!: string;
  surfacePeer2!: string;
  surfacePeer3!: string;
  surfacePeer4!: string;
  pie0!: string;
  pie1!: string;
  pie2!: string;
  pie3!: string;
  pie4!: string;
  pie5!: string;
  pie6!: string;
  pie7!: string;
  pie8!: string;
  pie9!: string;
  pie10!: string;
  pie11!: string;
  venn1!: string;
  venn2!: string;
  venn3!: string;
  venn4!: string;
  venn5!: string;
  venn6!: string;
  venn7!: string;
  venn8!: string;
  darkMode?: boolean;
  tagBorder?: string;
  constructor() {
    this.primaryColor = '#eee';
    this.contrast = '#707070';
    this.secondaryColor = lighten(this.contrast, 55);
    this.background = '#ffffff';

    // this.secondaryColor = adjust(this.primaryColor, { h: 120 });
    this.tertiaryColor = adjust(this.primaryColor, { h: -160 });
    this.primaryBorderColor = mkBorder(this.primaryColor, this.darkMode);
    this.secondaryBorderColor = mkBorder(this.secondaryColor, this.darkMode);
    this.tertiaryBorderColor = mkBorder(this.tertiaryColor, this.darkMode);
    // this.noteBorderColor = mkBorder(this.noteBkgColor, this.darkMode);

    this.primaryTextColor = invert(this.primaryColor);
    this.secondaryTextColor = invert(this.secondaryColor);
    this.tertiaryTextColor = invert(this.tertiaryColor);
    this.lineColor = invert(this.background);
    this.textColor = invert(this.background);

    // this.altBackground = lighten(this.contrast, 55);
    this.mainBkg = '#eee';
    this.secondBkg = 'calculated';
    this.lineColor = '#666';
    this.border1 = '#999';
    this.border2 = 'calculated';
    this.note = '#ffa';
    this.text = '#333';
    this.critical = '#d42';
    this.done = '#bbb';
    this.arrowheadColor = '#333333';
    this.fontFamily = '"trebuchet ms", verdana, arial, sans-serif';
    this.fontSize = '16px';
    this.THEME_COLOR_LIMIT = 12;
    this.radius = 5;
    this.strokeWidth = 1;

    /* Flowchart variables */

    this.nodeBkg = 'calculated';
    this.nodeBorder = 'calculated';
    this.clusterBkg = 'calculated';
    this.clusterBorder = 'calculated';
    this.defaultLinkColor = 'calculated';
    this.titleColor = 'calculated';
    this.edgeLabelBackground = 'white';

    /* Sequence Diagram variables */

    this.actorBorder = 'calculated';
    this.actorBkg = 'calculated';
    this.actorTextColor = 'calculated';
    this.actorLineColor = this.actorBorder;
    this.signalColor = 'calculated';
    this.signalTextColor = 'calculated';
    this.labelBoxBkgColor = 'calculated';
    this.labelBoxBorderColor = 'calculated';
    this.labelTextColor = 'calculated';
    this.loopTextColor = 'calculated';
    this.noteBorderColor = 'calculated';
    this.noteBkgColor = 'calculated';
    this.noteTextColor = 'calculated';
    this.activationBorderColor = '#666';
    this.activationBkgColor = '#f4f4f4';
    this.sequenceNumberColor = 'white';

    /* Gantt chart variables */

    this.sectionBkgColor = 'calculated';
    this.altSectionBkgColor = 'white';
    this.sectionBkgColor2 = 'calculated';
    this.excludeBkgColor = '#eeeeee';
    this.taskBorderColor = 'calculated';
    this.taskBkgColor = 'calculated';
    this.taskTextLightColor = 'white';
    this.taskTextColor = 'calculated';
    this.taskTextDarkColor = 'calculated';
    this.taskTextOutsideColor = 'calculated';
    this.taskTextClickableColor = '#003163';
    this.activeTaskBorderColor = 'calculated';
    this.activeTaskBkgColor = 'calculated';
    this.gridColor = 'calculated';
    this.doneTaskBkgColor = 'calculated';
    this.doneTaskBorderColor = 'calculated';
    this.critBkgColor = 'calculated';
    this.critBorderColor = 'calculated';
    this.todayLineColor = 'calculated';
    this.vertLineColor = 'calculated';

    /* C4 Context Diagram variables */
    this.personBorder = this.primaryBorderColor;
    this.personBkg = this.mainBkg;

    /* Architecture Diagram variables */
    this.archEdgeColor = 'calculated';
    this.archEdgeArrowColor = 'calculated';
    this.archEdgeWidth = '3';
    this.archGroupBorderColor = this.primaryBorderColor;
    this.archGroupBorderWidth = '2px';

    this.noteFontWeight = 'normal';
    this.fontWeight = 'normal';

    /* ER diagram */
    this.rowOdd = this.rowOdd || lighten(this.mainBkg, 75) || '#ffffff';
    this.rowEven = this.rowEven || '#f4f4f4';

    /* state colors */
    this.labelColor = 'black';

    this.errorBkgColor = '#552222';
    this.errorTextColor = '#552222';
    this.useGradient = true;
    this.gradientStart = this.primaryBorderColor;
    this.gradientStop = this.secondaryBorderColor;
    this.dropShadow = 'drop-shadow( 1px 2px 2px rgba(185,185,185,1))';
  }
  updateColors() {
    this.secondBkg = lighten(this.contrast, 55);
    this.border2 = this.contrast;

    /* Sequence Diagram variables */

    this.actorBorder = lighten(this.border1, 23);
    this.actorBkg = this.mainBkg;
    this.actorTextColor = this.text;
    this.actorLineColor = this.actorBorder;
    this.rectBkgColor = this.rectBkgColor || this.tertiaryColor;
    this.signalColor = this.text;
    this.signalTextColor = this.text;
    this.labelBoxBkgColor = this.actorBkg;
    this.labelBoxBorderColor = this.actorBorder;
    this.labelTextColor = this.text;
    this.loopTextColor = this.text;
    this.noteBorderColor = '#999';
    this.noteBkgColor = '#666';
    this.noteTextColor = '#fff';

    /* Color Scale */
    /* Each color-set will have a background, a foreground and a border color */

    this.cScale0 = this.cScale0 || '#555';
    this.cScale1 = this.cScale1 || '#F4F4F4';
    this.cScale2 = this.cScale2 || '#555';
    this.cScale3 = this.cScale3 || '#BBB';
    this.cScale4 = this.cScale4 || '#777';
    this.cScale5 = this.cScale5 || '#999';
    this.cScale6 = this.cScale6 || '#DDD';
    this.cScale7 = this.cScale7 || '#FFF';
    this.cScale8 = this.cScale8 || '#DDD';
    this.cScale9 = this.cScale9 || '#BBB';
    this.cScale10 = this.cScale10 || '#999';
    this.cScale11 = this.cScale11 || '#777';

    // Setup the inverted color for the set
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this[('cScaleInv' + i) as NumberedThemeKey<'cScaleInv'>] =
        this[('cScaleInv' + i) as NumberedThemeKey<'cScaleInv'>] ||
        invert(this[('cScale' + i) as NumberedThemeKey<'cScale'>]);
    }
    // Setup the peer color for the set, useful for borders
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      if (this.darkMode) {
        this[('cScalePeer' + i) as NumberedThemeKey<'cScalePeer'>] =
          this[('cScalePeer' + i) as NumberedThemeKey<'cScalePeer'>] ||
          lighten(this[('cScale' + i) as NumberedThemeKey<'cScale'>], 10);
      } else {
        this[('cScalePeer' + i) as NumberedThemeKey<'cScalePeer'>] =
          this[('cScalePeer' + i) as NumberedThemeKey<'cScalePeer'>] ||
          darken(this[('cScale' + i) as NumberedThemeKey<'cScale'>], 10);
      }
    }

    // Setup the label color for the set
    this.scaleLabelColor = this.scaleLabelColor || (this.darkMode ? 'black' : this.labelTextColor);

    this.cScaleLabel0 = this.cScaleLabel0 || this.cScale1;
    this.cScaleLabel2 = this.cScaleLabel2 || this.cScale1;
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this[('cScaleLabel' + i) as NumberedThemeKey<'cScaleLabel'>] =
        this[('cScaleLabel' + i) as NumberedThemeKey<'cScaleLabel'>] || this.scaleLabelColor;
    }

    for (let i = 0; i < 5; i++) {
      this[('surface' + i) as NumberedThemeKey<'surface'>] =
        this[('surface' + i) as NumberedThemeKey<'surface'>] ||
        adjust(this.mainBkg, { l: -(5 + i * 5) });
      this[('surfacePeer' + i) as NumberedThemeKey<'surfacePeer'>] =
        this[('surfacePeer' + i) as NumberedThemeKey<'surfacePeer'>] ||
        adjust(this.mainBkg, { l: -(8 + i * 5) });
    }

    /* Flowchart variables */

    this.nodeBkg = this.mainBkg;
    this.nodeBorder = this.border1;
    this.clusterBkg = this.secondBkg;
    this.clusterBorder = this.border2;
    this.defaultLinkColor = this.lineColor;
    this.titleColor = this.text;

    /* Gantt chart variables */

    this.sectionBkgColor = lighten(this.contrast, 30);
    this.sectionBkgColor2 = lighten(this.contrast, 30);

    this.taskBorderColor = darken(this.contrast, 10);

    this.taskBkgColor = this.contrast;
    this.taskTextColor = this.taskTextLightColor;
    this.taskTextDarkColor = this.text;
    this.taskTextOutsideColor = this.taskTextDarkColor;
    this.activeTaskBorderColor = this.taskBorderColor;
    this.activeTaskBkgColor = this.mainBkg;
    this.gridColor = lighten(this.border1, 30);

    this.doneTaskBkgColor = this.done;
    this.doneTaskBorderColor = this.lineColor;
    this.critBkgColor = this.critical;
    this.critBorderColor = darken(this.critBkgColor, 10);

    this.todayLineColor = this.critBkgColor;
    this.vertLineColor = this.critBkgColor;

    /* Architecture Diagram variables */
    this.archEdgeColor = this.lineColor;
    this.archEdgeArrowColor = this.lineColor;

    /* state colors */
    this.transitionColor = this.transitionColor || '#000';
    this.transitionLabelColor = this.transitionLabelColor || this.textColor;
    this.stateLabelColor = this.stateLabelColor || this.stateBkg || this.primaryTextColor;

    this.stateBkg = this.stateBkg || this.mainBkg;
    this.labelBackgroundColor = this.labelBackgroundColor || this.stateBkg;
    this.compositeBackground = this.compositeBackground || this.background || this.tertiaryColor;
    this.altBackground = this.altBackground || '#f4f4f4';
    this.compositeTitleBackground = this.compositeTitleBackground || this.mainBkg;
    this.stateBorder = this.stateBorder || '#000';
    this.innerEndBackground = this.primaryBorderColor;
    this.specialStateColor = '#222';

    this.errorBkgColor = this.errorBkgColor || this.tertiaryColor;
    this.errorTextColor = this.errorTextColor || this.tertiaryTextColor;

    /* class */
    this.classText = this.primaryTextColor;
    /* journey */
    this.fillType0 = this.primaryColor;
    this.fillType1 = this.secondaryColor;
    this.fillType2 = adjust(this.primaryColor, { h: 64 });
    this.fillType3 = adjust(this.secondaryColor, { h: 64 });
    this.fillType4 = adjust(this.primaryColor, { h: -64 });
    this.fillType5 = adjust(this.secondaryColor, { h: -64 });
    this.fillType6 = adjust(this.primaryColor, { h: 128 });
    this.fillType7 = adjust(this.secondaryColor, { h: 128 });

    // /* pie */
    /* Pie diagram */
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this[('pie' + i) as NumberedThemeKey<'pie'>] =
        this[('cScale' + i) as NumberedThemeKey<'cScale'>];
    }
    this.pie12 = this.pie0;
    this.pieTitleTextSize = this.pieTitleTextSize || '25px';
    this.pieTitleTextColor = this.pieTitleTextColor || this.taskTextDarkColor;
    this.pieSectionTextSize = this.pieSectionTextSize || '17px';
    this.pieSectionTextColor = this.pieSectionTextColor || this.textColor;
    this.pieLegendTextSize = this.pieLegendTextSize || '17px';
    this.pieLegendTextColor = this.pieLegendTextColor || this.taskTextDarkColor;
    this.pieStrokeColor = this.pieStrokeColor || 'black';
    this.pieStrokeWidth = this.pieStrokeWidth || '2px';
    this.pieOuterStrokeWidth = this.pieOuterStrokeWidth || '2px';
    this.pieOuterStrokeColor = this.pieOuterStrokeColor || 'black';
    this.pieOpacity = this.pieOpacity || '0.7';

    /* venn */
    for (let i = 0; i < 8; i++) {
      this[('venn' + (i + 1)) as NumberedThemeKey<'venn'>] =
        this[('venn' + (i + 1)) as NumberedThemeKey<'venn'>] ??
        this[('cScale' + i) as NumberedThemeKey<'cScale'>];
    }
    this.vennTitleTextColor = this.vennTitleTextColor ?? this.titleColor;
    this.vennSetTextColor = this.vennSetTextColor ?? this.textColor;

    /* cynefin */
    this.cynefin = {
      domainFontSize: this.cynefin?.domainFontSize || 16,
      itemFontSize: this.cynefin?.itemFontSize || 12,
      boundaryColor: this.cynefin?.boundaryColor || this.lineColor,
      boundaryWidth: this.cynefin?.boundaryWidth || 2,
      cliffColor: this.cynefin?.cliffColor || '#8B0000',
      cliffWidth: this.cynefin?.cliffWidth || 4,
      arrowColor: this.cynefin?.arrowColor || this.lineColor,
      arrowWidth: this.cynefin?.arrowWidth || 2,
      complexBg: this.cynefin?.complexBg || '#E8F5E9',
      complicatedBg: this.cynefin?.complicatedBg || '#E3F2FD',
      chaoticBg: this.cynefin?.chaoticBg || '#FBE9E7',
      clearBg: this.cynefin?.clearBg || '#FFF8E1',
      confusionBg: this.cynefin?.confusionBg || '#F3E5F5',
      textColor: this.cynefin?.textColor || this.textColor,
      labelColor: this.cynefin?.labelColor || this.primaryTextColor,
    };

    /* quadrant-graph */
    this.quadrant1Fill = this.quadrant1Fill || this.primaryColor;
    this.quadrant2Fill = this.quadrant2Fill || adjust(this.primaryColor, { r: 5, g: 5, b: 5 });
    this.quadrant3Fill = this.quadrant3Fill || adjust(this.primaryColor, { r: 10, g: 10, b: 10 });
    this.quadrant4Fill = this.quadrant4Fill || adjust(this.primaryColor, { r: 15, g: 15, b: 15 });
    this.quadrant1TextFill = this.quadrant1TextFill || this.primaryTextColor;
    this.quadrant2TextFill =
      this.quadrant2TextFill || adjust(this.primaryTextColor, { r: -5, g: -5, b: -5 });
    this.quadrant3TextFill =
      this.quadrant3TextFill || adjust(this.primaryTextColor, { r: -10, g: -10, b: -10 });
    this.quadrant4TextFill =
      this.quadrant4TextFill || adjust(this.primaryTextColor, { r: -15, g: -15, b: -15 });
    this.quadrantPointFill =
      this.quadrantPointFill || isDark(this.quadrant1Fill)
        ? lighten(this.quadrant1Fill)
        : darken(this.quadrant1Fill);
    this.quadrantPointTextFill = this.quadrantPointTextFill || this.primaryTextColor;
    this.quadrantXAxisTextFill = this.quadrantXAxisTextFill || this.primaryTextColor;
    this.quadrantYAxisTextFill = this.quadrantYAxisTextFill || this.primaryTextColor;
    this.quadrantInternalBorderStrokeFill =
      this.quadrantInternalBorderStrokeFill || this.primaryBorderColor;
    this.quadrantExternalBorderStrokeFill =
      this.quadrantExternalBorderStrokeFill || this.primaryBorderColor;
    this.quadrantTitleFill = this.quadrantTitleFill || this.primaryTextColor;

    /* xychart */
    this.xyChart = {
      backgroundColor: this.xyChart?.backgroundColor || this.background,
      titleColor: this.xyChart?.titleColor || this.primaryTextColor,
      dataLabelColor: this.xyChart?.dataLabelColor || this.primaryTextColor,
      xAxisTitleColor: this.xyChart?.xAxisTitleColor || this.primaryTextColor,
      xAxisLabelColor: this.xyChart?.xAxisLabelColor || this.primaryTextColor,
      xAxisTickColor: this.xyChart?.xAxisTickColor || this.primaryTextColor,
      xAxisLineColor: this.xyChart?.xAxisLineColor || this.primaryTextColor,
      yAxisTitleColor: this.xyChart?.yAxisTitleColor || this.primaryTextColor,
      yAxisLabelColor: this.xyChart?.yAxisLabelColor || this.primaryTextColor,
      yAxisTickColor: this.xyChart?.yAxisTickColor || this.primaryTextColor,
      yAxisLineColor: this.xyChart?.yAxisLineColor || this.primaryTextColor,
      plotColorPalette:
        this.xyChart?.plotColorPalette ||
        '#EEE,#6BB8E4,#8ACB88,#C7ACD6,#E8DCC2,#FFB2A8,#FFF380,#7E8D91,#FFD8B1,#FAF3E0',
    };

    /* radar */
    this.radar = {
      axisColor: this.radar?.axisColor || this.lineColor,
      axisStrokeWidth: this.radar?.axisStrokeWidth || 2,
      axisLabelFontSize: this.radar?.axisLabelFontSize || 12,
      curveOpacity: this.radar?.curveOpacity || 0.5,
      curveStrokeWidth: this.radar?.curveStrokeWidth || 2,
      graticuleColor: this.radar?.graticuleColor || '#DEDEDE',
      graticuleStrokeWidth: this.radar?.graticuleStrokeWidth || 1,
      graticuleOpacity: this.radar?.graticuleOpacity || 0.3,
      legendBoxSize: this.radar?.legendBoxSize || 12,
      legendFontSize: this.radar?.legendFontSize || 12,
    };

    /* wardley */
    this.wardleyEvolutionColor = this.wardleyEvolutionColor || '#dc3545';
    this.wardley = {
      backgroundColor: this.wardley?.backgroundColor || this.background,
      axisColor: this.wardley?.axisColor || this.lineColor,
      axisTextColor: this.wardley?.axisTextColor || this.primaryTextColor,
      gridColor: this.wardley?.gridColor || this.gridColor,
      componentFill: this.wardley?.componentFill || this.background,
      componentStroke: this.wardley?.componentStroke || this.lineColor,
      componentLabelColor: this.wardley?.componentLabelColor || this.primaryTextColor,
      linkStroke: this.wardley?.linkStroke || this.lineColor,
      evolutionStroke: this.wardley?.evolutionStroke || this.wardleyEvolutionColor,
      annotationStroke: this.wardley?.annotationStroke || this.lineColor,
      annotationTextColor: this.wardley?.annotationTextColor || this.primaryTextColor,
      annotationFill: this.wardley?.annotationFill || this.background,
    };

    /* requirement-diagram */
    this.requirementBackground = this.requirementBackground || this.primaryColor;
    this.requirementBorderColor = this.requirementBorderColor || this.primaryBorderColor;
    this.requirementBorderSize = this.requirementBorderSize || '1';
    this.requirementTextColor = this.requirementTextColor || this.primaryTextColor;
    this.relationColor = this.relationColor || this.lineColor;
    this.relationLabelBackground = this.relationLabelBackground || this.edgeLabelBackground;
    this.relationLabelColor = this.relationLabelColor || this.actorTextColor;

    /* git */
    this.git0 = darken(this.pie1, 25) || this.primaryColor;
    this.git1 = this.pie2 || this.secondaryColor;
    this.git2 = this.pie3 || this.tertiaryColor;
    this.git3 = this.pie4 || adjust(this.primaryColor, { h: -30 });
    this.git4 = this.pie5 || adjust(this.primaryColor, { h: -60 });
    this.git5 = this.pie6 || adjust(this.primaryColor, { h: -90 });
    this.git6 = this.pie7 || adjust(this.primaryColor, { h: +60 });
    this.git7 = this.pie8 || adjust(this.primaryColor, { h: +120 });

    this.gitInv0 = this.gitInv0 || invert(this.git0);
    this.gitInv1 = this.gitInv1 || invert(this.git1);
    this.gitInv2 = this.gitInv2 || invert(this.git2);
    this.gitInv3 = this.gitInv3 || invert(this.git3);
    this.gitInv4 = this.gitInv4 || invert(this.git4);
    this.gitInv5 = this.gitInv5 || invert(this.git5);
    this.gitInv6 = this.gitInv6 || invert(this.git6);
    this.gitInv7 = this.gitInv7 || invert(this.git7);

    this.branchLabelColor = this.branchLabelColor || this.labelTextColor;
    this.gitBranchLabel0 = this.branchLabelColor;
    this.gitBranchLabel1 = 'white';
    this.gitBranchLabel2 = this.branchLabelColor;
    this.gitBranchLabel3 = 'white';
    this.gitBranchLabel4 = this.branchLabelColor;
    this.gitBranchLabel5 = this.branchLabelColor;
    this.gitBranchLabel6 = this.branchLabelColor;
    this.gitBranchLabel7 = this.branchLabelColor;

    this.tagLabelColor = this.tagLabelColor || this.primaryTextColor;
    this.tagLabelBackground = this.tagLabelBackground || this.primaryColor;
    this.tagLabelBorder = this.tagBorder || this.primaryBorderColor;
    this.tagLabelFontSize = this.tagLabelFontSize || '10px';
    this.commitLabelColor = this.commitLabelColor || this.secondaryTextColor;
    this.commitLabelBackground = this.commitLabelBackground || this.secondaryColor;
    this.commitLabelFontSize = this.commitLabelFontSize || '10px';

    /* -------------------------------------------------- */
    /* Event Modeling diagrams                             */

    this.emUiFill = this.emUiFill || 'white';
    this.emUiStroke = this.emUiStroke || '#dbdada';
    this.emProcessorFill = this.emProcessorFill || '#edb3f6';
    this.emProcessorStroke = this.emProcessorStroke || '#b88cbf';
    this.emReadModelFill = this.emReadModelFill || '#d3f1a2';
    this.emReadModelStroke = this.emReadModelStroke || '#a3b732';
    this.emCommandFill = this.emCommandFill || '#bcd6fe';
    this.emCommandStroke = this.emCommandStroke || '#679ac3';
    this.emEventFill = this.emEventFill || '#ffb778';
    this.emEventStroke = this.emEventStroke || '#c19a0f';
    this.emSwimlaneBackgroundOdd = this.emSwimlaneBackgroundOdd || 'rgb(250,250,250)';
    this.emSwimlaneBackgroundStroke = this.emSwimlaneBackgroundStroke || 'rgb(240,240,240)';
    this.emArrowhead = this.emArrowhead || this.lineColor;
    this.emRelationStroke = this.emRelationStroke || this.lineColor;

    /* -------------------------------------------------- */
    /* EntityRelationship diagrams                        */

    this.attributeBackgroundColorOdd =
      this.attributeBackgroundColorOdd || oldAttributeBackgroundColorOdd;
    this.attributeBackgroundColorEven =
      this.attributeBackgroundColorEven || oldAttributeBackgroundColorEven;
    /* -------------------------------------------------- */
  }
  calculate(overrides?: Partial<Theme>) {
    if (typeof overrides !== 'object') {
      // Calculate colors form base colors
      this.updateColors();
      return;
    }

    const keys = Object.keys(overrides) as (keyof Theme)[];

    // Copy values from overrides, this is mainly for base colors
    keys.forEach((k) => {
      this[k] = overrides[k] as never;
    });

    // Calculate colors form base colors
    this.updateColors();
    // Copy values from overrides again in case of an override of derived value
    keys.forEach((k) => {
      this[k] = overrides[k] as never;
    });
  }
}

export const getThemeVariables = (userOverrides?: Partial<Theme>): Theme => {
  const theme = new Theme();
  theme.calculate(userOverrides);
  return theme;
};
