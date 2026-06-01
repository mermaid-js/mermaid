import type { GrammarAST, Stream } from 'langium';
import type { TokenType } from 'chevrotain';

import { AbstractMermaidTokenBuilder } from '../common/index.js';

/**
 * Custom token builder for the neuralnet diagram.
 *
 * The grammar defines a general-purpose `NN_WORD` terminal that matches
 * any alphanumeric word (including param values like `relu`, `3x3`, `0.5`).
 * Chevrotain uses first-match semantics by default, so `NN_WORD` would win
 * over the common `TITLE`, `ACC_DESCR`, and `ACC_TITLE` terminals even when
 * the latter match a longer string.
 *
 * Setting `LONGER_ALT` on `NN_WORD` tells Chevrotain to prefer the longer
 * common terminals when they match more text at the same position, preserving
 * the `title`, `accTitle`, and `accDescr` directives.
 */
export class NeuralnetTokenBuilder extends AbstractMermaidTokenBuilder {
  public constructor() {
    super([]);
  }

  protected override buildTerminalTokens(rules: Stream<GrammarAST.AbstractRule>): TokenType[] {
    const tokens = super.buildTerminalTokens(rules);

    const nnWord = tokens.find((t) => t.name === 'NN_WORD');
    const title = tokens.find((t) => t.name === 'TITLE');
    const accDescr = tokens.find((t) => t.name === 'ACC_DESCR');
    const accTitle = tokens.find((t) => t.name === 'ACC_TITLE');

    if (nnWord) {
      // Prefer common directive terminals over NN_WORD when they match longer
      const longerAlts = [title, accDescr, accTitle].filter(Boolean) as TokenType[];
      if (longerAlts.length > 0) {
        nnWord.LONGER_ALT = longerAlts;
      }
    }

    return tokens;
  }
}
