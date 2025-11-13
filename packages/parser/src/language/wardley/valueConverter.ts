import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class WardleyValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    switch (rule.name.toUpperCase()) {
      case 'COMPONENT_NAME':
      case 'EVOLUTION_NAME':
      case 'TEXT_UNTIL_BRACKET':
      case 'TEXT_LINE':
        return input.trim();
      case 'LINK_LABEL':
        // Strip the leading ';' and trim whitespace
        return input.substring(1).trim();
      default:
        return undefined;
    }
  }
}
