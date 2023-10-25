import { scaleLinear } from 'd3';
import { log } from '../../logger.js';
import type { BaseDiagramConfig, QuadrantChartConfig } from '../../config.type.js';
import defaultConfig from '../../defaultConfig.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import type { Point } from '../../types.js';

const defaultThemeVariables = getThemeVariables();

export type TextVerticalPos = 'left' | 'center' | 'right';
export type TextHorizontalPos = 'top' | 'middle' | 'bottom';

export interface QuadrantPointInputType extends Point {
  text: string;
}

export interface QuadrantTextType extends Point {
  text: string;
  fill: string;
  verticalPos: TextVerticalPos;
  horizontalPos: TextHorizontalPos;
  fontSize: number;
  rotation: number;
}

export interface QuadrantPointType extends Point {
  fill: string;
  radius: number;
  text: QuadrantTextType;
}

export interface QuadrantQuadrantsType extends Point {
  text: QuadrantTextType;
  width: number;
  height: number;
  fill: string;
}

export interface QuadrantLineType {
  strokeWidth: number;
  strokeFill: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface QuadrantBuildType {
  points: QuadrantPointType[];
  quadrants: QuadrantQuadrantsType[];
  axisLabels: QuadrantTextType[];
  title?: QuadrantTextType;
  borderLines?: QuadrantLineType[];
}

export interface quadrantBuilderData {
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
}

export interface QuadrantBuilderConfig
  extends Required<Omit<QuadrantChartConfig, keyof BaseDiagramConfig>> {
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

interface CalculateSpaceData {
  xAxisSpace: {
    top: number;
    bottom: number;
  };
  yAxisSpace: {
    left: number;
    right: number;
  };
  titleSpace: {
    top: number;
  };
  quadrantSpace: {
    quadrantLeft: number;
    quadrantTop: number;
    quadrantWidth: number;
    quadrantHalfWidth: number;
    quadrantHeight: number;
    quadrantHalfHeight: number;
  };
}

export class QuadrantBuilder {
  private config: QuadrantBuilderConfig;
  private themeConfig: QuadrantBuilderThemeConfig;
  private data: quadrantBuilderData;

  constructor() {
    this.config = this.getDefaultConfig();
    this.themeConfig = this.getDefaultThemeConfig();
    this.data = this.getDefaultData();
  }

  getDefaultData(): quadrantBuilderData {
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
    };
  }

  getDefaultConfig(): QuadrantBuilderConfig {
    return {
      showXAxis: true,
      showYAxis: true,
      showTitle: true,
      chartHeight: defaultConfig.quadrantChart?.chartWidth || 500,
      chartWidth: defaultConfig.quadrantChart?.chartHeight || 500,
      titlePadding: defaultConfig.quadrantChart?.titlePadding || 10,
      titleFontSize: defaultConfig.quadrantChart?.titleFontSize || 20,
      quadrantPadding: defaultConfig.quadrantChart?.quadrantPadding || 5,
      xAxisLabelPadding: defaultConfig.quadrantChart?.xAxisLabelPadding || 5,
      yAxisLabelPadding: defaultConfig.quadrantChart?.yAxisLabelPadding || 5,
      xAxisLabelFontSize: defaultConfig.quadrantChart?.xAxisLabelFontSize || 16,
      yAxisLabelFontSize: defaultConfig.quadrantChart?.yAxisLabelFontSize || 16,
      quadrantLabelFontSize: defaultConfig.quadrantChart?.quadrantLabelFontSize || 16,
      quadrantTextTopPadding: defaultConfig.quadrantChart?.quadrantTextTopPadding || 5,
      pointTextPadding: defaultConfig.quadrantChart?.pointTextPadding || 5,
      pointLabelFontSize: defaultConfig.quadrantChart?.pointLabelFontSize || 12,
      pointRadius: defaultConfig.quadrantChart?.pointRadius || 5,
      xAxisPosition: defaultConfig.quadrantChart?.xAxisPosition || 'top',
      yAxisPosition: defaultConfig.quadrantChart?.yAxisPosition || 'left',
      quadrantInternalBorderStrokeWidth:
        defaultConfig.quadrantChart?.quadrantInternalBorderStrokeWidth || 1,
      quadrantExternalBorderStrokeWidth:
        defaultConfig.quadrantChart?.quadrantExternalBorderStrokeWidth || 2,
    };
  }

  getDefaultThemeConfig(): QuadrantBuilderThemeConfig {
    return {
      quadrant1Fill: defaultThemeVariables.quadrant1Fill,
      quadrant2Fill: defaultThemeVariables.quadrant2Fill,
      quadrant3Fill: defaultThemeVariables.quadrant3Fill,
      quadrant4Fill: defaultThemeVariables.quadrant4Fill,
      quadrant1TextFill: defaultThemeVariables.quadrant1TextFill,
      quadrant2TextFill: defaultThemeVariables.quadrant2TextFill,
      quadrant3TextFill: defaultThemeVariables.quadrant3TextFill,
      quadrant4TextFill: defaultThemeVariables.quadrant4TextFill,
      quadrantPointFill: defaultThemeVariables.quadrantPointFill,
      quadrantPointTextFill: defaultThemeVariables.quadrantPointTextFill,
      quadrantXAxisTextFill: defaultThemeVariables.quadrantXAxisTextFill,
      quadrantYAxisTextFill: defaultThemeVariables.quadrantYAxisTextFill,
      quadrantTitleFill: defaultThemeVariables.quadrantTitleFill,
      quadrantInternalBorderStrokeFill: defaultThemeVariables.quadrantInternalBorderStrokeFill,
      quadrantExternalBorderStrokeFill: defaultThemeVariables.quadrantExternalBorderStrokeFill,
    };
  }

  clear() {
    this.config = this.getDefaultConfig();
    this.themeConfig = this.getDefaultThemeConfig();
    this.data = this.getDefaultData();
    log.info('clear called');
  }

  setData(data: Partial<quadrantBuilderData>) {
    this.data = { ...this.data, ...data };
  }

  addPoints(points: QuadrantPointInputType[]) {
    this.data.points = [...points, ...this.data.points];
  }

  setConfig(config: Partial<QuadrantBuilderConfig>) {
    log.trace('setConfig called with: ', config);
    this.config = { ...this.config, ...config };
  }

  setThemeConfig(themeConfig: Partial<QuadrantBuilderThemeConfig>) {
    log.trace('setThemeConfig called with: ', themeConfig);
    this.themeConfig = { ...this.themeConfig, ...themeConfig };
  }

  calculateSpace(
    xAxisPosition: typeof this.config.xAxisPosition,
    showXAxis: boolean,
    showYAxis: boolean,
    showTitle: boolean
  ): CalculateSpaceData {
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
    const quadrantSpace = {
      quadrantLeft,
      quadrantTop,
      quadrantWidth,
      quadrantHalfWidth,
      quadrantHeight,
      quadrantHalfHeight,
    };

    return {
      xAxisSpace,
      yAxisSpace,
      titleSpace,
      quadrantSpace,
    };
  }

  getAxisLabels(
    xAxisPosition: typeof this.config.xAxisPosition,
    showXAxis: boolean,
    showYAxis: boolean,
    spaceData: CalculateSpaceData
  ): QuadrantTextType[] {
    const { quadrantSpace, titleSpace } = spaceData;
    const {
      quadrantHalfHeight,
      quadrantHeight,
      quadrantLeft,
      quadrantHalfWidth,
      quadrantTop,
      quadrantWidth,
    } = quadrantSpace;

    const drawXAxisLabelsInMiddle = Boolean(this.data.xAxisRightText);
    const drawYAxisLabelsInMiddle = Boolean(this.data.yAxisTopText);

    const axisLabels: QuadrantTextType[] = [];

    if (this.data.xAxisLeftText && showXAxis) {
      axisLabels.push({
        text: this.data.xAxisLeftText,
        fill: this.themeConfig.quadrantXAxisTextFill,
        x: quadrantLeft + (drawXAxisLabelsInMiddle ? quadrantHalfWidth / 2 : 0),
        y:
          xAxisPosition === 'top'
            ? this.config.xAxisLabelPadding + titleSpace.top
            : this.config.xAxisLabelPadding +
              quadrantTop +
              quadrantHeight +
              this.config.quadrantPadding,
        fontSize: this.config.xAxisLabelFontSize,
        verticalPos: drawXAxisLabelsInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }
    if (this.data.xAxisRightText && showXAxis) {
      axisLabels.push({
        text: this.data.xAxisRightText,
        fill: this.themeConfig.quadrantXAxisTextFill,
        x: quadrantLeft + quadrantHalfWidth + (drawXAxisLabelsInMiddle ? quadrantHalfWidth / 2 : 0),
        y:
          xAxisPosition === 'top'
            ? this.config.xAxisLabelPadding + titleSpace.top
            : this.config.xAxisLabelPadding +
              quadrantTop +
              quadrantHeight +
              this.config.quadrantPadding,
        fontSize: this.config.xAxisLabelFontSize,
        verticalPos: drawXAxisLabelsInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }

    if (this.data.yAxisBottomText && showYAxis) {
      axisLabels.push({
        text: this.data.yAxisBottomText,
        fill: this.themeConfig.quadrantYAxisTextFill,
        x:
          this.config.yAxisPosition === 'left'
            ? this.config.yAxisLabelPadding
            : this.config.yAxisLabelPadding +
              quadrantLeft +
              quadrantWidth +
              this.config.quadrantPadding,
        y: quadrantTop + quadrantHeight - (drawYAxisLabelsInMiddle ? quadrantHalfHeight / 2 : 0),
        fontSize: this.config.yAxisLabelFontSize,
        verticalPos: drawYAxisLabelsInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }
    if (this.data.yAxisTopText && showYAxis) {
      axisLabels.push({
        text: this.data.yAxisTopText,
        fill: this.themeConfig.quadrantYAxisTextFill,
        x:
          this.config.yAxisPosition === 'left'
            ? this.config.yAxisLabelPadding
            : this.config.yAxisLabelPadding +
              quadrantLeft +
              quadrantWidth +
              this.config.quadrantPadding,
        y:
          quadrantTop + quadrantHalfHeight - (drawYAxisLabelsInMiddle ? quadrantHalfHeight / 2 : 0),
        fontSize: this.config.yAxisLabelFontSize,
        verticalPos: drawYAxisLabelsInMiddle ? 'center' : 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }
    return axisLabels;
  }

  getQuadrants(spaceData: CalculateSpaceData): QuadrantQuadrantsType[] {
    const { quadrantSpace } = spaceData;

    const { quadrantHalfHeight, quadrantLeft, quadrantHalfWidth, quadrantTop } = quadrantSpace;

    const quadrants: QuadrantQuadrantsType[] = [
      {
        text: {
          text: this.data.quadrant1Text,
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
          text: this.data.quadrant2Text,
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
          text: this.data.quadrant3Text,
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
          text: this.data.quadrant4Text,
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
      if (this.data.points.length === 0) {
        quadrant.text.y = quadrant.y + quadrant.height / 2;
        quadrant.text.horizontalPos = 'middle';
        // place the text top of the quadrant square
      } else {
        quadrant.text.y = quadrant.y + this.config.quadrantTextTopPadding;
        quadrant.text.horizontalPos = 'top';
      }
    }

    return quadrants;
  }

  getQuadrantPoints(spaceData: CalculateSpaceData): QuadrantPointType[] {
    const { quadrantSpace } = spaceData;

    const { quadrantHeight, quadrantLeft, quadrantTop, quadrantWidth } = quadrantSpace;

    const xAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantLeft, quadrantWidth + quadrantLeft]);

    const yAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantHeight + quadrantTop, quadrantTop]);

    const points: QuadrantPointType[] = this.data.points.map((point) => {
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
    return points;
  }

  getBorders(spaceData: CalculateSpaceData): QuadrantLineType[] {
    const halfExternalBorderWidth = this.config.quadrantExternalBorderStrokeWidth / 2;
    const { quadrantSpace } = spaceData;

    const {
      quadrantHalfHeight,
      quadrantHeight,
      quadrantLeft,
      quadrantHalfWidth,
      quadrantTop,
      quadrantWidth,
    } = quadrantSpace;

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
    return borderLines;
  }

  getTitle(showTitle: boolean): QuadrantTextType | undefined {
    if (showTitle) {
      return {
        text: this.data.titleText,
        fill: this.themeConfig.quadrantTitleFill,
        fontSize: this.config.titleFontSize,
        horizontalPos: 'top',
        verticalPos: 'center',
        rotation: 0,
        y: this.config.titlePadding,
        x: this.config.chartWidth / 2,
      };
    }
    return;
  }

  build(): QuadrantBuildType {
    const showXAxis =
      this.config.showXAxis && !!(this.data.xAxisLeftText || this.data.xAxisRightText);
    const showYAxis =
      this.config.showYAxis && !!(this.data.yAxisTopText || this.data.yAxisBottomText);
    const showTitle = this.config.showTitle && !!this.data.titleText;

    const xAxisPosition = this.data.points.length > 0 ? 'bottom' : this.config.xAxisPosition;

    const calculatedSpace = this.calculateSpace(xAxisPosition, showXAxis, showYAxis, showTitle);

    return {
      points: this.getQuadrantPoints(calculatedSpace),
      quadrants: this.getQuadrants(calculatedSpace),
      axisLabels: this.getAxisLabels(xAxisPosition, showXAxis, showYAxis, calculatedSpace),
      borderLines: this.getBorders(calculatedSpace),
      title: this.getTitle(showTitle),
    };
  }
}
