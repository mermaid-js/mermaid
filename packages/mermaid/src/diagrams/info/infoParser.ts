import type { Info } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Info = await parse('info', input);
    log.debug(ast);
  },
};
