// @ts-ignore: TODO Fix ts errors
import { scaleLinear } from 'd3';

export type QuadrantPointInputType = { x: number; y: number; text: string };

export type TextVerticalPos = 'left' | 'center' | 'right';
export type TextHorizontalPos = 'top' | 'middle' | 'bottom';

export type QuadrantTextType = {
  text: string;
  fill: string;
  x: number;
  y: number;
  verticalPos: TextVerticalPos;
  horizontalPos: TextHorizontalPos;
  fontSize: number;
  rotation: number;
};

export type QuadrantPointType = {
  x: number;
  y: number;
  fill: string;
  radius: number;
  text: QuadrantTextType;
};

export type QuadrantQuadrantsType = {
  text: QuadrantTextType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type QuadrantBuildType = {
  points: QuadrantPointType[];
  quadrants: QuadrantQuadrantsType[];
  axisLabels: QuadrantTextType[];
};

export class QuadrantBuilder {
  private _quadrant1Text = '';
  private _quadrant2Text = '';
  private _quadrant3Text = '';
  private _quadrant4Text = '';
  private _xAxisLeftText = '';
  private _xAxisRightText = '';
  private _yAxisBottomText = '';
  private _yAxisTopText = '';
  private _totalHeight = 500;
  private _totalWidth = 500;
  public quadrantPadding = 5;
  public xAxisLabelPadding = 5;
  public yAxisLabelPadding = 5;
  public xAxisLabelFontSize = 16;
  public yAxisLabelFontSize = 16;
  public quadrantLabelFontSize = 16;
  public quadrantTextTopPadding = 5;
  public pointTextPadding = 5;
  public pointLabelFontSize = 12;
  public pointRadius = 5;
  public points: QuadrantPointInputType[] = [];
  public xAxisPosition = 'top';
  public yAxisPosition = 'left';
  public quadrant1Fill = '#8bc2f3';
  public quadrant2Fill = '#faebd7';
  public quadrant3Fill = '#00ffff';
  public quadrant4Fill = '#f0ffff';
  public quadrant1TextFill = '#93690e';
  public quadrant2TextFill = '#8644ff';
  public quadrant3TextFill = '#e3004d';
  public quadrant4TextFill = '#000000';
  public pointFill = '#60B19C';
  public pointTextFill = '#0000ff';
  public xAxisTextFill = '#000000';
  public yAxisTextFill = '#000000';
  public showXAxis = true;
  public showYAxis = true;

  clear() {
    this.points = [];
    this.quadrant1Text = '';
    this.quadrant2Text = '';
    this.quadrant3Text = '';
    this.quadrant4Text = '';
    this.xAxisLeftText = '';
    this.xAxisRightText = '';
    this.yAxisBottomText = '';
    this.yAxisTopText = '';
  }

  addPoints(points: QuadrantPointInputType[]) {
    this.points = [...points, ...this.points];
  }

  set quadrant1Text(text: string) {
    this._quadrant1Text = text;
  }

  get quadrant1Text() {
    return this._quadrant1Text;
  }

  set quadrant2Text(text: string) {
    this._quadrant2Text = text;
  }

  get quadrant2Text() {
    return this._quadrant2Text;
  }

  set quadrant3Text(text: string) {
    this._quadrant3Text = text;
  }

  get quadrant3Text() {
    return this._quadrant3Text;
  }

  set quadrant4Text(text: string) {
    this._quadrant4Text = text;
  }

  get quadrant4Text() {
    return this._quadrant4Text;
  }

  set xAxisLeftText(text: string) {
    this._xAxisLeftText = text;
  }

  get xAxisLeftText() {
    return this._xAxisLeftText;
  }

  set xAxisRightText(text: string) {
    this._xAxisRightText = text;
  }

  get xAxisRightText() {
    return this._xAxisRightText;
  }

  set yAxisTopText(text: string) {
    this._yAxisTopText = text;
  }

  get yAxisTopText() {
    return this._yAxisTopText;
  }

  set yAxisBottomText(text: string) {
    this._yAxisBottomText = text;
  }

  get yAxisBottomText() {
    return this._yAxisBottomText;
  }

  set totalWidth(width: number) {
    this._totalWidth = width;
  }

  get totalWidth() {
    return this._totalWidth;
  }

  set totalHeight(height: number) {
    this._totalHeight = height;
  }

  get totalHeight() {
    return this._totalHeight;
  }

  build(): QuadrantBuildType {
    const showXAxis = !this.xAxisLeftText && !this.xAxisRightText ? false : this.showXAxis;
    const showYAxis = !this.yAxisTopText && !this.yAxisBottomText ? false : this.showYAxis;
    const quadrantLeft =
      this.quadrantPadding +
      (this.yAxisPosition === 'left' && showYAxis
        ? this.yAxisLabelPadding * 2 + this.yAxisLabelFontSize
        : 0);
    const quadrantTop =
      this.quadrantPadding +
      (this.xAxisPosition === 'top' && showXAxis
        ? this.xAxisLabelPadding * 2 + this.xAxisLabelFontSize
        : 0);
    const quadrantWidth =
      this.totalWidth -
      (this.quadrantPadding * 2 +
        (showYAxis ? this.yAxisLabelPadding * 2 + this.yAxisLabelFontSize : 0));
    const quadrantHeight =
      this.totalHeight -
      (this.quadrantPadding * 2 +
        (showXAxis ? this.xAxisLabelPadding * 2 + this.xAxisLabelFontSize : 0));

    const quadrantHalfWidth = quadrantWidth / 2;
    const quadrantHalfHeight = quadrantHeight / 2;

    const axisLabels: QuadrantTextType[] = [];

    if (this.xAxisLeftText && showXAxis) {
      axisLabels.push({
        text: this.xAxisLeftText,
        fill: this.xAxisTextFill,
        x: quadrantLeft,
        y:
          this.xAxisPosition === 'top'
            ? this.xAxisLabelPadding
            : this.xAxisLabelPadding + quadrantTop + quadrantHeight,
        fontSize: this.xAxisLabelFontSize,
        verticalPos: 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }
    if (this.xAxisRightText && showXAxis) {
      axisLabels.push({
        text: this.xAxisRightText,
        fill: this.xAxisTextFill,
        x: quadrantLeft + quadrantHalfWidth,
        y:
          this.xAxisPosition === 'top'
            ? this.xAxisLabelPadding
            : this.xAxisLabelPadding + quadrantTop + quadrantHeight,
        fontSize: this.xAxisLabelFontSize,
        verticalPos: 'left',
        horizontalPos: 'top',
        rotation: 0,
      });
    }

    if (this.yAxisBottomText && showYAxis) {
      axisLabels.push({
        text: this.yAxisBottomText,
        fill: this.yAxisTextFill,
        x:
          this.yAxisPosition === 'left'
            ? this.yAxisLabelPadding
            : this.yAxisLabelPadding + quadrantLeft + quadrantWidth,
        y: quadrantTop + quadrantHeight,
        fontSize: this.yAxisLabelFontSize,
        verticalPos: 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }
    if (this.yAxisTopText && showYAxis) {
      axisLabels.push({
        text: this.yAxisTopText,
        fill: this.yAxisTextFill,
        x:
          this.yAxisPosition === 'left'
            ? this.yAxisLabelPadding
            : this.yAxisLabelPadding + quadrantLeft + quadrantWidth,
        y: quadrantTop + quadrantHalfHeight,
        fontSize: this.yAxisLabelFontSize,
        verticalPos: 'left',
        horizontalPos: 'top',
        rotation: -90,
      });
    }

    const quadrants: QuadrantQuadrantsType[] = [
      {
        text: {
          text: this.quadrant1Text,
          fill: this.quadrant1TextFill,
          x: 0,
          y: 0,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft + quadrantHalfWidth,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant1Fill,
      },
      {
        text: {
          text: this.quadrant2Text,
          fill: this.quadrant2TextFill,
          x: 0,
          y: 0,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant2Fill,
      },
      {
        text: {
          text: this.quadrant3Text,
          fill: this.quadrant3TextFill,
          x: 0,
          y: 0,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft,
        y: quadrantTop + quadrantHalfHeight,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant3Fill,
      },
      {
        text: {
          text: this.quadrant4Text,
          fill: this.quadrant4TextFill,
          x: 0,
          y: 0,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'middle',
          rotation: 0,
        },
        x: quadrantLeft + quadrantHalfWidth,
        y: quadrantTop + quadrantHalfHeight,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant4Fill,
      },
    ];
    quadrants.forEach((quadrant, i) => {
      // place the text in the center of the box
      if (this.points.length === 0) {
        quadrant.text.x = quadrant.x + quadrant.width / 2;
        quadrant.text.y = quadrant.y + quadrant.height / 2;
        quadrant.text.horizontalPos = 'middle';
        // place the text top of the quadrant square
      } else {
        quadrant.text.x = quadrant.x + quadrant.width / 2;
        quadrant.text.y = quadrant.y + this.quadrantTextTopPadding;
        quadrant.text.horizontalPos = 'top';
      }
    });

    const xAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantLeft, quadrantWidth + quadrantLeft]);

    const yAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantHeight + quadrantTop, quadrantTop]);

    const points: QuadrantPointType[] = this.points.map((point) => {
      const props: QuadrantPointType = {
        x: xAxis(point.x),
        y: yAxis(point.y),
        fill: this.pointFill,
        radius: this.pointRadius,
        text: {
          text: point.text,
          fill: this.pointTextFill,
          x: xAxis(point.x),
          y: yAxis(point.y) + this.pointTextPadding,
          verticalPos: 'center',
          horizontalPos: 'top',
          fontSize: this.pointLabelFontSize,
          rotation: 0,
        },
      };
      return props;
    });

    return {
      points,
      quadrants,
      axisLabels,
    };
  }
}
