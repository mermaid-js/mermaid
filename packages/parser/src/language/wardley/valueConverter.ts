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
      case 'QUOTED_STRING':
        // Remove quotes from quoted strings
        return input.substring(1, input.length - 1);
      default:
        return undefined;
    }
  }
}
