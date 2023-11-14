import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { PacketStyleOptions } from './types.js';

export const styles: DiagramStylesProvider = (options: { packet?: PacketStyleOptions } = {}) => {
  log.debug({ options });
  return `
	.packetByte {
		font-size: ${options.packet?.byteFontSize ?? '10px'};
	}
	.packetByte.start {
		fill: ${options.packet?.startByteColor ?? 'black'};
	}
	.packetByte.end {
		fill: ${options.packet?.endByteColor ?? 'black'};
	}
	.packetLabel {
		fill: ${options.packet?.labelColor ?? 'black'};
		font-size: ${options.packet?.labelFontSize ?? '12px'};
	}
	.packetTitle {
		fill: ${options.packet?.titleColor ?? 'black'};
		font-size: ${options.packet?.titleFontSize ?? '14px'};
	}
	.packetBlock {
		stroke: ${options.packet?.blockStrokeColor ?? 'black'};
		stroke-width: ${options.packet?.blockStrokeWidth ?? '1'};
		fill: ${options.packet?.blockFillColor ?? '#efefef'};
	}
	`;
};

export default styles;
