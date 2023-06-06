import { EmptyFileSystem, ParseResult } from 'langium';

import { Mermaid, MermaidServices, createMermaidServices } from '../src/language/index.js';

/**
 * Create test services for unit testing.
 *
 * @example
 * Example of getting parse function
 * ```typescript
 * // function that contains all possible grammars:
 * const { parse } = createTestServices();
 * const { parse } = createTestServices<Mermaid>();
 *
 * // function that only contains pie charts possible grammars:
 * const { parse } = createTestServices<Pie>();
 * ```
 *
 * @param T - An optional type of any possible type in the {@link Mermaid} wrapper type.
 * @returns An object contains `Mermaid` {@link services} and {@link parse} function.
 */
export function createTestServices<T extends Mermaid = Mermaid>(): {
  services: MermaidServices;
  parse: (input: string) => ParseResult<T>;
} {
  const services = createMermaidServices(EmptyFileSystem).Mermaid;
  const parser = services.parser.LangiumParser;

  const parse = (input: string) => {
    return parser.parse<T>(input);
  };

  return { services, parse };
}
