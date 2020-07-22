import { darken, lighten, adjust } from 'khroma';

class Theme {
  constructor() {
    /* Base variables */
    this.primaryColor = '#039fbe';
    this.secondaryColor = '#b20238';
    this.tertiaryColor = lighten('#e8d21d', 30);
    this.relationColor = '#000';
    this.primaryColor = '#fa255e';
    this.secondaryColor = '#c39ea0';
    this.tertiaryColor = '#f8e5e5';

    this.primaryColor = '#ECECFF';
    this.secondaryColor = '#ffffde';
    this.tertiaryColor = '#ffffde';

    this.background = 'white';
    this.lineColor = '#333333';
    this.border1 = '#9370DB';
    this.arrowheadColor = '#333333';
    this.fontFamily = '"trebuchet ms", verdana, arial';
    this.fontSize = '16px';
    this.labelBackground = '#e8e8e8';
    this.textColor = '#333';
    this.noteBkgColor = '#fff5ad';
    this.noteBorderColor = '#aaaa33';
    this.updateColors();
  }
  updateColors() {
    this.secondBkg = this.tertiaryColor;

    /* Flowchart variables */

    this.nodeBkg = this.primaryColor;
    this.mainBkg = this.primaryColor;
    this.nodeBorder = darken(this.primaryColor, 23); // border 1
    this.clusterBkg = this.tertiaryColor;
    this.clusterBorder = darken(this.tertiaryColor, 10);
    this.defaultLinkColor = this.lineColor;
    this.titleColor = this.textColor;
    this.edgeLabelBackground = this.labelBackground;

    /* Sequence Diagram variables */

    // this.actorBorder = lighten(this.border1, 0.5);
    this.actorBorder = lighten(this.border1, 23);
    this.actorBkg = this.mainBkg;
    this.actorTextColor = 'black';
    this.actorLineColor = 'grey';
    this.labelBoxBkgColor = this.actorBkg;
    this.signalColor = this.textColor;
    this.signalTextColor = this.textColor;
    this.labelBoxBorderColor = this.actorBorder;
    this.labelTextColor = this.actorTextColor;
    this.loopTextColor = this.actorTextColor;
    this.noteBorderColor = this.border2;
    this.noteTextColor = this.actorTextColor;
    this.activationBorderColor = darken(this.secondaryColor, 10);
    this.activationBkgColor = this.secondaryColor;
    this.sequenceNumberColor = 'white';

    /* Gantt chart variables */

    this.taskTextColor = this.taskTextLightColor;
    this.taskTextOutsideColor = this.taskTextDarkColor;
    this.sectionBkgColor = this.tertiaryColor;
    this.altSectionBkgColor = 'white';
    this.sectionBkgColor = this.secondaryColor;
    this.sectionBkgColor2 = this.tertiaryColor;
    this.altSectionBkgColor = 'white';
    this.sectionBkgColor2 = this.primaryColor;
    this.taskBorderColor = lighten(this.primaryColor, 23);
    this.taskBkgColor = this.primaryColor;
    this.taskTextLightColor = 'white';
    this.taskTextColor = 'calculated';
    this.taskTextDarkColor = 'black';
    this.taskTextOutsideColor = 'calculated';
    this.taskTextClickableColor = '#003163';
    this.activeTaskBorderColor = this.primaryColor;
    this.activeTaskBkgColor = lighten(this.primaryColor, 23);
    this.gridColor = 'lightgrey';
    this.doneTaskBkgColor = 'lightgrey';
    this.doneTaskBorderColor = 'grey';
    this.critBorderColor = '#ff8888';
    this.critBkgColor = 'red';
    this.todayLineColor = 'red';

    /* state colors */
    this.labelColor = 'black';
    this.errorBkgColor = '#552222';
    this.errorTextColor = '#552222';

    /* state colors */

    /* class */
    this.classText = this.textColor;

    /* user-journey */
    this.fillType0 = this.primaryColor;
    this.fillType1 = this.secondaryColor;
    this.fillType2 = adjust(this.primaryColor, { h: 64 });
    this.fillType3 = adjust(this.secondaryColor, { h: 64 });
    this.fillType4 = adjust(this.primaryColor, { h: -64 });
    this.fillType5 = adjust(this.secondaryColor, { h: -64 });
    this.fillType6 = adjust(this.primaryColor, { h: 128 });
    this.fillType7 = adjust(this.secondaryColor, { h: 128 });
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
