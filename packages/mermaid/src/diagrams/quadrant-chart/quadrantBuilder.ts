// @ts-ignore: TODO Fix ts errors
import { scaleLinear } from 'd3';
import { log } from '../../logger.js';
import { QuadrantChartConfig } from '../../config.type.js';

export interface QuadrantPointInputType {
  x: number;
  y: number;
  text: string;
}

export type TextVerticalPos = 'left' | 'center' | 'right';
export type TextHorizontalPos = 'top' | 'middle' | 'bottom';

export interface QuadrantTextType {
  text: string;
  fill: string;
  x: number;
  y: number;
  verticalPos: TextVerticalPos;
  horizontalPos: TextHorizontalPos;
  fontSize: number;
  rotation: number;
}

export interface QuadrantPointType {
  x: number;
  y: number;
  fill: string;
  radius: number;
  text: QuadrantTextType;
}

export interface QuadrantLineType {
  strokeWidth: number;
  strokeFill: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface QuadrantQuadrantsType {
  text: QuadrantTextType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

export interface QuadrantBuildType {
  points: QuadrantPointType[];
  quadrants: QuadrantQuadrantsType[];
  axisLabels: QuadrantTextType[];
  title?: QuadrantTextType;
  borderLines?: QuadrantLineType[];
}

export interface QuadrantBuilderConfig extends QuadrantChartConfig {
  titleText: string;
  quadrant1Text: string;
  quadrant2Text: string;
  quadrant3Text: string;
  quadrant4Text: string;
  xAxisLeftText: string;
  xAxisRightText: string;
  yAxisBottomText: string;
  yAxisTopText: string;
  points: QuadrantPointInputType[];
  showXAxis: boolean;
  showYAxis: boolean;
  showTitle: boolean;
}

export interface QuadrantBuilderThemeConfig {
  quadrantTitleFill: string;
  quadrant1Fill: string;
  quadrant2Fill: string;
  quadrant3Fill: string;
  quadrant4Fill: string;
  quadrant1TextFill: string;
  quadrant2TextFill: string;
  quadrant3TextFill: string;
  quadrant4TextFill: string;
  quadrantPointFill: string;
  quadrantPointTextFill: string;
  quadrantXAxisTextFill: string;
  quadrantYAxisTextFill: string;
  quadrantInternalBorderStrokeFill: string;
  quadrantExternalBorderStrokeFill: string;
}

export class QuadrantBuilder {
  private config: QuadrantBuilderConfig;
  private themeConfig: QuadrantBuilderThemeConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.themeConfig = this.getDefaultThemeConfig();
  }

  getDefaultConfig(): QuadrantBuilderConfig {
    return {
      titleText: '',
      quadrant1Text: '',
      quadrant2Text: '',
      quadrant3Text: '',
      quadrant4Text: '',
      xAxisLeftText: '',
      xAxisRightText: '',
      yAxisBottomText: '',
      yAxisTopText: '',
      points: [],
      showXAxis: true,
      showYAxis: true,
      showTitle: true,
      chartHeight: 500,
      chartWidth: 500,
      titlePadding: 5,
      titleFontSize: 20,
      quadrantPadding: 5,
      xAxisLabelPadding: 5,
      yAxisLabelPadding: 5,
      xAxisLabelFontSize: 16,
      yAxisLabelFontSize: 16,
      quadrantLabelFontSize: 16,
      quadrantTextTopPadding: 5,
      pointTextPadding: 5,
      pointLabelFontSize: 12,
      pointRadius: 5,
      xAxisPosition: 'top',
      yAxisPosition: 'left',
      quadrantInternalBorderStrokeWidth: 2,
      quadrantExternalBorderStrokeWidth: 3,
    };
  }

  getDefaultThemeConfig(): QuadrantBuilderThemeConfig {
    return {
      quadrant1Fill: '#8bc2f3',
      quadrant2Fill: '#faebd7',
      quadrant3Fill: '#00ffff',
      quadrant4Fill: '#f0ffff',
      quadrant1TextFill: '#93690e',
      quadrant2TextFill: '#8644ff',
      quadrant3TextFill: '#e3004d',
      quadrant4TextFill: '#000000',
      quadrantPointFill: '#60B19C',
      quadrantPointTextFill: '#0000ff',
      quadrantXAxisTextFill: '#000000',
      quadrantYAxisTextFill: '#000000',
      quadrantTitleFill: '#000000',
      quadrantInternalBorderStrokeFill: '#000000',
      quadrantExternalBorderStrokeFill: '#000000',
    };
  }

  clear() {
    this.config = this.getDefaultConfig();
    this.themeConfig = this.getDefaultThemeConfig();
    log.info('clear called');
  }

  addPoints(points: QuadrantPointInputType[]) {
    this.config.points = [...points, ...this.config.points];
  }

  setConfig(config: Partial<QuadrantBuilderConfig>) {
    log.trace('setConfig called with: ', config);
    this.config = { ...this.config, ...config };
  }

  setThemeConfig(themeConfig: Partial<QuadrantBuilderThemeConfig>) {
    log.trace('setThemeConfig called with: ', themeConfig);
    this.themeConfig = { ...this.themeConfig, ...themeConfig };
  }

  build(): QuadrantBuildType {
    const showXAxis =
      this.config.showXAxis && (this.config.xAxisLeftText || this.config.xAxisRightText);
    const showYAxis =
      this.config.showYAxis && (this.config.yAxisTopText || this.config.yAxisBottomText);
    const showTitle = this.config.showTitle && this.config.titleText;

    const halfExternalBorderWidth = this.config.quadrantExternalBorderStrokeWidth / 2;
    const halfInternalBorderWidth = this.config.quadrantInternalBorderStrokeWidth / 2;

    const xAxisPosition = this.config.points.length > 0 ? 'bottom' : this.config.xAxisPosition;

    const drawAxisLabelInMiddle = this.config.points.length === 0;

    const xAxisSpaceCalculation =
      this.config.xAxisLabelPadding * 2 + this.config.xAxisLabelFontSize;
    const xAxisSpace = {
      top: xAxisPosition === 'top' && showXAxis ? xAxisSpaceCalculation : 0,
      bottom: xAxisPosition === 'bottom' && showXAxis ? xAxisSpaceCalculation : 0,
    };

    const yAxisSpaceCalculation =
      this.config.yAxisLabelPadding * 2 + this.config.yAxisLabelFontSize;
    const yAxisSpace = {
      left: this.config.yAxisPosition === 'left' && showYAxis ? yAxisSpaceCalculation : 0,
      right: this.config.yAxisPosition === 'right' && showYAxis ? yAxisSpaceCalculation : 0,
    };

    const titleSpaceCalculation = this.config.titleFontSize + this.config.titlePadding * 2;
    const titleSpace = {
      top: showTitle ? titleSpaceCalculation : 0,
    };

    const quadrantLeft = this.config.quadrantPadding + yAxisSpace.left;
    const quadrantTop = this.config.quadrantPadding + xAxisSpace.top + titleSpace.top;
    const quadrantWidth =
      this.config.chartWidth - this.config.quadrantPadding * 2 - yAxisSpace.left - yAxisSpace.right;
    const quadrantHeight =
      this.config.chartHeight -
      this.config.quadrantPadding * 2 -
      xAxisSpace.top -
      xAxisSpace.bottom -
      titleSpace.top;

    const quadrantHalfWidth = quadrantWidth / 2;
    const quadrantHalfHeight = quadrantHeight / 2;

    const axisLabels: QuadrantTextType[] = [];

    if (this.config.xAxisLeftText && showXAxis) {
      axisLabels.push({
        text: this.config.xAxisLeftText,
        fill: this.themeConfig.quadrantXAxisTextFill,
        x: quadrantLeft + (drawAxisLabelInMiddle ? quadrantHalfWidth / 2 : 0),
        y:
          xAxisPosition === 'top'
            ? this.config.xAxisLabelPadding + titleSpace.top
            : this.config.xAxisLabelPadding + quadrantTop + quadrantHeight,
        fontSize: this.config.xAxisLabelFontSize,
        verticalPos: drawAxisLabelInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }
    if (this.config.xAxisRightText && showXAxis) {
      axisLabels.push({
        text: this.config.xAxisRightText,
        fill: this.themeConfig.quadrantXAxisTextFill,
        x: quadrantLeft + quadrantHalfWidth + (drawAxisLabelInMiddle ? quadrantHalfWidth / 2 : 0),
        y:
          xAxisPosition === 'top'
            ? this.config.xAxisLabelPadding + titleSpace.top
            : this.config.xAxisLabelPadding + quadrantTop + quadrantHeight,
        fontSize: this.config.xAxisLabelFontSize,
        verticalPos: drawAxisLabelInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }

    if (this.config.yAxisBottomText && showYAxis) {
      axisLabels.push({
        text: this.config.yAxisBottomText,
        fill: this.themeConfig.quadrantYAxisTextFill,
        x:
          this.config.yAxisPosition === 'left'
            ? this.config.yAxisLabelPadding
            : this.config.yAxisLabelPadding + quadrantLeft + quadrantWidth,
        y: quadrantTop + quadrantHeight - (drawAxisLabelInMiddle ? quadrantHalfHeight / 2 : 0),
        fontSize: this.config.yAxisLabelFontSize,
        verticalPos: drawAxisLabelInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }
    if (this.config.yAxisTopText && showYAxis) {
      axisLabels.push({
        text: this.config.yAxisTopText,
        fill: this.themeConfig.quadrantYAxisTextFill,
        x:
          this.config.yAxisPosition === 'left'
            ? this.config.yAxisLabelPadding
            : this.config.yAxisLabelPadding + quadrantLeft + quadrantWidth,
        y: quadrantTop + quadrantHalfHeight - (drawAxisLabelInMiddle ? quadrantHalfHeight / 2 : 0),
        fontSize: this.config.yAxisLabelFontSize,
        verticalPos: drawAxisLabelInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }

    const quadrants: QuadrantQuadrantsType[] = [
      {
        text: {
          text: this.config.quadrant1Text,
          fill: this.themeConfig.quadrant1TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft + quadrantHalfWidth,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.themeConfig.quadrant1Fill,
      },
      {
        text: {
          text: this.config.quadrant2Text,
          fill: this.themeConfig.quadrant2TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.themeConfig.quadrant2Fill,
      },
      {
        text: {
          text: this.config.quadrant3Text,
          fill: this.themeConfig.quadrant3TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft,
        y: quadrantTop + quadrantHalfHeight,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.themeConfig.quadrant3Fill,
      },
      {
        text: {
          text: this.config.quadrant4Text,
          fill: this.themeConfig.quadrant4TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft + quadrantHalfWidth,
        y: quadrantTop + quadrantHalfHeight,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.themeConfig.quadrant4Fill,
      },
    ];
    for (const quadrant of quadrants) {
      quadrant.text.x = quadrant.x + quadrant.width / 2;
      // place the text in the center of the box
      if (this.config.points.length === 0) {
        quadrant.text.y = quadrant.y + quadrant.height / 2;
        quadrant.text.horizontalPos = 'middle';
        // place the text top of the quadrant square
      } else {
        quadrant.text.y = quadrant.y + this.config.quadrantTextTopPadding;
        quadrant.text.horizontalPos = 'top';
      }
    }

    const xAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantLeft, quadrantWidth + quadrantLeft]);

    const yAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantHeight + quadrantTop, quadrantTop]);

    const points: QuadrantPointType[] = this.config.points.map((point) => {
      const props: QuadrantPointType = {
        x: xAxis(point.x),
        y: yAxis(point.y),
        fill: this.themeConfig.quadrantPointFill,
        radius: this.config.pointRadius,
        text: {
          text: point.text,
          fill: this.themeConfig.quadrantPointTextFill,
          x: xAxis(point.x),
          y: yAxis(point.y) + this.config.pointTextPadding,
          verticalPos: 'center',
          horizontalPos: 'top',
          fontSize: this.config.pointLabelFontSize,
          rotation: 0,
        },
      };
      return props;
    });

    const borderLines: QuadrantLineType[] = [
      // top border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: quadrantLeft - halfExternalBorderWidth,
        y1: quadrantTop,
        x2: quadrantLeft + quadrantWidth + halfExternalBorderWidth,
        y2: quadrantTop,
      },
      // right border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: quadrantLeft + quadrantWidth,
        y1: quadrantTop + halfExternalBorderWidth,
        x2: quadrantLeft + quadrantWidth,
        y2: quadrantTop + quadrantHeight - halfExternalBorderWidth,
      },
      // bottom border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: quadrantLeft - halfExternalBorderWidth,
        y1: quadrantTop + quadrantHeight,
        x2: quadrantLeft + quadrantWidth + halfExternalBorderWidth,
        y2: quadrantTop + quadrantHeight,
      },
      // left border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: quadrantLeft,
        y1: quadrantTop + halfExternalBorderWidth,
        x2: quadrantLeft,
        y2: quadrantTop + quadrantHeight - halfExternalBorderWidth,
      },
      // vertical inner border
      {
        strokeFill: this.themeConfig.quadrantInternalBorderStrokeFill,
        strokeWidth: this.config.quadrantInternalBorderStrokeWidth,
        x1: quadrantLeft + quadrantHalfWidth,
        y1: quadrantTop + halfExternalBorderWidth,
        x2: quadrantLeft + quadrantHalfWidth,
        y2: quadrantTop + quadrantHeight - halfExternalBorderWidth,
      },
      // horizontal inner border
      {
        strokeFill: this.themeConfig.quadrantInternalBorderStrokeFill,
        strokeWidth: this.config.quadrantInternalBorderStrokeWidth,
        x1: quadrantLeft + halfExternalBorderWidth,
        y1: quadrantTop + quadrantHalfHeight,
        x2: quadrantLeft + quadrantWidth - halfExternalBorderWidth,
        y2: quadrantTop + quadrantHalfHeight,
      },
    ];

    const retVal: QuadrantBuildType = {
      points,
      quadrants,
      axisLabels,
      borderLines,
    };

    if (showTitle) {
      retVal.title = {
        text: this.config.titleText,
        fill: this.themeConfig.quadrantTitleFill,
        fontSize: this.config.titleFontSize,
        horizontalPos: 'top',
        verticalPos: 'center',
        rotation: 0,
        y: this.config.titlePadding,
        x: this.config.chartWidth / 2,
      };
    }

    return retVal;
  }
}
