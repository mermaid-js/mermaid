/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CstNode, GrammarAST, ValueType } from 'langium';
import { DefaultValueConverter } from 'langium';

import { accessibilityDescrRegex, accessibilityTitleRegex, titleRegex } from './commonMatcher.js';

export abstract class MermaidValueConverter extends DefaultValueConverter {
  /**
   * A method contains convert logic to be used by class.
   *
   * @param rule - Parsed rule.
   * @param input - Matched string.
   * @param cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's available or `undefined` if it's not.
   */
  protected abstract runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType | undefined;

  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | undefined = this.runCommonConverter(rule, input, cstNode);

    if (value === undefined) {
      value = this.runCustomConverter(rule, input, cstNode);
    }

    if (value === undefined) {
      return super.runConverter(rule, input, cstNode);
    }

    return value;
  }

  private runCommonConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
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

export class CommonValueConverter extends MermaidValueConverter {
  protected runCustomConverter(
    _rule: GrammarAST.AbstractRule,
    _input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    return undefined;
  }
}
