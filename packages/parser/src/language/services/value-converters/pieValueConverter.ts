/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import { CommonValueConverter } from '../../common/commonValueConverters.js';

export class PieValueConverter extends DefaultValueConverter {
  public override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = PieValueConverter.customRunConverter(rule, input, cstNode);
    }

    if (value === null) {
      return super.runConverter(rule, input, cstNode);
    } else {
      return value;
    }
  }

  /**
   * A method contains convert logic to be used by class itself or `MermaidValueConverter`.
   *
   * @param rule - Parsed rule.
   * @param input - Matched string.
   * @param cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's pie rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cstNode: CstNode
  ): ValueType | null {
    if (rule.name === 'PIE_SECTION_LABEL') {
      return input
        .replace(/"/g, '')
        .trim()
        .replaceAll(/[\t ]{2,}/gm, ' ');
    }
    return null;
  }
}
/* eslint-enable @typescript-eslint/no-non-null-assertion */
