import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class MindmapValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    console.debug('MermaidValueConverter', rule.name, input);
    if (rule.name === 'CIRCLE_STR') {
      return input.replace('((', '').replace('))', '').trim();
    } else if (rule.name === 'ROUNDED_STR') {
      return input.replace('(', '').replace(')', '').trim();
    } else if (rule.name === 'ROUNDED_STR_QUOTES') {
      return input.replace('("', '').replace('")', '').trim();
    } else if (rule.name === 'SQUARE_STR') {
      return input.replace('[', '').replace(']', '').trim();
    } else if (rule.name === 'SQUARE_STR_QUOTES') {
      return input.replace('["', '').replace('"]', '').trim();
    } else if (rule.name === 'ARCH_TEXT_ICON') {
      return input.replace(/["()]/g, '');
    } else if (rule.name === 'ARCH_TITLE') {
      return input.replace(/[[\]]/g, '').trim();
    } else if (rule.name === 'INDENTATION') {
      return input.length;
    }
    return undefined;
  }
}
