import { getConfig } from '../../config.js';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { chevrotainParser } from './parser/pie.chevrotain.js';
import { legacyParser } from './parser/pie.legacy.js';

/**
 * Pie parser dispatcher (the migration switch seam).
 *
 * Selects the legacy (langium) or Chevrotain engine from the internal `config.parser` map, read
 * per-`parse()` so it can be toggled at runtime and in tests. `config.parser` is INTERNAL — honored
 * only via `initialize()` / `setConfig()` (not directives/frontmatter) and excluded from semver.
 *
 * Pie now defaults to `chevrotain`. To roll back, set `parser: { pie: 'legacy' }` (or a global
 * `parser: { default: 'legacy' }`).
 */
export const parser: ParserDefinition = {
  parse: (input: string): void | Promise<void> => {
    const parserConfig = getConfig().parser;
    const engine = parserConfig?.pie ?? parserConfig?.default ?? 'chevrotain';
    log.debug(`pie: parsing with the ${engine} parser`);
    return (engine === 'chevrotain' ? chevrotainParser : legacyParser).parse(input);
  },
};
