import type { SVGGroup } from '../../../diagram-api/types.js';
import { computeDimensionOfText } from '../../../rendering-util/createText.js';
import type { Dimension } from './interfaces.js';

export interface TextDimensionCalculator {
  getMaxDimension(texts: string[], fontSize: number): Dimension;
}

export class TextDimensionCalculatorWithFont implements TextDimensionCalculator {
  constructor(private parentGroup: SVGGroup) {}
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
      const width = bbox ? bbox.width : t.length * fontSize;
      const height = bbox ? bbox.height : fontSize;
      dimension.width = Math.max(dimension.width, width);
      dimension.height = Math.max(dimension.height, height);
    }
    elem.remove();
    return dimension;
  }
}
