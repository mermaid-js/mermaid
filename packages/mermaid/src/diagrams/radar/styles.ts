import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { RadarStyleOptions } from './types.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

const genIndexStyles = (
  themeVariables: ReturnType<typeof getThemeVariables>,
  radarOptions: RadarStyleOptions
) => {
  let sections = '';
  for (let i = 0; i < themeVariables.THEME_COLOR_LIMIT; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const indexColor = (themeVariables as any)[`cScale${i}`];
    sections += `
		.radarCurve-${i} {
			color: ${indexColor};
			fill: ${indexColor};
			fill-opacity: ${radarOptions.curveOpacity};
			stroke: ${indexColor};
			stroke-width: ${radarOptions.curveStrokeWidth};
		}
		.radarLegendBox-${i} {
			fill: ${indexColor};
			fill-opacity: ${radarOptions.curveOpacity};
			stroke: ${indexColor};
		}
		`;
  }
  return sections;
};

export const buildRadarStyleOptions = (radar?: RadarStyleOptions) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();

  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  const radarOptions: RadarStyleOptions = cleanAndMerge(themeVariables.radar, radar);

  return { themeVariables, radarOptions };
};

export const styles: DiagramStylesProvider = ({ radar }: { radar?: RadarStyleOptions } = {}) => {
  const { themeVariables, radarOptions } = buildRadarStyleOptions(radar);
  return `
	.radarTitle {
		font-size: ${themeVariables.fontSize};
		color: ${themeVariables.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${radarOptions.axisColor};
		stroke-width: ${radarOptions.axisStrokeWidth};
	}
	.radarAxisLabel {
		dominant-baseline: middle;
		text-anchor: middle;
		font-size: ${radarOptions.axisLabelFontSize}px;
		color: ${radarOptions.axisColor};
	}
	.radarGraticule {
		fill: ${radarOptions.graticuleColor};
		fill-opacity: ${radarOptions.graticuleOpacity};
		stroke: ${radarOptions.graticuleColor};
		stroke-width: ${radarOptions.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${radarOptions.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${genIndexStyles(themeVariables, radarOptions)}
	`;
};

export default styles;
