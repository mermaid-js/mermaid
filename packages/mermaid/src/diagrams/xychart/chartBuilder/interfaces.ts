export interface XYChartAxisThemeConfig {
  titleColor: string;
  labelColor: string;
  tickColor: string;
  axisLineColor: string;
}

export interface XYChartThemeConfig {
  backgroundColor: string;
  titleColor: string;
  xAxisLabelColor: string;
  xAxisTitleColor: string;
  xAxisTickColor: string;
  xAxisLineColor: string;
  yAxisLabelColor: string;
  yAxisTitleColor: string;
  yAxisTickColor: string;
  yAxisLineColor: string;
  plotColorPalette: string;
}

export interface ChartComponent {
  calculateSpace(availableSpace: Dimension): Dimension;
  setBoundingBoxXY(point: Point): void;
  getDrawableElements(): DrawableElem[];
}

export type SimplePlotDataType = [string, number][];

export interface LinePlotData {
  type: 'line';
  strokeFill: string;
  strokeWidth: number;
  data: SimplePlotDataType;
}

export interface BarPlotData {
  type: 'bar';
  fill: string;
  data: SimplePlotDataType;
}

export type PlotData = LinePlotData | BarPlotData;

export function isBarPlot(data: PlotData): data is BarPlotData {
  return data.type === 'bar';
}

export interface BandAxisDataType {
  type: 'band';
  title: string;
  categories: string[];
}

export interface LinearAxisDataType {
  type: 'linear';
  title: string;
  min: number;
  max: number;
}

export type AxisDataType = LinearAxisDataType | BandAxisDataType;

export function isBandAxisData(data: AxisDataType): data is BandAxisDataType {
  return data.type === 'band';
}

export function isLinearAxisData(data: AxisDataType): data is LinearAxisDataType {
  return data.type === 'linear';
}

/**
 * For now we are keeping this configs as we are removing the required fields while generating the config.type.ts file
 * we should remove `XYChartAxisConfig` and `XYChartConfig` after we started using required fields
 */
export interface XYChartAxisConfig {
  showLabel: boolean;
  labelFontSize: number;
  labelPadding: number;
  showTitle: boolean;
  titleFontSize: number;
  titlePadding: number;
  showTick: boolean;
  tickLength: number;
  tickWidth: number;
  showAxisLine: boolean;
  axisLineWidth: number;
}

export interface XYChartConfig {
  width: number;
  height: number;
  titleFontSize: number;
  titlePadding: number;
  showTitle: boolean;
  xAxis: XYChartAxisConfig;
  yAxis: XYChartAxisConfig;
  chartOrientation: 'vertical' | 'horizontal';
  plotReservedSpacePercent: number;
}

export interface XYChartData {
  xAxis: AxisDataType;
  yAxis: AxisDataType;
  title: string;
  plots: PlotData[];
}

export interface Dimension {
  width: number;
  height: number;
}

export interface BoundingRect extends Point, Dimension {}

export interface Point {
  x: number;
  y: number;
}

export type TextHorizontalPos = 'left' | 'center' | 'right';
export type TextVerticalPos = 'top' | 'middle';

export interface RectElem extends Point {
  width: number;
  height: number;
  fill: string;
  strokeWidth: number;
  strokeFill: string;
}

export interface TextElem extends Point {
  text: string;
  fill: string;
  verticalPos: TextVerticalPos;
  horizontalPos: TextHorizontalPos;
  fontSize: number;
  rotation: number;
}

export interface PathElem {
  path: string;
  fill?: string;
  strokeWidth: number;
  strokeFill: string;
}

export type DrawableElem =
  | {
      groupTexts: string[];
      type: 'rect';
      data: RectElem[];
    }
  | {
      groupTexts: string[];
      type: 'text';
      data: TextElem[];
    }
  | {
      groupTexts: string[];
      type: 'path';
      data: PathElem[];
    };
