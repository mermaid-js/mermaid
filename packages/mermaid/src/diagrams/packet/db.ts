import { getConfig as commonGetConfig } from '../../config.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { PacketDB, PacketData, PacketWord } from './types.js';

const defaultPacketData: PacketData = {
  packet: [],
};

let data: PacketData = structuredClone(defaultPacketData);

const DEFAULT_PACKET_CONFIG: Required<PacketDiagramConfig> = DEFAULT_CONFIG.packet;

const getConfig = (): Required<PacketDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_PACKET_CONFIG,
    ...commonGetConfig().packet,
  });
  if (config.showBits) {
    config.paddingY += 10;
  }
  return config;
};

const getPacket = (): PacketWord[] => data.packet;

const pushWord = (word: PacketWord) => {
  if (word.length > 0) {
    data.packet.push(word);
  }
};

const clear = () => {
  commonClear();
  data = structuredClone(defaultPacketData);
};

export const db: PacketDB = {
  pushWord,
  getPacket,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
