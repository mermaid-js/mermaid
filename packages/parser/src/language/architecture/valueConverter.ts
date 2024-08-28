import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class ArchitectureValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'ARCH_ICON') {
      return input.replace(/[()]/g, '').trim();
    } else if (rule.name === 'ARCH_TEXT_ICON') {
      return input.replace(/["()]/g, '');
    } else if (rule.name === 'ARCH_TITLE') {
      return input.replace(/[[\]]/g, '').trim();
    }
    return undefined;
  }
}
