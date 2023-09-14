import type { Packet } from 'mermaid-parser';
import type { ParserDefinition } from '../../diagram-api/types.js';

import { parse } from 'mermaid-parser';
import { log } from '../../logger.js';
import { populate } from './db.js';

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    const ast: Packet = parse('packet', input);
    log.debug(ast);
    populate(ast);
  },
};
