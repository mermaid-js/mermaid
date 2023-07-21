import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import { CommonValueConverter } from '../common/commonValueConverters.js';
import {
  journeyPeriodTaskRegex,
  journeySectionTitleRegex,
  journeyTaskAnotherActorRegex,
  journeyTaskFirstActorRegex,
  journeyTaskScoreRegex,
} from './journeyMatcher.js';

export class JourneyValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = JourneyValueConverter.customRunConverter(rule, input, cstNode);
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
      case 'JOURNEY_SECTION_TITLE': {
        regex = new RegExp(journeySectionTitleRegex.source);
        break;
      }
      case 'JOURNEY_TASK_SCORE': {
        regex = new RegExp(journeyTaskScoreRegex.source);
        break;
      }
      case 'JOURNEY_TASK_FIRST_ACTOR': {
        regex = new RegExp(journeyTaskFirstActorRegex.source);
        break;
      }
      case 'JOURNEY_TASK_ANOTHER_ACTOR': {
        regex = new RegExp(journeyTaskAnotherActorRegex.source);
        break;
      }
      case 'JOURNEY_TASK_TITLE': {
        regex = new RegExp(journeyPeriodTaskRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null && match[1] !== undefined) {
        if (rule.name === 'JOURNEY_TASK_SCORE') {
          return Number(match[1]);
        }
        return match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
      }
    }
    return null;
  }
}
