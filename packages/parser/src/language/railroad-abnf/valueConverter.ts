import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class RailroadAbnfValueConverter extends AbstractMermaidValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    const value = super.runConverter(rule, input, cstNode);

    if (rule.name === 'TITLE' && typeof value === 'string') {
      const trimmedValue = value.trim();
      if (
        (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
        (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
      ) {
        return trimmedValue.slice(1, -1);
      }
    }

    return value;
  }

  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'ABNF_STRING') {
      return input.slice(1, -1);
    }

    return undefined;
  }
}
