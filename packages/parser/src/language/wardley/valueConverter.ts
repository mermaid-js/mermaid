import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class WardleyValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    switch (rule.name.toUpperCase()) {
      case 'LINK_LABEL':
        // Strip the leading ';' and trim whitespace
        return input.substring(1).trim();
      default:
        return undefined;
    }
  }
}
