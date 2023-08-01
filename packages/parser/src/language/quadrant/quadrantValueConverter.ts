import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import { CommonValueConverter } from '../common/commonValueConverters.js';
import {
  quadrantAxisRightRegex,
  quadrantEndPointCoordinateRegex,
  quadrantFirstQuadrantRegex,
  quadrantForthQuadrantRegex,
  quadrantSecondQuadrantRegex,
  quadrantStartPointCoordinateRegex,
  quadrantThirdQuadrantRegex,
  quadrantXAxisLeftRegex,
  quadrantYAxisLeftRegex,
} from './quadrantMatcher.js';

export class QuadrantValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = QuadrantValueConverter.customRunConverter(rule, input, cstNode);
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
      case 'QUADRANT_X_AXIS_LEFT': {
        regex = new RegExp(quadrantXAxisLeftRegex.source);
        break;
      }
      case 'QUADRANT_Y_AXIS_LEFT': {
        regex = new RegExp(quadrantYAxisLeftRegex.source);
        break;
      }
      case 'QUADRANT_AXIS_RIGHT': {
        regex = new RegExp(quadrantAxisRightRegex.source);
        break;
      }
      case 'QUADRANT_QUADRANT_1': {
        regex = new RegExp(quadrantFirstQuadrantRegex.source);
        break;
      }
      case 'QUADRANT_QUADRANT_2': {
        regex = new RegExp(quadrantSecondQuadrantRegex.source);
        break;
      }
      case 'QUADRANT_QUADRANT_3': {
        regex = new RegExp(quadrantThirdQuadrantRegex.source);
        break;
      }
      case 'QUADRANT_QUADRANT_4': {
        regex = new RegExp(quadrantForthQuadrantRegex.source);
        break;
      }
      case 'QUADRANT_START_POINT_COORDINATE': {
        regex = new RegExp(quadrantStartPointCoordinateRegex.source);
        break;
      }
      case 'QUADRANT_END_POINT_COORDINATE': {
        regex = new RegExp(quadrantEndPointCoordinateRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null && match[1] !== undefined) {
        if (
          rule.name === 'QUADRANT_START_POINT_COORDINATE' ||
          rule.name === 'QUADRANT_END_POINT_COORDINATE'
        ) {
          return Number(match[1]);
        }
        return match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
      }
    }
    return null;
  }
}
