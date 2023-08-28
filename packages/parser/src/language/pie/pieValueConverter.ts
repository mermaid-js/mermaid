import type { CstNode, GrammarAST, ValueType } from 'langium';
import { DefaultValueConverter } from 'langium';

import { CommonValueConverter } from '../common/commonValueConverters.js';

export class PieValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | undefined = CommonValueConverter.customRunConverter(
      rule,
      input,
      cstNode
    );
    if (value === undefined) {
      value = PieValueConverter.customRunConverter(rule, input, cstNode);
    }

    if (value === undefined) {
      return super.runConverter(rule, input, cstNode);
    } 
    return value;
  }

  /**
   * A method contains convert logic to be used by class itself or `MermaidValueConverter`.
   *
   * @param rule - Parsed rule.
   * @param input - Matched string.
   * @param _cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's pie rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'PIE_SECTION_LABEL') {
      return input
        .replace(/"/g, '')
        .trim()
        .replaceAll(/[\t ]{2,}/gm, ' ');
    }
    return undefined;
  }
}
