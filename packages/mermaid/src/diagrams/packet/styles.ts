import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { PacketStyleOptions } from './types.js';

export const styles: DiagramStylesProvider = (options: { packet?: PacketStyleOptions } = {}) => {
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
