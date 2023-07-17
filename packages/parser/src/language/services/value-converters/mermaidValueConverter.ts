import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import { CommonValueConverter } from '../../common/commonValueConverters.js';
import { PieValueConverter } from '../../pie/pieValueConverter.js';
import { TimelineValueConverter } from '../../timeline/timelineValueConverter.js';

export class MermaidValueConverter extends DefaultValueConverter {
  public override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = PieValueConverter.customRunConverter(rule, input, cstNode);
    }
    if (value === null) {
      value = TimelineValueConverter.customRunConverter(rule, input, cstNode);
    }

    if (value === null) {
      return super.runConverter(rule, input, cstNode);
    } else {
      return value;
    }
  }
}
