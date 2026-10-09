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
      let result = input.replace(/^\[|]$/g, '').trim();
      // Check if wrapped in quotes and remove only outer quotes
      if (
        (result.startsWith('"') && result.endsWith('"')) ||
        (result.startsWith("'") && result.endsWith("'"))
      ) {
        result = result.slice(1, -1);
        // Unescape escaped quotes
        result = result.replace(/\\"/g, '"').replace(/\\'/g, "'");
      }
      return result.trim();
    }
    return undefined;
  }
}
