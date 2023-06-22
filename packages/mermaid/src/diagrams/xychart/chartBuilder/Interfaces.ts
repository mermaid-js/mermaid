export enum ChartPlotEnum {
  LINE = 'line',
  BAR = 'bar',
}

export interface ChartComponent {
  calculateSpace(availableSpace: Dimension): Dimension;
  setBoundingBoxXY(point: Point): void;
  getDrawableElements(): DrawableElem[];
}

export enum OrientationEnum {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

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
  strokeFill: string,
  strokeWidth: number,
  data: SimplePlotDataType;
}

export interface BarPlotData {
  type: ChartPlotEnum.BAR;
  fill: string,
  data: SimplePlotDataType;
}

export type PlotData = LinePlotData | BarPlotData;

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
