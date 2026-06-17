import { getConfig } from '../../../config.js';
import { log } from '../../../logger.js';
import type { FlowDB } from '../flowDb.js';
// @ts-ignore: JISON doesn't support types
import flowJisonParser from './flow.jison';
import { parseFlowchartChevrotain } from './flow.chevrotain.js';

/**
 * Flowchart parser dispatcher (the migration switch seam).
 *
 * Selects the legacy (jison) or Chevrotain engine from the internal `config.parser` map, read per
 * `parse()` so it can be toggled at runtime and in tests. `config.parser` is INTERNAL — honored only
 * via `initialize()` / `setConfig()` and excluded from semver.
 *
 * Keeps the exact surface the existing specs and the renderer use:
 * - `parser.yy` is the settable `FlowDB` instance; `parser.parse(text)` populates it (the specs'
 *   `flow.parser.yy = new FlowDB(); flow.parser.parse(text)` contract — no `}\n` normalization, like
 *   the legacy `flow.parser.parse`).
 * - the default export's `parse(text)` is the renderer entry; it applies the `}\n` normalization the
 *   legacy `flowParser` wrapper always did, then dispatches.
 */

const legacyParser = flowJisonParser.parser;

function resolveEngine(): 'legacy' | 'chevrotain' {
  const parserConfig = getConfig().parser;
  // Chevrotain is the default. Roll back to the legacy (jison) engine via `parser: { flowchart:
  // 'legacy' }` (or a global `parser: { default: 'legacy' }`) — honored only through initialize()/
  // setConfig(). The legacy parser is retained in `flow.jison` for this rollback.
  return parserConfig?.flowchart ?? parserConfig?.default ?? 'chevrotain';
}

interface FlowInnerParser {
  yy?: FlowDB;
  parse: (text: string) => unknown;
}

const parser: FlowInnerParser = {
  yy: undefined,
  parse(text: string): unknown {
    const engine = resolveEngine();
    log.debug(`flowchart: parsing with the ${engine} parser`);
    if (engine === 'chevrotain') {
      parseFlowchartChevrotain(text, this.yy!);
      return;
    }
    legacyParser.yy = this.yy;
    return legacyParser.parse(text);
  },
};

const flowDispatcher = {
  parser,
  parse(text: string): unknown {
    // remove the trailing whitespace after closing curly braces when ending a line break
    const src = text.replace(/}\s*\n/g, '}\n');
    const engine = resolveEngine();
    log.debug(`flowchart: parsing with the ${engine} parser`);
    if (engine === 'chevrotain') {
      parseFlowchartChevrotain(src, parser.yy!);
      return;
    }
    legacyParser.yy = parser.yy;
    return legacyParser.parse(src);
  },
};

export default flowDispatcher;
