import type { Info } from 'mermaid-parser';
import { parse } from 'mermaid-parser';

import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    const ast: Info = parse('info', input);
    log.debug(ast);
  },
};
