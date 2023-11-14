import type { DiagramStylesProvider } from '../../diagram-api/types.js';
import { cleanAndMerge } from '../../utils.js';
import type { PacketStyleOptions } from './types.js';

const defaultPacketStyleOptions: PacketStyleOptions = {
  byteFontSize: '10px',
  startByteColor: 'black',
  endByteColor: 'black',
  labelColor: 'black',
  labelFontSize: '12px',
  titleColor: 'black',
  titleFontSize: '14px',
  blockStrokeColor: 'black',
  blockStrokeWidth: '1',
  blockFillColor: '#efefef',
};

export const styles: DiagramStylesProvider = ({ packet }: { packet?: PacketStyleOptions } = {}) => {
  const options = cleanAndMerge(defaultPacketStyleOptions, packet);

  return `
	.packetByte {
		font-size: ${options.byteFontSize};
	}
	.packetByte.start {
		fill: ${options.startByteColor};
	}
	.packetByte.end {
		fill: ${options.endByteColor};
	}
	.packetLabel {
		fill: ${options.labelColor};
		font-size: ${options.labelFontSize};
	}
	.packetTitle {
		fill: ${options.titleColor};
		font-size: ${options.titleFontSize};
	}
	.packetBlock {
		stroke: ${options.blockStrokeColor};
		stroke-width: ${options.blockStrokeWidth};
		fill: ${options.blockFillColor};
	}
	`;
};

export default styles;
