import { lighten, rgba } from 'khroma';

export const mainBkg = '#1f2020';
export const secondBkg = lighten('#1f2020', 16);
export const mainContrastColor = 'lightgrey';
export const darkTextColor = '#323D47';
export const lineColor = mainContrastColor;
export const border1 = '#81B1DB';
export const border2 = rgba(255, 255, 255, 0.25);
export const arrowheadColor = mainContrastColor;
export const fontFamily = '"trebuchet ms", verdana, arial';
export const fontSize = '16px';
/* Flowchart variables */

export const nodeBkg = mainBkg;
export const nodeBorder = border1;
export const clusterBkg = secondBkg;
export const clusterBorder = border2;
export const defaultLinkColor = lineColor;
export const titleColor = '#F9FFFE';
export const edgeLabelBackground = '#e8e8e8';

/* Sequence Diagram variables */

export const actorBorder = border1;
export const actorBkg = mainBkg;
export const actorTextColor = mainContrastColor;
export const actorLineColor = mainContrastColor;
export const signalColor = mainContrastColor;
export const signalTextColor = mainContrastColor;
export const labelBoxBkgColor = actorBkg;
export const labelBoxBorderColor = actorBorder;
export const labelTextColor = mainContrastColor;
export const loopTextColor = mainContrastColor;
export const noteBorderColor = border2;
export const noteBkgColor = '#fff5ad';
export const noteTextColor = mainBkg;
export const activationBorderColor = border1;
export const activationBkgColor = secondBkg;
export const sequenceNumberColor = 'black';

/* Gantt chart variables */

export const sectionBkgColor = rgba(255, 255, 255, 0.3);
export const altSectionBkgColor = 'white';
export const sectionBkgColor2 = '#EAE8B9';
export const taskBorderColor = rgba(255, 255, 255, 0.5);
export const taskBkgColor = mainBkg;
export const taskTextColor = darkTextColor;
export const taskTextLightColor = mainContrastColor;
export const taskTextOutsideColor = taskTextLightColor;
export const taskTextClickableColor = '#003163';
export const activeTaskBorderColor = rgba(255, 255, 255, 0.5);
export const activeTaskBkgColor = '#81B1DB';
export const gridColor = mainContrastColor;
export const doneTaskBkgColor = mainContrastColor;
export const doneTaskBorderColor = 'grey';
export const critBorderColor = '#E83737';
export const critBkgColor = '#E83737';
export const taskTextDarkColor = darkTextColor;
export const todayLineColor = '#DB5757';

/* state colors */
export const labelColor = 'black';

export const errorBkgColor = '#a44141';
export const errorTextColor = '#ddd';
