import { scaleLinear } from 'd3';

export class QuadrantBuilder {
  totalWidth = 500;
  totalHeight = 500;
  quadrantPadding = 5;
  xAxisLabelPadding = 5;
  yAxisLabelPadding = 5;
  xAxisLabelFontSize = 16;
  yAxisLabelFontSize = 16;
  quadrantLabelFontSize = 16;
  quadrantTextTopPadding = 5;
  pointTextPadding = 5;
  pointLabelFontSize = 12;
  pointRadius = 5;
  points = [];
  quadrant1Text = '';
  quadrant2Text = '';
  quadrant3Text = '';
  quadrant4Text = '';
  xAxisLeftText = '';
  xAxisRightText = '';
  yAxisBottomText = '';
  yAxisTopText = '';
  xAxisPosition = 'top';
  yAxisPosition = 'left';
  quadrant1Fill = '#8bc2f3';
  quadrant2Fill = '#faebd7';
  quadrant3Fill = '#00ffff';
  quadrant4Fill = '#f0ffff';
  quadrant1TextFill = '#93690e';
  quadrant2TextFill = '#8644ff';
  quadrant3TextFill = '#e3004d';
  quadrant4TextFill = '#000000';
  pointFill = '#60B19C';
  pointTextFill = '#0000ff';
  xAxisTextFill = '#000000';
  yAxisTextFill = '#000000';
  showXAxis = true;
  showYAxis = true;

  constructor() {}

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

  addPoints(points) {
    this.points = this.points.concat([...points]);
  }

  set quadrant1Text(text) {
    this.quadrant1Text = text;
  }

  set quadrant2Text(text) {
    this.quadrant2Text = text;
  }

  set quadrant3Text(text) {
    this.quadrant3Text = text;
  }

  set quadrant4Text(text) {
    this.quadrant4Text = text;
  }

  set xAxisLeftText(text) {
    this.xAxisLeftText = text;
  }

  set xAxisRightText(text) {
    this.xAxisRightText = text;
  }

  set yAxisTopText(text) {
    this.yAxisTopText = text;
  }

  set yAxisBottomText(text) {
    this.yAxisBottomText = text;
  }

  set totalWidth(width) {
    this.totalWidth = width;
  }

  set totalHeight(height) {
    this.totalHeight = height;
  }

  build() {
    const showXAxis = (!this.xAxisLeftText && !this.xAxisRightText) ? false: this.showXAxis;
    const showYAxis = (!this.yAxisTopText && !this.yAxisBottomText) ? false: this.showYAxis;
    const quadrantLeft =
      this.quadrantPadding +
      ((this.yAxisPosition === 'left' && showYAxis) ? this.yAxisLabelPadding * 2 + this.yAxisLabelFontSize : 0);
    const quadrantTop =
      this.quadrantPadding +
      ((this.xAxisPosition === 'top' && showXAxis) ? this.xAxisLabelPadding * 2 + this.xAxisLabelFontSize : 0);
    const quadrantWidth =
      this.totalWidth -
      (this.quadrantPadding * 2 + (showYAxis ? this.yAxisLabelPadding * 2 + this.yAxisLabelFontSize: 0));
    const quadrantHeight =
      this.totalHeight -
      (this.quadrantPadding * 2 + (showXAxis ? this.xAxisLabelPadding * 2 + this.xAxisLabelFontSize: 0));

    const quadrantHalfWidth = quadrantWidth / 2;
    const quadrantHalfHeight = quadrantHeight / 2;

    const axisLabels = [];

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

    const quadrants = [
      {
        text: this.quadrant1Text,
        textFill: this.quadrant1TextFill,
        x: quadrantLeft + quadrantHalfWidth,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant1Fill,
      },
      {
        text: this.quadrant2Text,
        textFill: this.quadrant2TextFill,
        x: quadrantLeft,
        y: quadrantTop,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant2Fill,
      },
      {
        text: this.quadrant3Text,
        textFill: this.quadrant3TextFill,
        x: quadrantLeft,
        y: quadrantTop + quadrantHalfHeight,
        width: quadrantHalfWidth,
        height: quadrantHalfHeight,
        fill: this.quadrant3Fill,
      },
      {
        text: this.quadrant4Text,
        textFill: this.quadrant4TextFill,
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
        quadrant.text = {
          text: quadrant.text,
          fill: quadrant.textFill,
          x: quadrant.x + quadrant.width / 2,
          y: quadrant.y + quadrant.height / 2,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'center',
          rotation: 0,
        };
        // place the text top of the quadrant square
      } else {
        quadrant.text = {
          text: quadrant.text,
          fill: quadrant.textFill,
          x: quadrant.x + quadrant.width / 2,
          y: quadrant.y + this.quadrantTextTopPadding,
          fontSize: this.quadrantLabelFontSize,
          verticalPos: 'center',
          horizontalPos: 'top',
          rotation: 0,
        };
      }
      delete quadrant.textFill;
    });

    const xAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantLeft, quadrantWidth + quadrantLeft]);

    const yAxis = scaleLinear()
      .domain([0, 1])
      .range([quadrantHeight + quadrantTop, quadrantTop]);

    const points = this.points.map((point) => {
      const props = {
        x: xAxis(point.x),
        y: yAxis(point.y),
        fill: this.pointFill,
        radius: this.pointRadius,
      };
      props.text = {
        text: point.text,
        fill: this.pointTextFill,
        x: props.x,
        y: props.y + this.pointTextPadding,
        verticalPos: 'center',
        horizontalPos: 'top',
        fontSize: this.pointLabelFontSize,
        rotation: 0,
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
