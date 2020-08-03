import { darken, lighten, adjust, invert } from 'khroma';
import { mkBorder } from './theme-helpers';
class Theme {
  constructor() {
    /** # Base variables */
    /** * background - used to know what the background color is of the diagram. This is used for deducing colors for istance line color. Defaulr value is #f4f4f4. */
    this.background = '#f4f4f4';
    this.darkMode = false;

    // this.background = '#0c0c0c';
    // this.darkMode = true;
    this.primaryColor = '#fff4dd';
    // this.background = '#0c0c0c';
    // this.primaryColor = '#1f1f00';

    this.noteBkgColor = '#fff5ad';
    this.noteTextColor = '#333';

    // dark

    // this.primaryColor = '#034694';
    // this.primaryColor = '#f2ee7e';
    // this.primaryColor = '#9f33be';
    // this.primaryColor = '#f0fff0';
    // this.primaryColor = '#fa255e';
    // this.primaryColor = '#ECECFF';

    // this.secondaryColor = '#c39ea0';
    // this.tertiaryColor = '#f8e5e5';

    // this.secondaryColor = '#dfdfde';
    // this.tertiaryColor = '#CCCCFF';

    this.fontFamily = '"trebuchet ms", verdana, arial';
    this.fontSize = '16px';
    // this.updateColors();
  }
  updateColors() {
    // The || is to make sure that if the variable has been defiend by a user override that value is to be used

    /* Main */
    this.primaryTextColor = this.primaryTextColor || (this.darkMode ? '#ddd' : '#333'); // invert(this.primaryColor);
    this.secondaryColor = this.secondaryColor || adjust(this.primaryColor, { h: -120 });
    this.tertiaryColor = this.tertiaryColor || adjust(this.primaryColor, { h: 180, l: 5 });

    this.primaryBorderColor = this.primaryBorderColor || mkBorder(this.primaryColor, this.darkMode);
    this.secondaryBorderColor =
      this.secondaryBorderColor || mkBorder(this.secondaryColor, this.darkMode);
    this.tertiaryBorderColor =
      this.tertiaryBorderColor || mkBorder(this.tertiaryColor, this.darkMode);
    this.noteBorderColor = this.noteBorderColor || mkBorder(this.noteBkgColor, this.darkMode);

    this.secondaryTextColor = this.secondaryTextColor || invert(this.secondaryColor);
    this.tertiaryTextColor = this.tertiaryTextColor || invert(this.tertiaryColor);
    this.lineColor = this.lineColor || invert(this.background);
    this.textColor = this.textColor || this.primaryTextColor;

    /* Flowchart variables */
    this.nodeBkg = this.nodeBkg || this.primaryColor;
    this.mainBkg = this.mainBkg || this.primaryColor;
    this.nodeBorder = this.nodeBorder || this.primaryBorderColor;
    this.clusterBkg = this.clusterBkg || this.tertiaryColor;
    this.clusterBorder = this.clusterBorder || this.tertiaryBorderColor;
    this.defaultLinkColor = this.defaultLinkColor || this.lineColor;
    this.titleColor = this.titleColor || this.tertiaryTextColor;
    this.edgeLabelBackground =
      this.edgeLabelBackground || this.darkMode
        ? darken(this.secondaryColor, 30)
        : this.secondaryColor;
    this.nodeTextColor = this.nodeTextColor || this.primaryTextColor;
    /* Sequence Diagram variables */

    // this.actorBorder = lighten(this.border1, 0.5);
    this.actorBorder = this.actorBorder || this.primaryBorderColor;
    this.actorBkg = this.actorBkg || this.mainBkg;
    this.actorTextColor = this.actorTextColor || this.primaryTextColor;
    this.actorLineColor = this.actorLineColor || 'grey';
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
    this.taskTextColor = this.taskTextColor || this.textColor;
    this.taskTextOutsideColor = this.taskTextOutsideColor || this.textColor;
    this.taskTextLightColor = this.taskTextLightColor || this.textColor;
    this.taskTextColor = this.taskTextColor || this.primaryTextColor;
    this.taskTextDarkColor = this.taskTextDarkColor || this.textColor;
    this.taskTextClickableColor = this.taskTextClickableColor || '#003163';

    /* state colors */
    this.labelColor = this.labelColor || this.primaryTextColor;
    this.altBackground = this.altBackground || this.tertiaryColor;
    this.errorBkgColor = this.errorBkgColor || this.tertiaryColor;
    this.errorTextColor = this.errorTextColor || this.tertiaryTextColor;

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
