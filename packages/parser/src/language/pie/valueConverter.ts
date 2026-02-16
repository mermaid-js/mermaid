import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class PieValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name !== 'PIE_SECTION_LABEL') {
      return undefined;
    }
    return input.replace(/"/g, '').trim();
  }
}
