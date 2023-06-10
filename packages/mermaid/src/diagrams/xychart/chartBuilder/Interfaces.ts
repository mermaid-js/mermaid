export enum ChartPlotEnum {
  LINE = 'line',
}

export enum ChartLayoutElem {
  NULL = 'null',
  CHART = 'chart',
  TITLE = 'title',
  XAXISLABEL = 'xaxislabel',
  XAXISTITLE = 'xaxistitle',
  YAXISLABEL = 'yaxislabel',
  YAXISTITLE = 'yaxistitle',
}
export enum XYChartYAxisPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum OrientationEnum {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

export type ChartLayout = ChartLayoutElem[][];

export type VisibilityOption = {
  chartTitle: boolean;
  xAxisTitle: boolean;
  xAxisLabel: boolean;
  yAxisTitle: boolean;
  yAxisLabel: boolean;
};

export interface AxisConfig {
  showLabel: boolean;
  labelFontSize: number;
  lablePadding: number;
  labelFill: string;
  showTitle: boolean;
  titleFontSize: number;
  titlePadding: number;
  titleFill: string;
  showTick: boolean;
  tickLength: number;
  tickWidth: number;
  tickFill: string;
}

export interface XYChartConfig {
  width: number;
  height: number;
  fontFamily: string;
  titleFontSize: number;
  titleFill: string;
  titlePadding: number;
  showtitle: boolean;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  plotBorderWidth: number;
  chartOrientation: OrientationEnum;
  plotReservedSpacePercent: number;
}

export type SimplePlotDataType = [string | number, number][];

export interface LinePlotData {
  type: ChartPlotEnum.LINE;
  data: SimplePlotDataType;
}

export type PlotData = LinePlotData;

export interface BandAxisDataType {
  title: string;
  categories: string[];
}

export interface LinearAxisDataType{
  title: string;
  min: number;
  max: number;
}

export type AxisDataType = LinearAxisDataType | BandAxisDataType;

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

export interface XYChartSpaceProperty extends BoundingRect {
  orientation: OrientationEnum;
}

export interface XYChartSpace {
  chart: XYChartSpaceProperty;
  title: XYChartSpaceProperty;
  xAxisLabels: XYChartSpaceProperty;
  xAxisTitle: XYChartSpaceProperty;
  yAxisLabel: XYChartSpaceProperty;
  yAxisTitle: XYChartSpaceProperty;
}

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
