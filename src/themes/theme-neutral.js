import { invert, darken, lighten, adjust } from 'khroma';
import { mkBorder } from './theme-helpers';

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

    /* state colors */
    this.labelColor = 'black';

    this.errorBkgColor = '#552222';
    this.errorTextColor = '#552222';
  }
  updateColors() {
    this.secondBkg = lighten(this.contrast, 55);
    this.border2 = this.contrast;

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
    this.pie1 = this.pie1 || '#F4F4F4';
    this.pie2 = this.pie2 || '#555';
    this.pie3 = this.pie3 || '#BBB';
    this.pie4 = this.pie4 || '#777';
    this.pie5 = this.pie5 || '#999';
    this.pie6 = this.pie6 || '#DDD';
    this.pie7 = this.pie7 || '#FFF';
    this.pie8 = this.pie8 || '#DDD';
    this.pie9 = this.pie9 || '#BBB';
    this.pie10 = this.pie10 || '#999';
    this.pie11 = this.pie11 || '#777';
    this.pie12 = this.pie12 || '#555';
    this.pieTitleTextSize = this.pieTitleTextSize || '25px';
    this.pieTitleTextColor = this.pieTitleTextColor || this.taskTextDarkColor;
    this.pieSectionTextSize = this.pieSectionTextSize || '17px';
    this.pieSectionTextColor = this.pieSectionTextColor || this.textColor;
    this.pieLegendTextSize = this.pieLegendTextSize || '17px';
    this.pieLegendTextColor = this.pieLegendTextColor || this.taskTextDarkColor;
    this.pieStrokeColor = this.pieStrokeColor || 'black';
    this.pieStrokeWidth = this.pieStrokeWidth || '2px';
    this.pieOpacity = this.pieOpacity || '0.7';

    // this.pie1 = this.pie1 || '#212529';
    // this.pie2 = this.pie2 || '#343A40';
    // this.pie3 = this.pie3 || '#495057';
    // this.pie4 = this.pie4 || '#6C757D';
    // this.pie5 = this.pie5 || adjust(this.secondaryColor, { l: -10 });
    // this.pie6 = this.pie6 || adjust(this.tertiaryColor, { l: -10 });
    // this.pie7 = this.pie7 || adjust(this.primaryColor, { h: +60, l: -10 });
    // this.pie8 = this.pie8 || adjust(this.primaryColor, { h: -60, l: -10 });
    // this.pie9 = this.pie9 || adjust(this.primaryColor, { h: 120, l: 0 });
    // this.pie10 = this.pie10 || adjust(this.primaryColor, { h: +60, l: -20 });
    // this.pie11 = this.pie11 || adjust(this.primaryColor, { h: -60, l: -20 });
    // this.pie12 = this.pie12 || adjust(this.primaryColor, { h: 120, l: -10 });

    /* requirement-diagram */
    this.requirementBackground = this.requirementBackground || this.primaryColor;
    this.requirementBorderColor = this.requirementBorderColor || this.primaryBorderColor;
    this.requirementBorderSize = this.requirementBorderSize || this.primaryBorderColor;
    this.requirementTextColor = this.requirementTextColor || this.primaryTextColor;
    this.relationColor = this.relationColor || this.lineColor;
    this.relationLabelBackground = this.relationLabelBackground || this.edgeLabelBackground;
    this.relationLabelColor = this.relationLabelColor || this.actorTextColor;
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
