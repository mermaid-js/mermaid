import { beforeAll, describe, expect, it } from 'vitest';
import type { TokenType, TokenVocabulary } from 'chevrotain';

import { sankeyServices } from './test-util.js';

describe('SankeyTokenBuilder', () => {
  describe('token order', () => {
    let tokenVocab: TokenVocabulary;
    let tokenVocabNames: string[];

    beforeAll(() => {
      // Get the ordered tokens (the vocabulary) from the grammar
      tokenVocab = sankeyServices.parser.TokenBuilder.buildTokens(sankeyServices.Grammar, {
        caseInsensitive: sankeyServices.LanguageMetaData.caseInsensitive,
      });
      // coerce the tokenVocab to a type that can use .map
      tokenVocabNames = (tokenVocab as TokenType[]).map((tokenVocabEntry: TokenType) => {
        return tokenVocabEntry.name;
      });
    });

    it('whitespace is always first', () => {
      expect(tokenVocabNames[0]).toEqual('WHITESPACE');
    });
    it('sankey-beta comes after whitespace', () => {
      expect(tokenVocabNames[1]).toEqual('sankey-beta');
    });

    describe('terminal rules with @greedy in comments are put at the end of the ordered list of tokens', () => {
      const NUM_EXPECTED_GREEDY_RULES = 2;

      let greedyGroupStartIndex = 0;
      beforeAll(() => {
        greedyGroupStartIndex = tokenVocabNames.length - NUM_EXPECTED_GREEDY_RULES - 1;
      });

      it('SANKEY_LINK_NODE rule has @greedy so it is in the last group of all @greedy terminal rules', () => {
        expect(tokenVocabNames.indexOf('SANKEY_LINK_NODE')).toBeGreaterThanOrEqual(
          greedyGroupStartIndex
        );
      });

      it('SANKEY_LINK_VALUE rule has @greedy so it is in the last group of all @greedy terminal rules', () => {
        expect(tokenVocabNames.indexOf('SANKEY_LINK_VALUE')).toBeGreaterThanOrEqual(
          greedyGroupStartIndex
        );
      });
    });
  });
});
