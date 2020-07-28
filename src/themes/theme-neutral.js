import { darken, lighten, adjust } from 'khroma';

// const Color = require ( 'khroma/dist/color' ).default
// Color.format.hex.stringify(Color.parse('hsl(210, 66.6666666667%, 95%)')); // => "#EAF2FB"

class Theme {
  constructor() {
    this.primaryColor = '#eee';
    this.contrast = '#26a';
    this.secondaryColor = lighten(this.contrast, 55);
    this.background = 'white';
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
    this.fontFamily = '"trebuchet ms", verdana, arial';
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
    this.noteBorderColor = darken(this.note, 60);
    this.noteBkgColor = this.note;
    this.noteTextColor = this.actorTextColor;

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
  console.info('Theme(neutral)', { userOverrides, theme });
  return theme;
};
