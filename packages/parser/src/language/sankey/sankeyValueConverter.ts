import type { CstNode, GrammarAST, ValueType } from 'langium';

import { MermaidValueConverter } from '../common/valueConverter.js';
import {
  sankeyLinkSourceRegex,
  sankeyLinkTargetRegex,
  sankeyLinkValueRegex,
} from './sankeyMatcher.js';

const rulesRegexes: Record<string, RegExp> = {
  SANKEY_LINK_SOURCE: sankeyLinkSourceRegex,
  SANKEY_LINK_TARGET: sankeyLinkTargetRegex,
  SANKEY_LINK_VALUE: sankeyLinkValueRegex,
};

export class SankeyValueConverter extends MermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | undefined {
    const regex: RegExp | undefined = rulesRegexes[rule.name];
    if (regex === undefined) {
      return undefined;
    }
    const match = regex.exec(input);
    if (match === null) {
      return undefined;
    }
    // source and target with double quote and value
    if (match[1] !== undefined) {
      if (rule.name === 'SANKEY_LINK_VALUE') {
        return Number(match[1].replaceAll('"', ''));
      }
      return match[1]
        .replaceAll('""', '"')
        .trim()
        .replaceAll(/[\t ]{2,}/gm, ' ');
    }
    // source and target without double quote
    if (match[2] !== undefined) {
      return match[2].trim().replaceAll(/[\t ]{2,}/gm, ' ');
    }
    return undefined;
  }
}
