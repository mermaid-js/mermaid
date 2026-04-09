import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

const decodeEscapedString = (input: string): string => {
  const content = input.slice(1, -1);
  let value = '';

  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (character === '\\' && index + 1 < content.length) {
      index++;
      const escaped = content[index];
      switch (escaped) {
        case 'n':
          value += '\n';
          break;
        case 'r':
          value += '\r';
          break;
        case 't':
          value += '\t';
          break;
        default:
          value += escaped;
      }
      continue;
    }

    value += character;
  }

  return value;
};

export class RailroadValueConverter extends AbstractMermaidValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    const value = super.runConverter(rule, input, cstNode);

    if (rule.name === 'TITLE' && typeof value === 'string') {
      const trimmedValue = value.trim();
      if (
        (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
        (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
      ) {
        return decodeEscapedString(trimmedValue);
      }
    }

    return value;
  }

  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'RR_STRING') {
      return decodeEscapedString(input);
    }

    if (rule.name === 'RR_SPECIAL_SEQUENCE') {
      return input.slice(1, -1).trim();
    }

    return undefined;
  }
}
