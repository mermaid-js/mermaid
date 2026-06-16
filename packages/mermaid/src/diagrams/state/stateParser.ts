import { getConfig } from '../../config.js';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { parseStateChevrotain } from './parser/state.chevrotain.js';
import type { StateDB } from './stateDb.js';
// @ts-ignore JISON doesn't support types
import legacy from './parser/stateDiagram.jison';

/**
 * State parser dispatcher (the migration switch seam) — mimics the jison object shape so it's a
 * drop-in for both the diagram definitions (`import parser from './stateParser.js'`) and the specs
 * (`import { parser }` → the inner parser with a settable `.yy`). The core sets `parser.parser.yy`
 * (Diagram.ts), and specs set `stateDiagram.parser.yy`.
 *
 * Engine selected per `parse()` from the internal `config.parser.state` (defaults to legacy until
 * cutover). Synchronous + throws on error, like jison.
 */
interface StateInnerParser {
  yy?: StateDB;
  parse: (text: string) => void;
}

const dispatch = (text: string, yy: StateDB | undefined): void => {
  const parserConfig = getConfig().parser;
  const engine = parserConfig?.state ?? parserConfig?.default ?? 'chevrotain';
  log.debug(`state: parsing with the ${engine} parser`);
  if (engine === 'chevrotain') {
    parseStateChevrotain(text, yy!);
  } else {
    legacy.parser.yy = yy;
    legacy.parse(text);
  }
};

/** The inner parser object (the `parser.yy` / `parser.parse` handle the specs use). */
export const parser: StateInnerParser = {
  yy: undefined,
  parse(text: string): void {
    dispatch(text, this.yy);
  },
};

const stateDispatcher: ParserDefinition = {
  parser: parser as ParserDefinition['parser'],
  parse(text: string): void {
    dispatch(text, parser.yy);
  },
};

export default stateDispatcher;
