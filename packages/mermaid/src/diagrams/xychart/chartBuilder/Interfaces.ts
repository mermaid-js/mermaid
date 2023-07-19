export interface XYChartAxisThemeConfig {
  titleColor: string;
  labelColor: string;
  tickColor: string;
}

export interface XYChartThemeConfig {
  xychartTitleColor: string;
  xychartAxisLineColor: string;
  xychartXAxisLableColor: string;
  xychartXAxisTitleColor: string;
  xychartXAxisTickColor: string;
  xychartYAxisLableColor: string;
  xychartYAxisTitleColor: string;
  xychartYAxisTickColor: string;
  xychartBarPlotPalette: string[];
  xychartLinePlotPalette: string[];
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
  return data.type === 'line';
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

export type TextVerticalPos = 'left' | 'center' | 'right';
export type TextHorizontalPos = 'top' | 'middle' | 'bottom';

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
