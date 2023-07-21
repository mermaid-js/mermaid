import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import { CommonValueConverter } from '../common/commonValueConverters.js';
import {
  timelinePeriodEventRegex,
  timelinePeriodTitleRegex,
  timelineSectionTitleRegex,
} from './timelineMatcher.js';

export class TimelineValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = TimelineValueConverter.customRunConverter(rule, input, cstNode);
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
   * @returns converted the value if it's timeline rule or `null` if it's not.
   */
  public static customRunConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _cstNode: CstNode
  ): ValueType | null {
    let regex: RegExp | undefined;
    switch (rule.name) {
      case 'TIMELINE_SECTION_TITLE': {
        regex = new RegExp(timelineSectionTitleRegex.source);
        break;
      }
      case 'TIMELINE_PERIOD_TITLE': {
        regex = new RegExp(timelinePeriodTitleRegex.source);
        break;
      }
      case 'TIMELINE_PERIOD_EVENT': {
        regex = new RegExp(timelinePeriodEventRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null && match[1] !== undefined) {
        let result = match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
        if (
          rule.name === 'TIMELINE_SECTION_TITLE' ||
          rule.name === 'TIMELINE_PERIOD_TITLE' ||
          rule.name === 'TIMELINE_PERIOD_EVENT'
        ) {
          result = result.replace('<br>', '\n');
        }
        return result.replaceAll(/[\n\r]{2,}/gm, '\n');
      }
    }
    return null;
  }
}
