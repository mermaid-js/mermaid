import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import { getThemeVariables } from '../../themes/theme-default.js';
import { getConfig as getConfigAPI } from '../../config.js';

export interface CynefinStyleOptions {
  domainOpacity?: number;
  boundaryColor?: string;
  boundaryStrokeWidth?: number;
  cliffColor?: string;
  cliffStrokeWidth?: number;
  confusionOpacity?: number;
  labelFontSize?: number;
  subtitleFontSize?: number;
  itemFontSize?: number;
  itemFill?: string;
  itemStroke?: string;
  arrowColor?: string;
  arrowStrokeWidth?: number;
  arrowLabelFontSize?: number;
}

export const buildCynefinStyleOptions = (cynefin?: CynefinStyleOptions) => {
  const defaultThemeVariables = getThemeVariables();
  const currentConfig = getConfigAPI();

  const themeVariables = cleanAndMerge(defaultThemeVariables, currentConfig.themeVariables);
  const cynefinOptions: CynefinStyleOptions = cleanAndMerge(
    {
      domainOpacity: 0.3,
      boundaryColor: themeVariables.lineColor ?? '#333',
      boundaryStrokeWidth: 1.5,
      cliffColor: themeVariables.lineColor ?? '#222',
      cliffStrokeWidth: 3,
      confusionOpacity: 0.35,
      labelFontSize: 18,
      subtitleFontSize: 11,
      itemFontSize: 12,
      itemFill: themeVariables.mainBkg ?? '#fff',
      itemStroke: themeVariables.border1 ?? '#ccc',
      arrowColor: themeVariables.lineColor ?? '#555',
      arrowStrokeWidth: 2,
      arrowLabelFontSize: 11,
    } as CynefinStyleOptions,
    cynefin
  );

  return { themeVariables, cynefinOptions };
};

export const styles: DiagramStylesProvider = ({
  cynefin,
}: { cynefin?: CynefinStyleOptions } = {}) => {
  const { themeVariables, cynefinOptions } = buildCynefinStyleOptions(cynefin);
  return `
	.cynefinDomain {
		stroke: none;
	}
	.cynefinDomainLabel {
		font-size: ${cynefinOptions.labelFontSize}px;
		font-weight: bold;
		fill: ${themeVariables.primaryTextColor ?? '#222'};
		color: ${themeVariables.primaryTextColor ?? '#222'};
	}
	.cynefinSubtitle {
		font-size: ${cynefinOptions.subtitleFontSize}px;
		fill: ${themeVariables.secondaryTextColor ?? '#555'};
		color: ${themeVariables.secondaryTextColor ?? '#555'};
		font-style: italic;
	}
	.cynefinItem rect {
		fill: ${cynefinOptions.itemFill};
		stroke: ${cynefinOptions.itemStroke};
		stroke-width: 1;
	}
	.cynefinItem text {
		font-size: ${cynefinOptions.itemFontSize}px;
		fill: ${themeVariables.primaryTextColor ?? '#222'};
	}
	.cynefinBoundary {
		stroke: ${cynefinOptions.boundaryColor};
		stroke-width: ${cynefinOptions.boundaryStrokeWidth};
		stroke-dasharray: 6 3;
	}
	.cynefinCliff {
		stroke: ${cynefinOptions.cliffColor};
		stroke-width: ${cynefinOptions.cliffStrokeWidth};
	}
	.cynefinConfusion {
		stroke-dasharray: 4 2;
	}
	.cynefinArrowLine {
		stroke: ${cynefinOptions.arrowColor};
		stroke-width: ${cynefinOptions.arrowStrokeWidth};
		fill: none;
	}
	.cynefinArrowHead {
		fill: ${cynefinOptions.arrowColor};
		stroke: none;
	}
	.cynefinArrowLabel {
		font-size: ${cynefinOptions.arrowLabelFontSize}px;
		fill: ${themeVariables.primaryTextColor ?? '#333'};
	}
	`;
};

export default styles;
