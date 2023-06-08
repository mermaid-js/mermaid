import { Dimension } from './Interfaces.js';

export interface ITextDimensionCalculator {
  getDimension(text: string): Dimension;
}

export class TextDimensionCalculator implements ITextDimensionCalculator {
  constructor(private fontSize: number, private fontFamily: string) {}
  getDimension(text: string): Dimension {
    return {
      width: text.length * this.fontSize,
      height: this.fontSize,
    };
  }
}
