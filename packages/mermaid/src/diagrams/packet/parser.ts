import type { Packet } from 'mermaid-parser';
import { parse } from 'mermaid-parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
import type { Block, Row } from './types.js';

const populate = (ast: Packet) => {
  populateCommonDb(ast, db);
  let lastByte = -1;
  let word: Row = [];
  let row = 1;
  const { bitsPerRow } = db.getConfig();
  for (let { start, end, label } of ast.blocks) {
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

    while (word.length <= bitsPerRow + 1 && db.getPacket().length < 10_000) {
      const [block, nextBlock] = getNextFittingBlock({ start, end, label }, row, bitsPerRow);
      word.push(block);
      if (block.end + 1 === row * bitsPerRow) {
        db.pushWord(word);
        word = [];
        row++;
      }
      if (!nextBlock) {
        break;
      }
      ({ start, end, label } = nextBlock);
    }
  }
  db.pushWord(word);
};

const getNextFittingBlock = (
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

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    const ast: Packet = parse('packet', input);
    log.debug(ast);
    populate(ast);
  },
};
