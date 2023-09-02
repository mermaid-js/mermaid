import type { CstNode, GrammarAST, ValueType } from 'langium';
import { DefaultValueConverter } from 'langium';

import { accessibilityDescrRegex, accessibilityTitleRegex, titleRegex } from './commonMatcher.js';

const rulesRegexes: Record<string, RegExp> = {
  ACC_DESCR: accessibilityDescrRegex,
  ACC_TITLE: accessibilityTitleRegex,
  TITLE: titleRegex,
};

export class CommonValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    const value: ValueType | undefined = CommonValueConverter.customRunConverter(
      rule,
      input,
      cstNode
    );
    if (value === undefined) {
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
   * @returns converted the value if it's common rule or `undefined` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | undefined {
    const regex: RegExp | undefined = rulesRegexes[rule.name];
    if (regex === undefined) {
      return undefined;
    }
    const match = regex.exec(input);
    if (match === null) {
      return undefined;
    }
    // single line title, accTitle, accDescr
    if (match[1] !== undefined) {
      return match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
    }
    // multi line accDescr
    if (match[2] !== undefined) {
      return match[2]
        .replaceAll(/^\s*/gm, '')
        .replaceAll(/\s+$/gm, '')
        .replaceAll(/[\t ]{2,}/gm, ' ')
        .replaceAll(/[\n\r]{2,}/gm, '\n');
    }
    return undefined;
  }
}
