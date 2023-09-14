import type { Block, PacketDB, Row } from './types.js';
import { log } from '../../logger.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as commonGetConfig } from '../../config.js';

interface PacketData {
  packet: Row[];
}

const defaultPacketData: PacketData = {
  packet: [],
};

let data: PacketData = structuredClone(defaultPacketData);
export const DEFAULT_PACKET_CONFIG: Required<PacketDiagramConfig> = DEFAULT_CONFIG.packet;

export const getConfig = (): Required<PacketDiagramConfig> => {
  const config = structuredClone({
    ...DEFAULT_PACKET_CONFIG,
    ...commonGetConfig().packet,
  });
  if (config.showBits) {
    config.paddingY += 10;
  }
  return config;
};

export const getPacket = (): Row[] => data.packet;

export const getNextFittingBlock = (
  block: Block,
  row: number,
  bitsPerRow: number
): [Required<Block>, Block | undefined] => {
  if (block.end === undefined) {
    block.end = block.start;
  }

  if (block.start > block.end) {
    throw new Error(`Block start ${block.start} is greater than block end ${block.end}.`);
  }

  if (block.end + 1 <= row * bitsPerRow) {
    return [block as Required<Block>, undefined];
  }

  return [
    {
      start: block.start,
      end: row * bitsPerRow - 1,
      label: block.label,
    },
    {
      start: row * bitsPerRow,
      end: block.end,
      label: block.label,
    },
  ];
};

export const populate = ({ blocks }: { blocks: Block[] }) => {
  let lastByte = -1;
  let word: Row = [];
  data.packet = [];
  let row = 1;
  const { bitsPerRow } = getConfig();
  for (let { start, end, label } of blocks) {
    if (end && end < start) {
      throw new Error(`Packet block ${start} - ${end} is invalid. End must be greater than start.`);
    }
    if (start != lastByte + 1) {
      throw new Error(
        `Packet block ${start} - ${end ?? start} is not contiguous. It should start from ${
          lastByte + 1
        }.`
      );
    }
    lastByte = end ?? start;
    log.debug(`Packet block ${start} - ${lastByte} with label ${label}`);

    while (word.length <= bitsPerRow + 1 && data.packet.length < 10_000) {
      const [block, nextBlock] = getNextFittingBlock({ start, end, label }, row, bitsPerRow);
      word.push(block);
      if (block.end + 1 === row * bitsPerRow) {
        data.packet.push(word);
        word = [];
        row++;
      }
      if (!nextBlock) {
        break;
      }
      ({ start, end, label } = nextBlock);
    }
  }
  if (word.length > 0) {
    data.packet.push(word);
  }
  log.debug(data);
};

export const clear = () => {
  data = structuredClone(defaultPacketData);
};

export const db: PacketDB = {
  getPacket,
  getConfig,
};
