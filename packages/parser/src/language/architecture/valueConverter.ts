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
      if (input.startsWith('["`') && input.endsWith('`"]')) {
        // markdown
        return input.substring(3, input.length - 3).trim();
      } else if (input.startsWith('["')) {
        // unicode or markdown
        return input
          .substring(2, input.length - 2)
          .replace(/\\"/g, '"')
          .trim();
      }
      // simple
      return input.substring(1, input.length - 1).trim();
    }
    return undefined;
  }
}
