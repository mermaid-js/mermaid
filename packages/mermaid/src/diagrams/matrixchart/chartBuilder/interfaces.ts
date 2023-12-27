export interface MatrixChartAxisThemeConfig {
  titleColor: string;
  labelColor: string;
  tickColor: string;
  axisLineColor: string;
}

export interface MatrixChartThemeConfig {
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
  setBoundingBoxMatrix(point: Point): void;
  getDrawableElements(): DrawableElem[];
}

export type SimplePlotDataType = [string, number][];
export type SimpleBackdropDataType = [string, string][];

export interface LinePlotData {
  type: 'line';
  strokeFill: string;
  strokeWidth: number;
  data: SimplePlotDataType;
  fill: string;
}

export interface BarPlotData {
  type: 'bar';
  fill: string;
  data: SimplePlotDataType;
}

export interface BackdropData {
  type: string;
  fill: string;
  data: SimpleBackdropDataType;
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

/**
 * For now we are keeping this configs as we are removing the required fields while generating the config.type.ts file
 * we should remove `MatrixChartAxisConfig` and `MatrixChartConfig` after we started using required fields
 */
export interface MatrixChartAxisConfig {
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

export interface MatrixChartConfig {
  width: number;
  height: number;
  titleFontSize: number;
  titlePadding: number;
  showTitle: boolean;
  xAxis: MatrixChartAxisConfig;
  yAxis: MatrixChartAxisConfig;
  chartOrientation: 'vertical' | 'horizontal';
  plotReservedSpacePercent: number;
}

export interface MatrixChartData {
  xAxis: BandAxisDataType;
  yAxis: BandAxisDataType;
  title: string;
  plots: PlotData[];
  color: string[];
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
