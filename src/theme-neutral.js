import { darken, lighten } from 'khroma';

export const mainBkg = '#eee';
export const contrast = '#26a';
export const secondBkg = lighten(contrast, 55);
export const lineColor = '#666';
export const border1 = '#999';
export const border2 = contrast;
export const note = '#ffa';
export const text = '#333';
export const critical = '#d42';
export const done = '#bbb';
export const arrowheadColor = '#333333';
export const fontFamily = '"trebuchet ms", verdana, arial';
export const fontSize = '16px';

/* Flowchart variables */

export const nodeBkg = mainBkg;
export const nodeBorder = border1;
export const clusterBkg = secondBkg;
export const clusterBorder = border2;
export const defaultLinkColor = lineColor;
export const titleColor = text;
export const edgeLabelBackground = 'white';

/* Sequence Diagram variables */

export const actorBorder = border1;
export const actorBkg = mainBkg;
export const actorTextColor = text;
export const actorLineColor = lineColor;
export const signalColor = text;
export const signalTextColor = text;
export const labelBoxBkgColor = actorBkg;
export const labelBoxBorderColor = actorBorder;
export const labelTextColor = text;
export const loopTextColor = text;
export const noteBorderColor = darken(note, 60);
export const noteBkgColor = note;
export const noteTextColor = actorTextColor;
export const activationBorderColor = '#666';
export const activationBkgColor = '#f4f4f4';
export const sequenceNumberColor = 'white';

/* Gantt chart variables */

export const sectionBkgColor = lighten(contrast, 30);
export const altSectionBkgColor = 'white';
export const sectionBkgColor2 = lighten(contrast, 30);
export const taskBorderColor = darken(contrast, 10);
export const taskBkgColor = contrast;
export const taskTextLightColor = 'white';
export const taskTextColor = taskTextLightColor;
export const taskTextDarkColor = text;
export const taskTextOutsideColor = taskTextDarkColor;
export const taskTextClickableColor = '#003163';
export const activeTaskBorderColor = taskBorderColor;
export const activeTaskBkgColor = mainBkg;
export const gridColor = lighten(border1, 30);
export const doneTaskBkgColor = done;
export const doneTaskBorderColor = lineColor;
export const critBkgColor = critical;
export const critBorderColor = darken(critBkgColor, 10);
export const todayLineColor = critBkgColor;

/* state colors */
export const labelColor = 'black';

export const errorBkgColor = '#552222';
export const errorTextColor = '#552222';
