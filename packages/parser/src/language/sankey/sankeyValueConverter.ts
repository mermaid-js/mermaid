import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

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
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = SankeyValueConverter.customRunConverter(rule, input, cstNode);
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
   * @param _cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's sankey rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | null {
    let regex: RegExp | undefined;
    switch (rule.name) {
      case 'SANKEY_LINK_SOURCE': {
        regex = new RegExp(sankeyLinkSourceRegex.source);
        break;
      }
      case 'SANKEY_LINK_TARGET': {
        regex = new RegExp(sankeyLinkTargetRegex.source);
        break;
      }
      case 'SANKEY_LINK_VALUE': {
        regex = new RegExp(sankeyLinkValueRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null) {
        // source and target with double quote and value
        if (match[1] !== undefined) {
          if (rule.name === 'SANKEY_LINK_VALUE') {
            return Number(match[1]);
          } else {
            return match[1]
              .trim()
              .replaceAll('"', '')
              .replaceAll(/[\t ]{2,}/gm, ' ');
          }
        }
        // source and target without double quote
        else if (match[2] !== undefined) {
          return match[2].trim().replaceAll(/[\t ]{2,}/gm, ' ');
        }
      }
    }
    return null;
  }
}
