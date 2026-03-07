import type { CstNode, GrammarAST, ValueType } from 'langium';
import { AbstractMermaidValueConverter } from '../common/index.js';

export class TreeViewValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'INDENTATION') {
      return input?.length || 0;
    } else if (rule.name === 'STRING2') {
      // Remove quotes
      return input.substring(1, input.length - 1);
    }
    return undefined;
  }
}
