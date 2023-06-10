import {
  Dimension,
  Point,
  DrawableElem,
  BoundingRect,
  AxisConfig,
} from '../../Interfaces.js';
import { AxisPosition, IAxis } from './index.js';
import { ITextDimensionCalculator } from '../../TextDimensionCalculator.js';
import { log } from '../../../../../logger.js';

export abstract class BaseAxis implements IAxis {
  protected boundingRect: BoundingRect = {x: 0, y: 0, width: 0, height: 0};
  protected axisPosition: AxisPosition = 'left';
  private range: [number, number];
  protected showTitle = false;
  protected showLabel = false;
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

  private getLabelDimension(): Dimension {
    return this.textDimensionCalculator.getDimension(
      this.getTickValues().map((tick) => tick.toString()),
      this.axisConfig.labelFontSize
    );
  }

  private calculateSpaceIfDrawnVertical(availableSpace: Dimension) {
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

  private calculateSpaceIfDrawnHorizontally(availableSpace: Dimension) {
    let availableWidth = availableSpace.width;
    if (this.axisConfig.showLabel) {
      const spaceRequired = this.getLabelDimension();
      this.innerPadding = spaceRequired.width / 2;
      const widthRequired = spaceRequired.width + this.axisConfig.lablePadding * 2;
      log.trace('width required for axis label: ', widthRequired);
      if (widthRequired <= availableWidth) {
        availableWidth -= widthRequired;
        this.showLabel = true;
      }
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
    if (this.axisPosition === 'left') {
      this.calculateSpaceIfDrawnHorizontally(availableSpace);
    } else {
      this.calculateSpaceIfDrawnVertical(availableSpace);
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
        groupText: 'left-axis-label',
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.boundingRect.x + this.boundingRect.width - this.axisConfig.lablePadding,
          y: this.getScaleValue(tick),
          fill: this.axisConfig.labelColor,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'right',
          horizontalPos: 'middle',
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupText: 'right-axis-label',
        data: [{
          text: this.title,
          x: this.boundingRect.x + this.axisConfig.titlePadding,
          y: this.range[0] + (this.range[1] - this.range[0])/2,
          fill: this.axisConfig.titleColor,
          fontSize: this.axisConfig.titleFontSize,
          rotation: 270,
          verticalPos: 'center',
          horizontalPos: 'top',
        }]
      })
    }
    return drawableElement;
  }
  private getDrawaableElementsForBottomAxis(): DrawableElem[] {
    const drawableElement: DrawableElem[] = [];
    if (this.showLabel) {
      drawableElement.push({
        type: 'text',
        groupText: 'right-axis-lable',
        data: this.getTickValues().map((tick) => ({
          text: tick.toString(),
          x: this.getScaleValue(tick),
          y: this.boundingRect.y + this.axisConfig.lablePadding,
          fill: this.axisConfig.labelColor,
          fontSize: this.axisConfig.labelFontSize,
          rotation: 0,
          verticalPos: 'center',
          horizontalPos: 'top',
        })),
      });
    }
    if (this.showTitle) {
      drawableElement.push({
        type: 'text',
        groupText: 'right-axis-label',
        data: [{
          text: this.title,
          x: this.range[0] + (this.range[1] - this.range[0])/2,
          y: this.boundingRect.y + this.boundingRect.height - this.axisConfig.titlePadding,
          fill: this.axisConfig.titleColor,
          fontSize: this.axisConfig.titleFontSize,
          rotation: 0,
          verticalPos: 'center',
          horizontalPos: 'bottom',
        }]
      })
    }
    return drawableElement;
  }

  getDrawableElements(): DrawableElem[] {
    if (this.axisPosition === 'left') {
      return this.getDrawaableElementsForLeftAxis();
    }
    if (this.axisPosition === 'bottom') {
      return this.getDrawaableElementsForBottomAxis();
    }
    return [];
  }
}
