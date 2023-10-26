import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import type { PieStyleOptions } from './pieTypes.js';

const getStyles: DiagramStylesProvider = (options: PieStyleOptions) => {
  const {
    pieStrokeColor,
    pieStrokeWidth,
    pieOpacity,
    pieOuterStrokeColor,
    pieOuterStrokeWidth,
    pieTitleTextSize,
    pieTitleTextColor,
    fontFamily,
    pieSectionTextColor,
    pieSectionTextSize,
    pieLegendTextColor,
    pieLegendTextSize,
    customStyle1Color,
    customStyle1Size,
    customStyle2Color,
    customStyle2Size,
  } = options;

  return `
    .pieCircle {
      stroke: ${pieStrokeColor};
      stroke-width: ${pieStrokeWidth};
      opacity: ${pieOpacity};
    }
    .pieOuterCircle {
      stroke: ${pieOuterStrokeColor};
      stroke-width: ${pieOuterStrokeWidth};
      fill: none;
    }
    .pieTitleText {
      text-anchor: middle;
      font-size: ${pieTitleTextSize};
      fill: ${pieTitleTextColor};
      font-family: ${fontFamily};
    }
    .slice {
      font-family: ${fontFamily};
      fill: ${pieSectionTextColor};
      font-size: ${pieSectionTextSize};
    }
    .legend text {
      fill: ${pieLegendTextColor};
      font-family: ${fontFamily};
      font-size: ${pieLegendTextSize};
    }

    .customStyle1 {
      fill: ${customStyle1Color};
      font-size: ${customStyle1Size};
    }

    .customStyle2 {
      fill: ${customStyle2Color};
      font-size: ${customStyle2Size};
    }
  `;
};

export default getStyles;
