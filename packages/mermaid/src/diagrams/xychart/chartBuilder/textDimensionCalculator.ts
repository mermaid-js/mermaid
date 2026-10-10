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

    // computeDimensionOfText measures in screen pixels. When the SVG is scaled to fit its
    // container (useMaxWidth), convert back to SVG user units so layout matches drawing.
    const ctm = elem.node()?.getScreenCTM?.();
    const toScale = (s: number | undefined) => (s && s > 0 ? s : 1);
    const scaleX = toScale(ctm?.a);
    const scaleY = toScale(ctm?.d);

    for (const t of texts) {
      const bbox = computeDimensionOfText(elem, 1, t);
      const width = bbox ? bbox.width / scaleX : t.length * fontSize;
      const height = bbox ? bbox.height / scaleY : fontSize;
      dimension.width = Math.max(dimension.width, width);
      dimension.height = Math.max(dimension.height, height);
    }
    elem.remove();
    return dimension;
  }
}
