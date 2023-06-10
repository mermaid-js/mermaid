import { Dimension } from './Interfaces.js';

export interface ITextDimensionCalculator {
  getDimension(texts: string[], fontSize: number, fontFamily?: string ): Dimension;
}

export class TextDimensionCalculator implements ITextDimensionCalculator {
  constructor() {}
  getDimension(texts: string[], fontSize: number): Dimension {
    return {
      width: texts.reduce((acc, cur) => Math.max(cur.length, acc), 0) * fontSize,
      height: fontSize,
    };
  }
}
