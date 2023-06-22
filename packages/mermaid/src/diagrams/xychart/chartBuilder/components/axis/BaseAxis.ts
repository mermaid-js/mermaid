import { Dimension, Point, DrawableElem, BoundingRect, AxisConfig } from '../../Interfaces.js';
import { AxisPosition, IAxis } from './index.js';
import { ITextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { log } from '../../../../../logger.js';

export abstract class BaseAxis implements IAxis {
  protected boundingRect: BoundingRect = { x: 0, y: 0, width: 0, height: 0 };
  protected axisPosition: AxisPosition = 'left';
  private range: [number, number];
  protected showTitle = false;
  protected showLabel = false;
  protected showTick = false;
  protected innerPadding = 0;

  constructor(
    protected axisConfig: AxisConfig,
    protected title: string,
    protected textDimensionCalculator: ITextDimensionCalculator
  ) {
    this.range = [0, 10];
    this.boundingRect = { x: 0, y: 0, width: 0, height: 0 };
    this.axisPosition = 'left';
  }

  setRange(range: [number, number]): void {
    this.range = range;
    this.recalculateScale();
  }

  getRange(): [number, number] {
    return [this.range[0] + this.innerPadding, this.range[1] - this.innerPadding];
  }

  setAxisPosition(axisPosition: AxisPosition): void {
    this.axisPosition = axisPosition;
  }

  abstract getScaleValue(value: number | string): number;

  abstract recalculateScale(): void;

  abstract getTickValues(): Array<string | number>;

  getTickDistance(): number {
    return Math.abs(this.range[0] - this.range[1]) / this.getTickValues().length;
  }

  getTickInnerPadding(): number {
    return this.innerPadding * 2;
    // return Math.abs(this.range[0] - this.range[1]) / this.getTickValues().length;
  }

  private getLabelDimension(): Dimension {
    return this.textDimensionCalculator.getDimension(
      this.getTickValues().map((tick) => tick.toString()),
      this.axisConfig.labelFontSize
    );
  }

  private calculateSpaceIfDrawnHorizontally(availableSpace: Dimension) {
    let availableHeight = availableSpace.height;
    if (this.axisConfig.showLabel) {
      const spaceRequired = this.getLabelDimension();
      this.innerPadding = spaceRequired.width / 2;
      const heightRequired = spaceRequired.height + this.axisConfig.lablePadding * 2;
      log.trace('height required for axis label: ', heightRequired);
      if (heightRequired <= availableHeight) {
        availableHeight -= heightRequired;
        this.showLabel = true;
      }
    }
    if (this.axisConfig.showTick && availableHeight >= this.axisConfig.tickLength) {
      this.showTick = true;
      availableHeight -= this.axisConfig.tickLength;
    }
    if (this.axisConfig.showTitle) {
      const spaceRequired = this.textDimensionCalculator.getDimension(
        [this.title],
        this.axisConfig.labelFontSize
      );
      const heightRequired = spaceRequired.height + this.axisConfig.titlePadding * 2;
      log.trace('height required for axis title: ', heightRequired);
      if (heightRequired <= availableHeight) {
        availableHeight -= heightRequired;
        this.showTitle = true;
      }
    }
    this.boundingRect.width = availableSpace.width;
    this.boundingRect.height = availableSpace.height - availableHeight;
  }

  private calculateSpaceIfDrawnVertical(availableSpace: Dimension) {
    let availableWidth = availableSpace.width;
    if (this.axisConfig.showLabel) {
      const spaceRequired = this.getLabelDimension();
      this.innerPadding = spaceRequired.height / 2;
      const widthRequired = spaceRequired.width + this.axisConfig.lablePadding * 2;
      log.trace('width required for axis label: ', widthRequired);
      if (widthRequired <= availableWidth) {
        availableWidth -= widthRequired;
        this.showLabel = true;
      }
    }
    if (this.axisConfig.showTick && availableWidth >= this.axisConfig.tickLength) {
      this.showTick = true;
      availableWidth -= this.axisConfig.tickLength;
    }
    if (this.axisConfig.showTitle) {
      const spaceRequired = this.textDimensionCalculator.getDimension(
        [this.title],
        this.axisConfig.labelFontSize
      );
      const widthRequired = spaceRequired.height + this.axisConfig.lablePadding * 2;
      log.trace('width required for axis title: ', widthRequired);
      if (widthRequired <= availableWidth) {
        availableWidth -= widthRequired;
        this.showTitle = true;
      }
    }
    this.boundingRect.width = availableSpace.width - availableWidth;
    this.boundingRect.height = availableSpace.height;
  }

  calculateSpace(availableSpace: Dimension): Dimension {
    if (!(this.axisConfig.showLabel || this.axisConfig.showTitle)) {
      this.recalculateScale();
      return { width: 0, height: 0 };
    }
    if (this.axisPosition === 'left' || this.axisPosition === 'right') {
      this.calculateSpaceIfDrawnVertical(availableSpace);
    } else {
      this.calculateSpaceIfDrawnHorizontally(availableSpace);
    }
    this.recalculateScale();
    return {
      width: this.boundingRect.width,
      height: this.boundingRect.height,
    };
  }

  setBoundingBoxXY(point: Point): void {
    this.boundingRect.x = point.x;
    this.boundingRect.y = point.y;
  }

  private getDrawaableElementsForLeftAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['left-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x:
            this.boundingRect.x +
            this.boundingRect.width -
            this.axisConfig.lablePadding -
            this.axisConfig.tickLength,
          y: this.getScaleValue(tick),
          fill: this.axisConfig.labelFill,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'right',
          horizontalPos: 'middle',
        })),
      });
    }
    if (this.showTick) {
      const x = this.boundingRect.x + this.boundingRect.width;
      drawableElement.push({
        type: 'path',
        groupTexts: ['left-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${x},${this.getScaleValue(tick)} L ${
            x - this.axisConfig.tickLength
          },${this.getScaleValue(tick)}`,
          strokeFill: this.axisConfig.tickFill,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['left-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.boundingRect.x + this.axisConfig.titlePadding,
            y: this.range[0] + (this.range[1] - this.range[0]) / 2,
            fill: this.axisConfig.titleFill,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 270,
            verticalPos: 'center',
            horizontalPos: 'top',
          },
        ],
      });
    }
    return drawableElement;
  }
  private getDrawaableElementsForBottomAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.getScaleValue(tick),
          y: this.boundingRect.y + this.axisConfig.lablePadding + this.axisConfig.tickLength,
          fill: this.axisConfig.labelFill,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'center',
          horizontalPos: 'top',
        })),
      });
    }
    if (this.showTick) {
      const y = this.boundingRect.y;
      drawableElement.push({
        type: 'path',
        groupTexts: ['bottom-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${this.getScaleValue(tick)},${y} L ${this.getScaleValue(tick)},${
            y + this.axisConfig.tickLength
          }`,
          strokeFill: this.axisConfig.tickFill,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.range[0] + (this.range[1] - this.range[0]) / 2,
            y: this.boundingRect.y + this.boundingRect.height - this.axisConfig.titlePadding,
            fill: this.axisConfig.titleFill,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 0,
            verticalPos: 'center',
            horizontalPos: 'bottom',
          },
        ],
      });
    }
    return drawableElement;
  }
  private getDrawaableElementsForTopAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'label'],
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.getScaleValue(tick),
          y: this.boundingRect.y + this.boundingRect.height - this.axisConfig.lablePadding - this.axisConfig.tickLength,
          fill: this.axisConfig.labelFill,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'center',
          horizontalPos: 'bottom',
        })),
      });
    }
    if (this.showTick) {
      const y = this.boundingRect.y;
      drawableElement.push({
        type: 'path',
        groupTexts: ['bottom-axis', 'ticks'],
        data: this.getTickValues().map((tick) => ({
          path: `M ${this.getScaleValue(tick)},${y + this.boundingRect.height} L ${this.getScaleValue(tick)},${
            y + this.boundingRect.height - this.axisConfig.tickLength
          }`,
          strokeFill: this.axisConfig.tickFill,
          strokeWidth: this.axisConfig.tickWidth,
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupTexts: ['bottom-axis', 'title'],
        data: [
          {
            text: this.title,
            x: this.range[0] + (this.range[1] - this.range[0]) / 2,
            y: this.boundingRect.y + this.axisConfig.titlePadding,
            fill: this.axisConfig.titleFill,
            fontSize: this.axisConfig.titleFontSize,
            rotation: 0,
            verticalPos: 'center',
            horizontalPos: 'top',
          },
        ],
      });
    }
    return drawableElement;
  }

  getDrawableElements(): DrawableElem[] {
    if (this.axisPosition === 'left') {
      return this.getDrawaableElementsForLeftAxis();
    }
    if (this.axisPosition === 'right') {
      throw Error("Drawing of right axis is not implemented");
    }
    if (this.axisPosition === 'bottom') {
      return this.getDrawaableElementsForBottomAxis();
    }
    if (this.axisPosition === 'top') {
      return this.getDrawaableElementsForTopAxis();
    }
    return [];
  }
}
