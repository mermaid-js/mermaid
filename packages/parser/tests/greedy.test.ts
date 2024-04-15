import { createLangiumGrammarServices, createServicesForGrammar } from 'langium/grammar';
import { describe, expect, it } from 'vitest';
import { CommonTokenBuilder } from '../src/index.js';
import type { TokenType } from 'chevrotain';
import { EmptyFileSystem } from 'langium';

const grammarServices = createLangiumGrammarServices(EmptyFileSystem).grammar;

async function createServicesFromGrammar(grammar: string) {
  const services = await createServicesForGrammar({
    grammar,
    module: {
      parser: {
        TokenBuilder: () => new CommonTokenBuilder([], grammarServices),
      },
    },
  });

  return {
    grammar: services.Grammar,
    tokenBuilder: services.parser.TokenBuilder,
  };
}

describe('CommonTokenBuilder', async () => {
  it('should handle grammar with one greedy rule', async () => {
    const grammar = `
      grammar TestGrammar
      entry Rule:
        'rule' value=(LessGreedy | Greedy);

      hidden terminal WS: /\\s+/;

      /** @greedy */
      terminal Greedy: /[\\w\\d]+/;
      terminal LessGreedy: /[\\w]+/;
    `;
    const services = await createServicesFromGrammar(grammar);
    const tokens = services.tokenBuilder.buildTokens(services.grammar) as TokenType[];

    expect(tokens[2].name).toBe('LessGreedy');
    expect(tokens[3].name).toBe('Greedy');
  });

  it('should handle grammar with more than one greedy rule', async () => {
    const grammar = `
      grammar TestGrammar
      entry Rule:
        'rule' value=(LessGreedy | Greedy);

      hidden terminal WS: /\\s+/;

      /** @greedy */
      terminal LessGreedy: /[\\w]+/;
      /** @greedy */
      terminal Greedy: /[\\w\\d]+/;
    `;
    const services = await createServicesFromGrammar(grammar);
    const tokens = services.tokenBuilder.buildTokens(services.grammar) as TokenType[];

    expect(tokens[2].name).toBe('LessGreedy');
    expect(tokens[3].name).toBe('Greedy');
  });
});
