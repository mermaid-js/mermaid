import { type CstNode, DefaultValueConverter, type GrammarAST, type ValueType } from 'langium';

import { accessibilityDescrRegex, accessibilityTitleRegex, titleRegex } from './commonMatcher.js';

export class CommonValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    const value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
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
   * @param _cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's common rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | null {
    let regex: RegExp | undefined;
    switch (rule.name) {
      case 'ACC_DESCR': {
        regex = new RegExp(accessibilityDescrRegex.source);
        break;
      }
      case 'ACC_TITLE': {
        regex = new RegExp(accessibilityTitleRegex.source);
        break;
      }
      case 'TITLE': {
        regex = new RegExp(titleRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null) {
        // single line title, accTitle, accDescr
        if (match[1] !== undefined) {
          return match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
        }
        // multi line accDescr
        else if (match[2] !== undefined) {
          return match[2]
            .replaceAll(/^\s*/gm, '')
            .replaceAll(/\s+$/gm, '')
            .replaceAll(/[\t ]{2,}/gm, ' ')
            .replaceAll(/[\n\r]{2,}/gm, '\n');
        }
      }
    }
    return null;
  }
}
