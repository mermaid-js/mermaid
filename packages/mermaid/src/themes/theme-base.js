import { adjust, darken, invert, isDark, lighten } from 'khroma';
import {
  oldAttributeBackgroundColorEven,
  oldAttributeBackgroundColorOdd,
} from './erDiagram-oldHardcodedValues.js';
import { mkBorder } from './theme-helpers.js';

class Theme {
  constructor() {
    /** # Base variables */
    /**
     * - Background - used to know what the background color is of the diagram. This is used for
     *   deducing colors for instance line color. Default value is #f4f4f4.
     */
    this.background = '#f4f4f4';

    this.primaryColor = '#fff4dd';

    this.noteBkgColor = '#fff5ad';
    this.noteTextColor = '#333';

    this.THEME_COLOR_LIMIT = 12;
    this.radius = 5;
    this.strokeWidth = 1;
    // dark

    this.fontFamily = '"trebuchet ms", verdana, arial, sans-serif';
    this.fontSize = '16px';
    this.useGradient = true;
    this.dropShadow = 'drop-shadow( 1px 2px 2px rgba(185,185,185,1))';
  }
  updateColors() {
    // The || is to make sure that if the variable has been defined by a user override that value is to be used

    /* Main */
    this.primaryTextColor = this.primaryTextColor || (this.darkMode ? '#eee' : '#333'); // invert(this.primaryColor);
    this.secondaryColor = this.secondaryColor || adjust(this.primaryColor, { h: -120 });
    this.tertiaryColor = this.tertiaryColor || adjust(this.primaryColor, { h: 180, l: 5 });

    this.primaryBorderColor = this.primaryBorderColor || mkBorder(this.primaryColor, this.darkMode);
    this.secondaryBorderColor =
      this.secondaryBorderColor || mkBorder(this.secondaryColor, this.darkMode);
    this.tertiaryBorderColor =
      this.tertiaryBorderColor || mkBorder(this.tertiaryColor, this.darkMode);
    this.noteBorderColor = this.noteBorderColor || mkBorder(this.noteBkgColor, this.darkMode);
    this.noteBkgColor = this.noteBkgColor || '#fff5ad';
    this.noteTextColor = this.noteTextColor || '#333';

    this.secondaryTextColor = this.secondaryTextColor || invert(this.secondaryColor);
    this.tertiaryTextColor = this.tertiaryTextColor || invert(this.tertiaryColor);
    this.lineColor = this.lineColor || invert(this.background);
    this.arrowheadColor = this.arrowheadColor || invert(this.background);
    this.textColor = this.textColor || this.primaryTextColor;

    // TODO: should this instead default to secondaryBorderColor?
    this.border2 = this.border2 || this.tertiaryBorderColor;

    /* Flowchart variables */
    this.nodeBkg = this.nodeBkg || this.primaryColor;
    this.mainBkg = this.mainBkg || this.primaryColor;
    this.nodeBorder = this.nodeBorder || this.primaryBorderColor;
    this.clusterBkg = this.clusterBkg || this.tertiaryColor;
    this.clusterBorder = this.clusterBorder || this.tertiaryBorderColor;
    this.defaultLinkColor = this.defaultLinkColor || this.lineColor;
    this.titleColor = this.titleColor || this.tertiaryTextColor;
    this.edgeLabelBackground =
      this.edgeLabelBackground ||
      (this.darkMode ? darken(this.secondaryColor, 30) : this.secondaryColor);
    this.nodeTextColor = this.nodeTextColor || this.primaryTextColor;
    /* Sequence Diagram variables */

    // this.actorBorder = lighten(this.border1, 0.5);
    this.actorBorder = this.actorBorder || this.primaryBorderColor;
    this.actorBkg = this.actorBkg || this.mainBkg;
    this.actorTextColor = this.actorTextColor || this.primaryTextColor;
    this.actorLineColor = this.actorLineColor || this.actorBorder;
    this.labelBoxBkgColor = this.labelBoxBkgColor || this.actorBkg;
    this.signalColor = this.signalColor || this.textColor;
    this.signalTextColor = this.signalTextColor || this.textColor;
    this.labelBoxBorderColor = this.labelBoxBorderColor || this.actorBorder;
    this.labelTextColor = this.labelTextColor || this.actorTextColor;
    this.loopTextColor = this.loopTextColor || this.actorTextColor;
    this.activationBorderColor = this.activationBorderColor || darken(this.secondaryColor, 10);
    this.activationBkgColor = this.activationBkgColor || this.secondaryColor;
    this.sequenceNumberColor = this.sequenceNumberColor || invert(this.lineColor);

    /* Gantt chart variables */

    this.sectionBkgColor = this.sectionBkgColor || this.tertiaryColor;
    this.altSectionBkgColor = this.altSectionBkgColor || 'white';
    this.sectionBkgColor = this.sectionBkgColor || this.secondaryColor;
    this.sectionBkgColor2 = this.sectionBkgColor2 || this.primaryColor;
    this.excludeBkgColor = this.excludeBkgColor || '#eeeeee';
    this.taskBorderColor = this.taskBorderColor || this.primaryBorderColor;
    this.taskBkgColor = this.taskBkgColor || this.primaryColor;
    this.activeTaskBorderColor = this.activeTaskBorderColor || this.primaryColor;
    this.activeTaskBkgColor = this.activeTaskBkgColor || lighten(this.primaryColor, 23);
    this.gridColor = this.gridColor || 'lightgrey';
    this.doneTaskBkgColor = this.doneTaskBkgColor || 'lightgrey';
    this.doneTaskBorderColor = this.doneTaskBorderColor || 'grey';
    this.critBorderColor = this.critBorderColor || '#ff8888';
    this.critBkgColor = this.critBkgColor || 'red';
    this.todayLineColor = this.todayLineColor || 'red';
    this.vertLineColor = this.vertLineColor || 'navy';
    this.taskTextColor = this.taskTextColor || this.textColor;
    this.taskTextOutsideColor = this.taskTextOutsideColor || this.textColor;
    this.taskTextLightColor = this.taskTextLightColor || this.textColor;
    this.taskTextColor = this.taskTextColor || this.primaryTextColor;
    this.taskTextDarkColor = this.taskTextDarkColor || this.textColor;
    this.taskTextClickableColor = this.taskTextClickableColor || '#003163';

    this.noteFontWeight = this.noteFontWeight || 'normal';
    this.fontWeight = this.fontWeight || 'normal';

    /* Sequence Diagram variables */

    this.personBorder = this.personBorder || this.primaryBorderColor;
    this.personBkg = this.personBkg || this.mainBkg;
    this.personExtBorder = this.personExtBorder || this.primaryBorderColor;
    this.personExtBkg = this.personExtBkg || this.mainBkg;
    this.systemBorder = this.systemBorder || this.primaryBorderColor;
    this.systemBkg = this.systemBkg || this.mainBkg;
    this.systemDbBorder = this.systemDbBorder || this.primaryBorderColor;
    this.systemDbBkg = this.systemDbBkg || this.mainBkg;
    this.systemQueueBorder = this.systemQueueBorder || this.primaryBorderColor;
    this.systemQueueBkg = this.systemQueueBkg || this.mainBkg;
    this.systemExtBorder = this.systemExtBorder || this.primaryBorderColor;
    this.systemExtBkg = this.systemExtBkg || this.mainBkg;
    this.systemExtDbBorder = this.systemExtDbBorder || this.primaryBorderColor;
    this.systemExtDbBkg = this.systemExtDbBkg || this.mainBkg;
    this.systemExtQueueBorder = this.systemExtQueueBorder || this.primaryBorderColor;
    this.systemExtQueueBkg = this.systemExtQueueBkg || this.mainBkg;
    this.containerBorder = this.containerBorder || this.primaryBorderColor;
    this.containerBkg = this.containerBkg || this.mainBkg;
    this.containerDbBorder = this.containerDbBorder || this.primaryBorderColor;
    this.containerDbBkg = this.containerDbBkg || this.mainBkg;
    this.containerQueueBorder = this.containerQueueBorder || this.primaryBorderColor;
    this.containerQueueBkg = this.containerQueueBkg || this.mainBkg;
    this.containerExtBorder = this.containerExtBorder || this.primaryBorderColor;
    this.containerExtBkg = this.containerExtBkg || this.mainBkg;
    this.containerExtDbBorder = this.containerExtDbBorder || this.primaryBorderColor;
    this.containerExtDbBkg = this.containerExtDbBkg || this.mainBkg;
    this.containerExtQueueBorder = this.containerExtQueueBorder || this.primaryBorderColor;
    this.containerExtQueueBkg = this.containerExtQueueBkg || this.mainBkg;
    this.componentBorder = this.componentBorder || this.primaryBorderColor;
    this.componentBkg = this.componentBkg || this.mainBkg;
    this.componentDbBorder = this.componentDbBorder || this.primaryBorderColor;
    this.componentDbBkg = this.componentDbBkg || this.mainBkg;
    this.componentQueueBorder = this.componentQueueBorder || this.primaryBorderColor;
    this.componentQueueBkg = this.componentQueueBkg || this.mainBkg;
    this.componentExtBorder = this.componentExtBorder || this.primaryBorderColor;
    this.componentExtBkg = this.componentExtBkg || this.mainBkg;
    this.componentExtDbBorder = this.componentExtDbBorder || this.primaryBorderColor;
    this.componentExtDbBkg = this.componentExtDbBkg || this.mainBkg;
    this.componentExtQueueBorder = this.componentExtQueueBorder || this.primaryBorderColor;
    this.componentExtQueueBkg = this.componentExtQueueBkg || this.mainBkg;

    /* ER diagram */

    if (this.darkMode) {
      this.rowOdd = this.rowOdd || darken(this.mainBkg, 5) || '#ffffff';
      this.rowEven = this.rowEven || darken(this.mainBkg, 10);
    } else {
      this.rowOdd = this.rowOdd || lighten(this.mainBkg, 75) || '#ffffff';
      this.rowEven = this.rowEven || lighten(this.mainBkg, 5);
    }

    /* state colors */
    this.transitionColor = this.transitionColor || this.lineColor;
    this.transitionLabelColor = this.transitionLabelColor || this.textColor;
    /* The color of the text tables of the states*/
    this.stateLabelColor = this.stateLabelColor || this.stateBkg || this.primaryTextColor;

    this.stateBkg = this.stateBkg || this.mainBkg;
    this.labelBackgroundColor = this.labelBackgroundColor || this.stateBkg;
    this.compositeBackground = this.compositeBackground || this.background || this.tertiaryColor;
    this.altBackground = this.altBackground || this.tertiaryColor;
    this.compositeTitleBackground = this.compositeTitleBackground || this.mainBkg;
    this.compositeBorder = this.compositeBorder || this.nodeBorder;
    this.innerEndBackground = this.nodeBorder;
    this.errorBkgColor = this.errorBkgColor || this.tertiaryColor;
    this.errorTextColor = this.errorTextColor || this.tertiaryTextColor;
    this.transitionColor = this.transitionColor || this.lineColor;
    this.specialStateColor = this.lineColor;

    /* Color Scale */
    /* Each color-set will have a background, a foreground and a border color */
    this.cScale0 = this.cScale0 || this.primaryColor;
    this.cScale1 = this.cScale1 || this.secondaryColor;
    this.cScale2 = this.cScale2 || this.tertiaryColor;
    this.cScale3 = this.cScale3 || adjust(this.primaryColor, { h: 30 });
    this.cScale4 = this.cScale4 || adjust(this.primaryColor, { h: 60 });
    this.cScale5 = this.cScale5 || adjust(this.primaryColor, { h: 90 });
    this.cScale6 = this.cScale6 || adjust(this.primaryColor, { h: 120 });
    this.cScale7 = this.cScale7 || adjust(this.primaryColor, { h: 150 });
    this.cScale8 = this.cScale8 || adjust(this.primaryColor, { h: 210, l: 150 });
    this.cScale9 = this.cScale9 || adjust(this.primaryColor, { h: 270 });
    this.cScale10 = this.cScale10 || adjust(this.primaryColor, { h: 300 });
    this.cScale11 = this.cScale11 || adjust(this.primaryColor, { h: 330 });
    if (this.darkMode) {
      for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
        this['cScale' + i] = darken(this['cScale' + i], 75);
      }
    } else {
      for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
        this['cScale' + i] = darken(this['cScale' + i], 25);
      }
    }

    // Setup the inverted color for the set
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this['cScaleInv' + i] = this['cScaleInv' + i] || invert(this['cScale' + i]);
    }
    // Setup the peer color for the set, useful for borders
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      if (this.darkMode) {
        this['cScalePeer' + i] = this['cScalePeer' + i] || lighten(this['cScale' + i], 10);
      } else {
        this['cScalePeer' + i] = this['cScalePeer' + i] || darken(this['cScale' + i], 10);
      }
    }

    // Setup the label color for the set
    this.scaleLabelColor = this.scaleLabelColor || this.labelTextColor;

    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this['cScaleLabel' + i] = this['cScaleLabel' + i] || this.scaleLabelColor;
    }

    const multiplier = this.darkMode ? -4 : -1;
    for (let i = 0; i < 5; i++) {
      this['surface' + i] =
        this['surface' + i] ||
        adjust(this.mainBkg, { h: 180, s: -15, l: multiplier * (5 + i * 3) });
      this['surfacePeer' + i] =
        this['surfacePeer' + i] ||
        adjust(this.mainBkg, { h: 180, s: -15, l: multiplier * (8 + i * 3) });
    }

    /* class */
    this.classText = this.classText || this.textColor;

    /* user-journey */
    this.fillType0 = this.fillType0 || this.primaryColor;
    this.fillType1 = this.fillType1 || this.secondaryColor;
    this.fillType2 = this.fillType2 || adjust(this.primaryColor, { h: 64 });
    this.fillType3 = this.fillType3 || adjust(this.secondaryColor, { h: 64 });
    this.fillType4 = this.fillType4 || adjust(this.primaryColor, { h: -64 });
    this.fillType5 = this.fillType5 || adjust(this.secondaryColor, { h: -64 });
    this.fillType6 = this.fillType6 || adjust(this.primaryColor, { h: 128 });
    this.fillType7 = this.fillType7 || adjust(this.secondaryColor, { h: 128 });

    /* pie */
    this.pie1 = this.pie1 || this.primaryColor;
    this.pie2 = this.pie2 || this.secondaryColor;
    this.pie3 = this.pie3 || this.tertiaryColor;
    this.pie4 = this.pie4 || adjust(this.primaryColor, { l: -10 });
    this.pie5 = this.pie5 || adjust(this.secondaryColor, { l: -10 });
    this.pie6 = this.pie6 || adjust(this.tertiaryColor, { l: -10 });
    this.pie7 = this.pie7 || adjust(this.primaryColor, { h: +60, l: -10 });
    this.pie8 = this.pie8 || adjust(this.primaryColor, { h: -60, l: -10 });
    this.pie9 = this.pie9 || adjust(this.primaryColor, { h: 120, l: 0 });
    this.pie10 = this.pie10 || adjust(this.primaryColor, { h: +60, l: -20 });
    this.pie11 = this.pie11 || adjust(this.primaryColor, { h: -60, l: -20 });
    this.pie12 = this.pie12 || adjust(this.primaryColor, { h: 120, l: -10 });
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
    this.venn1 = this.venn1 ?? adjust(this.primaryColor, { l: -30 });
    this.venn2 = this.venn2 ?? adjust(this.secondaryColor, { l: -30 });
    this.venn3 = this.venn3 ?? adjust(this.tertiaryColor, { l: -30 });
    this.venn4 = this.venn4 ?? adjust(this.primaryColor, { h: 60, l: -30 });
    this.venn5 = this.venn5 ?? adjust(this.primaryColor, { h: -60, l: -30 });
    this.venn6 = this.venn6 ?? adjust(this.secondaryColor, { h: 60, l: -30 });
    this.venn7 = this.venn7 ?? adjust(this.primaryColor, { h: 120, l: -30 });
    this.venn8 = this.venn8 ?? adjust(this.secondaryColor, { h: 120, l: -30 });
    this.vennTitleTextColor = this.vennTitleTextColor ?? this.titleColor;
    this.vennSetTextColor = this.vennSetTextColor ?? this.textColor;

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

    /* architecture */
    this.archEdgeColor = this.archEdgeColor || '#777';
    this.archEdgeArrowColor = this.archEdgeArrowColor || '#777';
    this.archEdgeWidth = this.archEdgeWidth || '3';
    this.archGroupBorderColor = this.archGroupBorderColor || '#000';
    this.archGroupBorderWidth = this.archGroupBorderWidth || '2px';

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
        '#FFF4DD,#FFD8B1,#FFA07A,#ECEFF1,#D6DBDF,#C3E0A8,#FFB6A4,#FFD74D,#738FA7,#FFFFF0',
    };

    /* requirement-diagram */
    this.requirementBackground = this.requirementBackground || this.primaryColor;
    this.requirementBorderColor = this.requirementBorderColor || this.primaryBorderColor;
    this.requirementBorderSize = this.requirementBorderSize || '1';
    this.requirementTextColor = this.requirementTextColor || this.primaryTextColor;
    this.relationColor = this.relationColor || this.lineColor;
    this.relationLabelBackground =
      this.relationLabelBackground ||
      (this.darkMode ? darken(this.secondaryColor, 30) : this.secondaryColor);
    this.relationLabelColor = this.relationLabelColor || this.actorTextColor;

    /* git */
    this.git0 = this.git0 || this.primaryColor;
    this.git1 = this.git1 || this.secondaryColor;
    this.git2 = this.git2 || this.tertiaryColor;
    this.git3 = this.git3 || adjust(this.primaryColor, { h: -30 });
    this.git4 = this.git4 || adjust(this.primaryColor, { h: -60 });
    this.git5 = this.git5 || adjust(this.primaryColor, { h: -90 });
    this.git6 = this.git6 || adjust(this.primaryColor, { h: +60 });
    this.git7 = this.git7 || adjust(this.primaryColor, { h: +120 });
    if (this.darkMode) {
      this.git0 = lighten(this.git0, 25);
      this.git1 = lighten(this.git1, 25);
      this.git2 = lighten(this.git2, 25);
      this.git3 = lighten(this.git3, 25);
      this.git4 = lighten(this.git4, 25);
      this.git5 = lighten(this.git5, 25);
      this.git6 = lighten(this.git6, 25);
      this.git7 = lighten(this.git7, 25);
    } else {
      this.git0 = darken(this.git0, 25);
      this.git1 = darken(this.git1, 25);
      this.git2 = darken(this.git2, 25);
      this.git3 = darken(this.git3, 25);
      this.git4 = darken(this.git4, 25);
      this.git5 = darken(this.git5, 25);
      this.git6 = darken(this.git6, 25);
      this.git7 = darken(this.git7, 25);
    }
    this.gitInv0 = this.gitInv0 || invert(this.git0);
    this.gitInv1 = this.gitInv1 || invert(this.git1);
    this.gitInv2 = this.gitInv2 || invert(this.git2);
    this.gitInv3 = this.gitInv3 || invert(this.git3);
    this.gitInv4 = this.gitInv4 || invert(this.git4);
    this.gitInv5 = this.gitInv5 || invert(this.git5);
    this.gitInv6 = this.gitInv6 || invert(this.git6);
    this.gitInv7 = this.gitInv7 || invert(this.git7);
    this.branchLabelColor =
      this.branchLabelColor || (this.darkMode ? 'black' : this.labelTextColor);
    this.gitBranchLabel0 = this.gitBranchLabel0 || this.branchLabelColor;
    this.gitBranchLabel1 = this.gitBranchLabel1 || this.branchLabelColor;
    this.gitBranchLabel2 = this.gitBranchLabel2 || this.branchLabelColor;
    this.gitBranchLabel3 = this.gitBranchLabel3 || this.branchLabelColor;
    this.gitBranchLabel4 = this.gitBranchLabel4 || this.branchLabelColor;
    this.gitBranchLabel5 = this.gitBranchLabel5 || this.branchLabelColor;
    this.gitBranchLabel6 = this.gitBranchLabel6 || this.branchLabelColor;
    this.gitBranchLabel7 = this.gitBranchLabel7 || this.branchLabelColor;

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

    /* C4 Diagram Variables */
    this.c4NodeTextColor = this.c4NodeTextColor || this.primaryTextColor;

    this.gradientStart = this.primaryBorderColor;
    this.gradientStop = this.secondaryBorderColor;
  }
  calculate(overrides) {
    if (typeof overrides !== 'object') {
      // Calculate colors form base colors
      this.updateColors();
      return;
    }

    const keys = Object.keys(overrides);

    // Copy values from overrides, this is mainly for base colors
    keys.forEach((k) => {
      this[k] = overrides[k];
    });

    // Calculate colors form base colors
    this.updateColors();
    // Copy values from overrides again in case of an override of derived value
    keys.forEach((k) => {
      this[k] = overrides[k];
    });
  }
}

export const getThemeVariables = (userOverrides) => {
  const theme = new Theme();
  theme.calculate(userOverrides);
  return theme;
};
