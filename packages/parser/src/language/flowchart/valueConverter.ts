import { type GrammarAST, type CstNode, DefaultValueConverter, type ValueType } from 'langium';
// import { CommonValueConverter } from '../common/valueConverter.js';

export class FlowchartValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    switch (rule.name) {
      case 'String':
        return input.substring(1, input.length - 1); //.replace(/\\(.)/g, '$1');
      case 'EdgeLabel':
      case 'OddLabel':
      case 'SquareLabel':
      case 'RoundLabel':
      case 'DiamondLabel':
        return input.substring(1, input.length - 1);
      case 'EllipseLabel':
      case 'StadiumLabel':
      case 'CylinderLabel':
      case 'TrapezoidLabel':
      case 'InvTrapezoidLabel':
      case 'LeanRightLabel':
      case 'LeanLeftLabel':
      case 'SubroutineLabel':
      case 'HexagonLabel':
        return input.substring(2, input.length - 2);
      case 'DoublecircleLabel':
        return input.substring(3, input.length - 3);
      // case 'FlowchartDirection':
      //   switch (input) {
      //     case 'TD':
      //     case 'TB':
      //     case 'v':
      //       return 'TB';
      //     case 'BT':
      //     case '^':
      //       return 'BT';
      //     case 'LR':
      //     case '>':
      //       return 'LR';
      //     case 'RL':
      //     case '<':
      //       return 'RL';
      //   }
    }

    return super.runConverter(rule, input, cstNode);
  }
}
