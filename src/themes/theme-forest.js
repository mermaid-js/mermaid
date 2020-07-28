import { darken, adjust } from 'khroma';
class Theme {
  constructor() {
    /* Base vales */
    this.primaryColor = '#cde498';
    this.secondaryColor = '#cdffb2';
    this.background = 'white';
    this.mainBkg = '#cde498';
    this.secondBkg = '#cdffb2';
    this.lineColor = 'green';
    this.border1 = '#13540c';
    this.border2 = '#6eaa49';
    this.arrowheadColor = 'green';
    this.fontFamily = '"trebuchet ms", verdana, arial';
    this.fontSize = '16px';

    /* Flowchart variables */

    this.nodeBkg = 'calculated';
    this.nodeBorder = 'calculated';
    this.clusterBkg = 'calculated';
    this.clusterBorder = 'calculated';
    this.defaultLinkColor = 'calculated';
    this.titleColor = '#333';
    this.edgeLabelBackground = '#e8e8e8';

    /* Sequence Diagram variables */

    this.actorBorder = 'calculated';
    this.actorBkg = 'calculated';
    this.actorTextColor = 'black';
    this.actorLineColor = 'grey';
    this.signalColor = '#333';
    this.signalTextColor = '#333';
    this.labelBoxBkgColor = 'calculated';
    this.labelBoxBorderColor = '#326932';
    this.labelTextColor = 'calculated';
    this.loopTextColor = 'calculated';
    this.noteBorderColor = 'calculated';
    this.noteBkgColor = '#fff5ad';
    this.noteTextColor = 'calculated';
    this.activationBorderColor = '#666';
    this.activationBkgColor = '#f4f4f4';
    this.sequenceNumberColor = 'white';

    /* Gantt chart variables */

    this.sectionBkgColor = '#6eaa49';
    this.altSectionBkgColor = 'white';
    this.sectionBkgColor2 = '#6eaa49';
    this.taskBorderColor = 'calculated';
    this.taskBkgColor = '#487e3a';
    this.taskTextLightColor = 'white';
    this.taskTextColor = 'calculated';
    this.taskTextDarkColor = 'black';
    this.taskTextOutsideColor = 'calculated';
    this.taskTextClickableColor = '#003163';
    this.activeTaskBorderColor = 'calculated';
    this.activeTaskBkgColor = 'calculated';
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
  }
  updateColors() {
    /* Flowchart variables */

    this.nodeBkg = this.mainBkg;
    this.nodeBorder = this.border1;
    this.clusterBkg = this.secondBkg;
    this.clusterBorder = this.border2;
    this.defaultLinkColor = this.lineColor;

    /* Sequence Diagram variables */

    this.actorBorder = darken(this.mainBkg, 20);
    this.actorBkg = this.mainBkg;
    this.labelBoxBkgColor = this.actorBkg;
    this.labelTextColor = this.actorTextColor;
    this.loopTextColor = this.actorTextColor;
    this.noteBorderColor = this.border2;
    this.noteTextColor = this.actorTextColor;

    /* Gantt chart variables */

    this.taskBorderColor = this.border1;
    this.taskTextColor = this.taskTextLightColor;
    this.taskTextOutsideColor = this.taskTextDarkColor;
    this.activeTaskBorderColor = this.taskBorderColor;
    this.activeTaskBkgColor = this.mainBkg;

    /* state colors */
    /* class */
    this.classText = this.nodeBorder;
    /* journey */
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
  console.info('Theme(forest)', { userOverrides, theme });
  return theme;
};
