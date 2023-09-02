import type { CstNode, GrammarAST, ValueType } from 'langium';
import { DefaultValueConverter } from 'langium';

import { CommonValueConverter } from '../common/commonValueConverters.js';
import {
  sankeyLinkSourceRegex,
  sankeyLinkTargetRegex,
  sankeyLinkValueRegex,
} from './sankeyMatcher.js';

export class SankeyValueConverter extends DefaultValueConverter {
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
      value = SankeyValueConverter.customRunConverter(rule, input, cstNode);
    }

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
   * @returns converted the value if it's sankey rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | undefined {
    let regex: RegExp | undefined;
    switch (rule.name) {
      case 'SANKEY_LINK_SOURCE': {
        regex = sankeyLinkSourceRegex;
        break;
      }
      case 'SANKEY_LINK_TARGET': {
        regex = sankeyLinkTargetRegex;
        break;
      }
      case 'SANKEY_LINK_VALUE': {
        regex = sankeyLinkValueRegex;
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
    // source and target with double quote and value
    if (match[1] !== undefined) {
      if (rule.name === 'SANKEY_LINK_VALUE') {
        return Number(match[1].replaceAll('"', ''));
      }
      return match[1]
        .replaceAll('""', '"')
        .trim()
        .replaceAll(/[\t ]{2,}/gm, ' ');
    }
    // source and target without double quote
    if (match[2] !== undefined) {
      return match[2].trim().replaceAll(/[\t ]{2,}/gm, ' ');
    }
    return undefined;
  }
}
