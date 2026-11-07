import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class C4ValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'C4_TAG') {
      return input.replace(/^:::/, '').trim();
    }
    return undefined;
  }
}
