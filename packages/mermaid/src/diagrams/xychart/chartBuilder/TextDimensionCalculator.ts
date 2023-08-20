import { Dimension } from './Interfaces.js';
import { computeDimensionOfText } from '../../../rendering-util/createText.js';
import { SVGGType } from '../xychartDb.js';

export interface TextDimensionCalculator {
  getMaxDimension(texts: string[], fontSize: number): Dimension;
}

export class TextDimensionCalculatorWithFont implements TextDimensionCalculator {
  constructor(private parentGroup: SVGGType) {}
  getMaxDimension(texts: string[], fontSize: number): Dimension {
    if (!this.parentGroup) {
      return {
        width: texts.reduce((acc, cur) => Math.max(cur.length, acc), 0) * fontSize,
        height: fontSize,
      };
    }

    const dimension: Dimension = {
      width: 0,
      height: 0,
    };

    const elem = this.parentGroup
      .append('g')
      .attr('visibility', 'hidden')
      .attr('font-size', fontSize);

    for (const t of texts) {
      const bbox = computeDimensionOfText(elem, 1, t);
      dimension.width = Math.max(dimension.width, bbox.width);
      dimension.height = Math.max(dimension.height, bbox.height);
    }
    elem.remove();
    return dimension;
  }
}
