import { invert, darken, lighten, adjust } from 'khroma';
import { mkBorder } from './theme-helpers';
import {
  oldAttributeBackgroundColorEven,
  oldAttributeBackgroundColorOdd,
} from './erDiagram-oldHardcodedValues';

// const Color = require ( 'khroma/dist/color' ).default
// Color.format.hex.stringify(Color.parse('hsl(210, 66.6666666667%, 95%)')); // => "#EAF2FB"

class Theme {
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
    this.actorLineColor = 'calculated';
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

    /* C4 Context Diagram variables */
    this.personBorder = this.primaryBorderColor;
    this.personBkg = this.mainBkg;

    /* state colors */
    this.labelColor = 'black';

    this.errorBkgColor = '#552222';
    this.errorTextColor = '#552222';
  }
  updateColors() {
    this.secondBkg = lighten(this.contrast, 55);
    this.border2 = this.contrast;

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
    this.scaleLabelColor = this.scaleLabelColor || (this.darkMode ? 'black' : this.labelTextColor);

    this['cScaleLabel0'] = this['cScaleLabel0'] || this.cScale1;
    this['cScaleLabel2'] = this['cScaleLabel2'] || this.cScale1;
    for (let i = 0; i < this.THEME_COLOR_LIMIT; i++) {
      this['cScaleLabel' + i] = this['cScaleLabel' + i] || this.scaleLabelColor;
    }

    for (let i = 0; i < 5; i++) {
      this['surface' + i] = this['surface' + i] || adjust(this.mainBkg, { l: -(5 + i * 5) });
      this['surfacePeer' + i] =
        this['surfacePeer' + i] || adjust(this.mainBkg, { l: -(8 + i * 5) });
    }

    /* Flowchart variables */

    this.nodeBkg = this.mainBkg;
    this.nodeBorder = this.border1;
    this.clusterBkg = this.secondBkg;
    this.clusterBorder = this.border2;
    this.defaultLinkColor = this.lineColor;
    this.titleColor = this.text;

    /* Sequence Diagram variables */

    this.actorBorder = lighten(this.border1, 23);
    this.actorBkg = this.mainBkg;
    this.actorTextColor = this.text;
    this.actorLineColor = this.lineColor;
    this.signalColor = this.text;
    this.signalTextColor = this.text;
    this.labelBoxBkgColor = this.actorBkg;
    this.labelBoxBorderColor = this.actorBorder;
    this.labelTextColor = this.text;
    this.loopTextColor = this.text;
    this.noteBorderColor = '#999';
    this.noteBkgColor = '#666';
    this.noteTextColor = '#fff';

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
      this['pie' + i] = this['cScale' + i];
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
