import type { CstNode, GrammarAST, ValueType } from 'langium';
import { MermaidValueConverter } from '../common/valueConverter.js';

export class PieValueConverter extends MermaidValueConverter {
  override runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name !== 'PIE_SECTION_LABEL') {
      return undefined;
    }

    return input.replace(/"/g, '').trim();
  }
}
