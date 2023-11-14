import type { Block, PacketDB, PacketData, Row } from './types.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as commonGetConfig } from '../../config.js';
import { cleanAndMerge } from '../../utils.js';

const defaultPacketData: PacketData = {
  packet: [],
};

let data: PacketData = structuredClone(defaultPacketData);

export const DEFAULT_PACKET_CONFIG: Required<PacketDiagramConfig> = DEFAULT_CONFIG.packet;

export const getConfig = (): Required<PacketDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_PACKET_CONFIG,
    ...commonGetConfig().packet,
  });
  if (config.showBits) {
    config.paddingY += 10;
  }
  return config;
};

export const getPacket = (): Row[] => data.packet;

export const pushWord = (word: Row) => {
  if (word.length > 0) {
    data.packet.push(word);
  }
};

export const clear = () => {
  data = structuredClone(defaultPacketData);
};

export const db: PacketDB = {
  getPacket,
  getConfig,
  clear,
};
