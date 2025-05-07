import type { CstNode, GrammarAST, ValueType } from 'langium';
import { AbstractMermaidValueConverter } from '../common/index.js';

export class TreemapValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'NUMBER') {
      // console.debug('NUMBER', input);
      // Convert to a number by removing any commas and converting to float
      return parseFloat(input.replace(/,/g, ''));
    } else if (rule.name === 'SEPARATOR') {
      // console.debug('SEPARATOR', input);
      // Remove quotes
      return input.substring(1, input.length - 1);
    } else if (rule.name === 'STRING') {
      // console.debug('STRING', input);
      // Remove quotes
      return input.substring(1, input.length - 1);
    } else if (rule.name === 'INDENTATION') {
      // console.debug('INDENTATION', input);
      return input.length;
    }
    return undefined;
  }
}
