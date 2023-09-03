import { invert, lighten, rgba, adjust, darken, isDark } from 'khroma';
import { mkBorder } from './theme-helpers.js';
import {
  oldAttributeBackgroundColorEven,
  oldAttributeBackgroundColorOdd,
} from './erDiagram-oldHardcodedValues.js';

class Theme {
  constructor() {
    /* Base variables */
    this.background = '#f4f4f4';
    this.primaryColor = '#ECECFF';

    this.secondaryColor = adjust(this.primaryColor, { h: 120 });
    this.secondaryColor = '#ffffde';
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

    this.background = 'white';
    this.mainBkg = '#ECECFF';
    this.secondBkg = '#ffffde';
    this.lineColor = '#333333';
    this.border1 = '#9370DB';
    this.border2 = '#aaaa33';
    this.arrowheadColor = '#333333';
    this.fontFamily = '"trebuchet ms", verdana, arial, sans-serif';
    this.fontSize = '16px';
    this.labelBackground = '#e8e8e8';
    this.textColor = '#333';
    this.THEME_COLOR_LIMIT = 12;

    /* Flowchart variables */

    this.nodeBkg = 'calculated';
    this.nodeBorder = 'calculated';
    this.clusterBkg = 'calculated';
    this.clusterBorder = 'calculated';
    this.defaultLinkColor = 'calculated';
    this.titleColor = 'calculated';
    this.edgeLabelBackground = 'calculated';

    /* Sequence Diagram variables */

    this.actorBorder = 'calculated';
    this.actorBkg = 'calculated';
    this.actorTextColor = 'black';
    this.actorLineColor = 'grey';
    this.signalColor = 'calculated';
    this.signalTextColor = 'calculated';
    this.labelBoxBkgColor = 'calculated';
    this.labelBoxBorderColor = 'calculated';
    this.labelTextColor = 'calculated';
    this.loopTextColor = 'calculated';
    this.noteBorderColor = 'calculated';
    this.noteBkgColor = '#fff5ad';
    this.noteTextColor = 'calculated';
    this.activationBorderColor = '#666';
    this.activationBkgColor = '#f4f4f4';
    this.sequenceNumberColor = 'white';

    /* Gantt chart variables */

    this.sectionBkgColor = 'calculated';
    this.altSectionBkgColor = 'calculated';
    this.sectionBkgColor2 = 'calculated';
    this.excludeBkgColor = '#eeeeee';
    this.taskBorderColor = 'calculated';
    this.taskBkgColor = 'calculated';
    this.taskTextLightColor = 'calculated';
    this.taskTextColor = this.taskTextLightColor;
    this.taskTextDarkColor = 'calculated';
    this.taskTextOutsideColor = this.taskTextDarkColor;
    this.taskTextClickableColor = 'calculated';
    this.activeTaskBorderColor = 'calculated';
    this.activeTaskBkgColor = 'calculated';
    this.gridColor = 'calculated';
    this.doneTaskBkgColor = 'calculated';
    this.doneTaskBorderColor = 'calculated';
    this.critBorderColor = 'calculated';
    this.critBkgColor = 'calculated';
    this.todayLineColor = 'calculated';

    this.sectionBkgColor = rgba(102, 102, 255, 0.49);
    this.altSectionBkgColor = 'white';
    this.sectionBkgColor2 = '#fff400';
    this.taskBorderColor = '#534fbc';
    this.taskBkgColor = '#8a90dd';
    this.taskTextLightColor = 'white';
    this.taskTextColor = 'calculated';
    this.taskTextDarkColor = 'black';
    this.taskTextOutsideColor = 'calculated';
    this.taskTextClickableColor = '#003163';
    this.activeTaskBorderColor = '#534fbc';
    this.activeTaskBkgColor = '#bfc7ff';
    this.gridColor = 'lightgrey';
    this.doneTaskBkgColor = 'lightgrey';
    this.doneTaskBorderColor = 'grey';
    this.critBorderColor = '#ff8888';
    this.critBkgColor = 'red';
    this.todayLineColor = 'red';

    /* C4 Context Diagram variables */
    this.personBorder = this.primaryBorderColor;
    this.personBkg = this.mainBkg;

    /* state colors */
    this.labelColor = 'black';
    this.errorBkgColor = '#552222';
    this.errorTextColor = '#552222';
    this.updateColors();
  }
  updateColors() {
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
    this.cScale8 = this.cScale8 || adjust(this.primaryColor, { h: 210 });
    this.cScale9 = this.cScale9 || adjust(this.primaryColor, { h: 270 });
    this.cScale10 = this.cScale10 || adjust(this.primaryColor, { h: 300 });
    this.cScale11 = this.cScale11 || adjust(this.primaryColor, { h: 330 });
    this['cScalePeer' + 1] = this['cScalePeer' + 1] || darken(this.secondaryColor, 45);
    this['cScalePeer' + 2] = this['cScalePeer' + 2] || darken(this.tertiaryColor, 40);
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      // Setup the peer color for the set, useful for borders
      this['cScale' + i] = darken(this['cScale' + i], 10);
      this['cScalePeer' + i] = this['cScalePeer' + i] || darken(this['cScale' + i], 25);
    }
    // Setup the inverted color for the set
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this['cScaleInv' + i] = this['cScaleInv' + i] || adjust(this['cScale' + i], { h: 180 });
    }

    for (let i = 0; i < 5; i++) {
      this['surface' + i] = this['surface' + i] || adjust(this.mainBkg, { h: 30, l: -(5 + i * 5) });
      this['surfacePeer' + i] =
        this['surfacePeer' + i] || adjust(this.mainBkg, { h: 30, l: -(7 + i * 5) });
    }
    // Setup the label color for the set
    this.scaleLabelColor =
      this.scaleLabelColor !== 'calculated' && this.scaleLabelColor
        ? this.scaleLabelColor
        : this.labelTextColor;

    if (this.labelTextColor !== 'calculated') {
      this.cScaleLabel0 = this.cScaleLabel0 || invert(this.labelTextColor);
      this.cScaleLabel3 = this.cScaleLabel3 || invert(this.labelTextColor);
      for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
        this['cScaleLabel' + i] = this['cScaleLabel' + i] || this.labelTextColor;
      }
    }

    /* Flowchart variables */
    this.nodeBkg = this.mainBkg;
    this.nodeBorder = this.border1; // border 1
    this.clusterBkg = this.secondBkg;
    this.clusterBorder = this.border2;
    this.defaultLinkColor = this.lineColor;
    this.titleColor = this.textColor;
    this.edgeLabelBackground = this.labelBackground;

    /* Sequence Diagram variables */

    // this.actorBorder = lighten(this.border1, 0.5);
    this.actorBorder = lighten(this.border1, 23);
    this.actorBkg = this.mainBkg;
    this.labelBoxBkgColor = this.actorBkg;
    this.signalColor = this.textColor;
    this.signalTextColor = this.textColor;
    this.labelBoxBorderColor = this.actorBorder;
    this.labelTextColor = this.actorTextColor;
    this.loopTextColor = this.actorTextColor;
    this.noteBorderColor = this.border2;
    this.noteTextColor = this.actorTextColor;

    /* Gantt chart variables */

    this.taskTextColor = this.taskTextLightColor;
    this.taskTextOutsideColor = this.taskTextDarkColor;

    /* state colors */
    this.transitionColor = this.transitionColor || this.lineColor;
    this.transitionLabelColor = this.transitionLabelColor || this.textColor;
    this.stateLabelColor = this.stateLabelColor || this.stateBkg || this.primaryTextColor;

    this.stateBkg = this.stateBkg || this.mainBkg;
    this.labelBackgroundColor = this.labelBackgroundColor || this.stateBkg;
    this.compositeBackground = this.compositeBackground || this.background || this.tertiaryColor;
    this.altBackground = this.altBackground || '#f0f0f0';
    this.compositeTitleBackground = this.compositeTitleBackground || this.mainBkg;
    this.compositeBorder = this.compositeBorder || this.nodeBorder;
    this.innerEndBackground = this.nodeBorder;
    this.specialStateColor = this.lineColor;

    this.errorBkgColor = this.errorBkgColor || this.tertiaryColor;
    this.errorTextColor = this.errorTextColor || this.tertiaryTextColor;
    this.transitionColor = this.transitionColor || this.lineColor;
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

    /* pie */
    this.pie1 = this.pie1 || this.primaryColor;
    this.pie2 = this.pie2 || this.secondaryColor;
    this.pie3 = this.pie3 || adjust(this.tertiaryColor, { l: -40 });
    this.pie4 = this.pie4 || adjust(this.primaryColor, { l: -10 });
    this.pie5 = this.pie5 || adjust(this.secondaryColor, { l: -30 });
    this.pie6 = this.pie6 || adjust(this.tertiaryColor, { l: -20 });
    this.pie7 = this.pie7 || adjust(this.primaryColor, { h: +60, l: -20 });
    this.pie8 = this.pie8 || adjust(this.primaryColor, { h: -60, l: -40 });
    this.pie9 = this.pie9 || adjust(this.primaryColor, { h: 120, l: -40 });
    this.pie10 = this.pie10 || adjust(this.primaryColor, { h: +60, l: -40 });
    this.pie11 = this.pie11 || adjust(this.primaryColor, { h: -90, l: -40 });
    this.pie12 = this.pie12 || adjust(this.primaryColor, { h: 120, l: -30 });
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
        '#ECECFF,#8493A6,#FFC3A0,#DCDDE1,#B8E994,#D1A36F,#C3CDE6,#FFB6C1,#496078,#F8F3E3',
    };

    /* requirement-diagram */
    this.requirementBackground = this.requirementBackground || this.primaryColor;
    this.requirementBorderColor = this.requirementBorderColor || this.primaryBorderColor;
    this.requirementBorderSize = this.requirementBorderSize || '1';
    this.requirementTextColor = this.requirementTextColor || this.primaryTextColor;
    this.relationColor = this.relationColor || this.lineColor;
    this.relationLabelBackground = this.relationLabelBackground || this.labelBackground;
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
    this.gitInv0 = this.gitInv0 || darken(invert(this.git0), 25);
    this.gitInv1 = this.gitInv1 || invert(this.git1);
    this.gitInv2 = this.gitInv2 || invert(this.git2);
    this.gitInv3 = this.gitInv3 || invert(this.git3);
    this.gitInv4 = this.gitInv4 || invert(this.git4);
    this.gitInv5 = this.gitInv5 || invert(this.git5);
    this.gitInv6 = this.gitInv6 || invert(this.git6);
    this.gitInv7 = this.gitInv7 || invert(this.git7);
    this.gitBranchLabel0 = this.gitBranchLabel0 || invert(this.labelTextColor);
    this.gitBranchLabel1 = this.gitBranchLabel1 || this.labelTextColor;
    this.gitBranchLabel2 = this.gitBranchLabel2 || this.labelTextColor;
    this.gitBranchLabel3 = this.gitBranchLabel3 || invert(this.labelTextColor);
    this.gitBranchLabel4 = this.gitBranchLabel4 || this.labelTextColor;
    this.gitBranchLabel5 = this.gitBranchLabel5 || this.labelTextColor;
    this.gitBranchLabel6 = this.gitBranchLabel6 || this.labelTextColor;
    this.gitBranchLabel7 = this.gitBranchLabel7 || this.labelTextColor;

    this.tagLabelColor = this.tagLabelColor || this.primaryTextColor;
    this.tagLabelBackground = this.tagLabelBackground || this.primaryColor;
    this.tagLabelBorder = this.tagBorder || this.primaryBorderColor;
    this.tagLabelFontSize = this.tagLabelFontSize || '10px';
    this.commitLabelColor = this.commitLabelColor || this.secondaryTextColor;
    this.commitLabelBackground = this.commitLabelBackground || this.secondaryColor;
    this.commitLabelFontSize = this.commitLabelFontSize || '10px';

    /* -------------------------------------------------- */
    /* EntityRelationship diagrams                        */

    this.attributeBackgroundColorOdd =
      this.attributeBackgroundColorOdd || oldAttributeBackgroundColorOdd;
    this.attributeBackgroundColorEven =
      this.attributeBackgroundColorEven || oldAttributeBackgroundColorEven;
    /* -------------------------------------------------- */
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
