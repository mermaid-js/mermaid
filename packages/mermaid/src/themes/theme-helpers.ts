// @ts-expect-error Incorrect khroma types
import { adjust } from 'khroma';

export const mkBorder = (col: string, darkMode?: boolean): string =>
  darkMode ? adjust(col, { s: -40, l: 10 }) : adjust(col, { s: -40, l: -10 });

/** Theme variables for cynefin diagrams. */
export interface CynefinThemeVariables {
  domainFontSize: number;
  itemFontSize: number;
  boundaryColor: string;
  boundaryWidth: number;
  cliffColor: string;
  cliffWidth: number;
  arrowColor: string;
  arrowWidth: number;
  complexBg: string;
  complicatedBg: string;
  chaoticBg: string;
  clearBg: string;
  confusionBg: string;
  textColor: string;
  labelColor: string;
}

/** Theme variables for radar diagrams. */
export interface RadarThemeVariables {
  axisColor: string;
  axisStrokeWidth: number;
  axisLabelFontSize: number;
  curveOpacity: number;
  curveStrokeWidth: number;
  graticuleColor: string;
  graticuleStrokeWidth: number;
  graticuleOpacity: number;
  legendBoxSize: number;
  legendFontSize: number;
}

/** Theme variables for wardley diagrams. */
export interface WardleyThemeVariables {
  backgroundColor: string;
  axisColor: string;
  axisTextColor: string;
  gridColor: string;
  componentFill: string;
  componentStroke: string;
  componentLabelColor: string;
  linkStroke: string;
  evolutionStroke: string;
  annotationStroke: string;
  annotationTextColor: string;
  annotationFill: string;
}

/** Theme variables for xychart diagrams. */
export interface XYChartThemeVariables {
  backgroundColor: string;
  titleColor: string;
  dataLabelColor: string;
  xAxisTitleColor: string;
  xAxisLabelColor: string;
  xAxisTickColor: string;
  xAxisLineColor: string;
  yAxisTitleColor: string;
  yAxisLabelColor: string;
  yAxisTickColor: string;
  yAxisLineColor: string;
  plotColorPalette: string;
}

/** Theme variables for packet diagrams. */
export interface PacketThemeVariables {
  startByteColor: string;
  endByteColor: string;
  labelColor: string;
  titleColor: string;
  blockStrokeColor: string;
  blockFillColor: string;
}
