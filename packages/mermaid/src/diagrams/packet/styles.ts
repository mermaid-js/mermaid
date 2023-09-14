import { log } from '../../logger.js';

export const styles = (options: any = {}) => {
  log.debug({ options });
  return `
	.byte {
		font-size: ${options.packet?.byteFontSize ?? '10px'};
	}
	.byte.start {
		fill: ${options.packet?.startByteColor ?? 'black'};
	}
	.byte.end {
		fill: ${options.packet?.endByteColor ?? 'black'};
	}
	.label {
		fill: ${options.packet?.labelColor ?? 'black'};
		font-size: ${options.packet?.labelFontSize ?? '12px'};
	}
	.block {
		stroke: ${options.packet?.blockStrokeColor ?? 'black'};
		stroke-width: ${options.packet?.blockStrokeWidth ?? '1'};
		fill: ${options.packet?.blockFillColor ?? '#efefef'};
	}
	`;
};

export default styles;
