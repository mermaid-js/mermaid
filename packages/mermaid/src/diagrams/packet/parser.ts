import type { Packet } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
import type { PacketBlock, PacketWord } from './types.js';

const maxPacketSize = 10_000;

const populate = (ast: Packet) => {
  populateCommonDb(ast, db);
  let lastBit = -1;
  let word: PacketWord = [];
  let row = 1;
  const { bitsPerRow } = db.getConfig();

  for (let { start, end, bits, label } of ast.blocks) {
    if (start !== undefined && end !== undefined && end < start) {
      throw new Error(`Packet block ${start} - ${end} is invalid. End must be greater than start.`);
    }
    if (start == undefined) {
      start = lastBit + 1;
    }
    if (start !== lastBit + 1) {
      throw new Error(
        `Packet block ${start} - ${end ?? start} is not contiguous. It should start from ${
          lastBit + 1
        }.`
      );
    }
    if (bits === 0) {
      throw new Error(`Packet block ${start} is invalid. Cannot have a zero bit field.`);
    }
    if (end == undefined) {
      end = start + (bits ?? 1) - 1;
    }
    if (bits == undefined) {
      bits = end - start + 1;
    }
    lastBit = end;
    log.debug(`Packet block ${start} - ${lastBit} with label ${label}`);

    while (word.length <= bitsPerRow + 1 && db.getPacket().length < maxPacketSize) {
      const [block, nextBlock] = getNextFittingBlock({ start, end, bits, label }, row, bitsPerRow);
      word.push(block);
      if (block.end + 1 === row * bitsPerRow) {
        db.pushWord(word);
        word = [];
        row++;
      }
      if (!nextBlock) {
        break;
      }
      ({ start, end, bits, label } = nextBlock);
    }
  }
  db.pushWord(word);
};

const getNextFittingBlock = (
  block: PacketBlock,
  row: number,
  bitsPerRow: number
): [Required<PacketBlock>, PacketBlock | undefined] => {
  if (block.start === undefined) {
    throw new Error('start should have been set during first phase');
  }
  if (block.end === undefined) {
    throw new Error('end should have been set during first phase');
  }

  if (block.start > block.end) {
    throw new Error(`Block start ${block.start} is greater than block end ${block.end}.`);
  }

  if (block.end + 1 <= row * bitsPerRow) {
    return [block as Required<PacketBlock>, undefined];
  }

  const rowEnd = row * bitsPerRow - 1;
  const rowStart = row * bitsPerRow;
  return [
    {
      start: block.start,
      end: rowEnd,
      label: block.label,
      bits: rowEnd - block.start,
    },
    {
      start: rowStart,
      end: block.end,
      label: block.label,
      bits: block.end - rowStart,
    },
  ];
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Packet = await parse('packet', input);
    log.debug(ast);
    populate(ast);
  },
};
