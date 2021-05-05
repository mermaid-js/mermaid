import { invert, lighten, darken, rgba, adjust } from 'khroma';
import { mkBorder } from './theme-helpers';
class Theme {
  constructor() {
    this.background = '#333';
    this.primaryColor = '#1f2020';
    this.secondaryColor = lighten(this.primaryColor, 16);

    this.tertiaryColor = adjust(this.primaryColor, { h: -160 });
    this.primaryBorderColor = mkBorder(this.primaryColor, this.darkMode);
    this.secondaryBorderColor = mkBorder(this.secondaryColor, this.darkMode);
    this.tertiaryBorderColor = mkBorder(this.tertiaryColor, this.darkMode);
    this.primaryTextColor = invert(this.primaryColor);
    this.secondaryTextColor = invert(this.secondaryColor);
    this.tertiaryTextColor = invert(this.tertiaryColor);
    this.lineColor = invert(this.background);
    this.textColor = invert(this.background);

    this.mainBkg = '#1f2020';
    this.secondBkg = 'calculated';
    this.mainContrastColor = 'lightgrey';
    this.darkTextColor = lighten(invert('#323D47'), 10);
    this.lineColor = 'calculated';
    this.border1 = '#81B1DB';
    this.border2 = rgba(255, 255, 255, 0.25);
    this.arrowheadColor = 'calculated';
    this.fontFamily = '"trebuchet ms", verdana, arial, sans-serif';
    this.fontSize = '16px';
    this.labelBackground = '#181818';
    this.textColor = '#ccc';
    /* Flowchart variables */

    this.nodeBkg = 'calculated';
    this.nodeBorder = 'calculated';
    this.clusterBkg = 'calculated';
    this.clusterBorder = 'calculated';
    this.defaultLinkColor = 'calculated';
    this.titleColor = '#F9FFFE';
    this.edgeLabelBackground = 'calculated';

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
    this.noteBkgColor = '#fff5ad';
    this.noteTextColor = 'calculated';
    this.activationBorderColor = 'calculated';
    this.activationBkgColor = 'calculated';
    this.sequenceNumberColor = 'black';

    /* Gantt chart variables */

    this.sectionBkgColor = darken('#EAE8D9', 30);
    this.altSectionBkgColor = 'calculated';
    this.sectionBkgColor2 = '#EAE8D9';
    this.taskBorderColor = rgba(255, 255, 255, 70);
    this.taskBkgColor = 'calculated';
    this.taskTextColor = 'calculated';
    this.taskTextLightColor = 'calculated';
    this.taskTextOutsideColor = 'calculated';
    this.taskTextClickableColor = '#003163';
    this.activeTaskBorderColor = rgba(255, 255, 255, 50);
    this.activeTaskBkgColor = '#81B1DB';
    this.gridColor = 'calculated';
    this.doneTaskBkgColor = 'calculated';
    this.doneTaskBorderColor = 'grey';
    this.critBorderColor = '#E83737';
    this.critBkgColor = '#E83737';
    this.taskTextDarkColor = 'calculated';
    this.todayLineColor = '#DB5757';

    /* state colors */
    this.labelColor = 'calculated';

    this.errorBkgColor = '#a44141';
    this.errorTextColor = '#ddd';
  }
  updateColors() {
    this.secondBkg = lighten(this.mainBkg, 16);
    this.lineColor = this.mainContrastColor;
    this.arrowheadColor = this.mainContrastColor;
    /* Flowchart variables */

    this.nodeBkg = this.mainBkg;
    this.nodeBorder = this.border1;
    this.clusterBkg = this.secondBkg;
    this.clusterBorder = this.border2;
    this.defaultLinkColor = this.lineColor;
    this.edgeLabelBackground = lighten(this.labelBackground, 25);

    /* Sequence Diagram variables */

    this.actorBorder = this.border1;
    this.actorBkg = this.mainBkg;
    this.actorTextColor = this.mainContrastColor;
    this.actorLineColor = this.mainContrastColor;
    this.signalColor = this.mainContrastColor;
    this.signalTextColor = this.mainContrastColor;
    this.labelBoxBkgColor = this.actorBkg;
    this.labelBoxBorderColor = this.actorBorder;
    this.labelTextColor = this.mainContrastColor;
    this.loopTextColor = this.mainContrastColor;
    this.noteBorderColor = this.secondaryBorderColor;
    this.noteBkgColor = this.secondBkg;
    this.noteTextColor = this.secondaryTextColor;
    this.activationBorderColor = this.border1;
    this.activationBkgColor = this.secondBkg;

    /* Gantt chart variables */

    this.altSectionBkgColor = this.background;
    this.taskBkgColor = lighten(this.mainBkg, 23);
    this.taskTextColor = this.darkTextColor;
    this.taskTextLightColor = this.mainContrastColor;
    this.taskTextOutsideColor = this.taskTextLightColor;
    this.gridColor = this.mainContrastColor;
    this.doneTaskBkgColor = this.mainContrastColor;
    this.taskTextDarkColor = this.darkTextColor;

    /* state colors */
    this.labelColor = this.textColor;
    this.altBackground = lighten(this.background, 20);

    this.fillType0 = this.primaryColor;
    this.fillType1 = this.secondaryColor;
    this.fillType2 = adjust(this.primaryColor, { h: 64 });
    this.fillType3 = adjust(this.secondaryColor, { h: 64 });
    this.fillType4 = adjust(this.primaryColor, { h: -64 });
    this.fillType5 = adjust(this.secondaryColor, { h: -64 });
    this.fillType6 = adjust(this.primaryColor, { h: 128 });
    this.fillType7 = adjust(this.secondaryColor, { h: 128 });

    /* pie */
    // this.pie1 = this.pie1 || this.primaryColor;
    // this.pie2 = this.pie2 || this.secondaryColor;
    // this.pie3 = this.pie3 || this.tertiaryColor;
    // this.pie4 = this.pie4 || adjust(this.primaryColor, { l: -10 });
    // this.pie5 = this.pie5 || adjust(this.secondaryColor, { l: -10 });
    // this.pie6 = this.pie6 || adjust(this.tertiaryColor, { l: -10 });
    // this.pie7 = this.pie7 || adjust(this.primaryColor, { h: +60, l: -10 });
    // this.pie8 = this.pie8 || adjust(this.primaryColor, { h: -60, l: -10 });
    // this.pie9 = this.pie9 || adjust(this.primaryColor, { h: 120, l: 0 });
    // this.pie10 = this.pie10 || adjust(this.primaryColor, { h: +60, l: -20 });
    // this.pie11 = this.pie11 || adjust(this.primaryColor, { h: -60, l: -20 });
    // this.pie12 = this.pie12 || adjust(this.primaryColor, { h: 120, l: -10 });

    this.pie1 = this.pie1 || '#0b0000';
    this.pie2 = this.pie2 || '#4d1037';
    this.pie3 = this.pie3 || '#3f5258';
    this.pie4 = this.pie4 || '#4f2f1b';
    this.pie5 = this.pie5 || '#6e0a0a';
    this.pie6 = this.pie6 || '#3b0048';
    this.pie7 = this.pie7 || '#995a01';
    this.pie8 = this.pie8 || '#154706';
    this.pie9 = this.pie9 || '#161722';
    this.pie10 = this.pie10 || '#00296f';
    this.pie11 = this.pie11 || '#01629c';
    this.pie12 = this.pie12 || '#010029';

    /* class */
    this.classText = this.primaryTextColor;

    /* requirement-diagram */
    this.requirementBackground = this.requirementBackground || this.primaryColor;
    this.requirementBorderColor = this.requirementBorderColor || this.primaryBorderColor;
    this.requirementBorderSize = this.requirementBorderSize || this.primaryBorderColor;
    this.requirementTextColor = this.requirementTextColor || this.primaryTextColor;
    this.relationColor = this.relationColor || this.lineColor;
    this.relationLabelBackground =
      this.relationLabelBackground ||
      (this.darkMode ? darken(this.secondaryColor, 30) : this.secondaryColor);
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
    keys.forEach(k => {
      this[k] = overrides[k];
    });

    // Calculate colors form base colors
    this.updateColors();
    // Copy values from overrides again in case of an override of derived value
    keys.forEach(k => {
      this[k] = overrides[k];
    });
  }
}

export const getThemeVariables = userOverrides => {
  const theme = new Theme();
  theme.calculate(userOverrides);
  return theme;
};
