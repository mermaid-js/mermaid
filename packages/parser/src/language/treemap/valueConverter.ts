import type { CstNode, GrammarAST, ValueType } from 'langium';
import { AbstractMermaidValueConverter } from '../common/index.js';

// Regular expression to extract className and styleText from a classDef terminal
const classDefRegex = /classDef\s+([A-Z_a-z]\w+)(?:\s+([^\n\r;]*))?;?/;

export class TreemapValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'NUMBER') {
      // Convert to a number by removing any commas and converting to float
      return parseFloat(input.replace(/,/g, ''));
    } else if (rule.name === 'SEPARATOR') {
      // Remove quotes
      return input.substring(1, input.length - 1);
    } else if (rule.name === 'STRING') {
      // Remove quotes
      return input.substring(1, input.length - 1);
    } else if (rule.name === 'INDENTATION') {
      return input.length;
    } else if (rule.name === 'ClassDef') {
      // Handle both CLASS_DEF terminal and ClassDef rule
      if (typeof input !== 'string') {
        // If we're dealing with an already processed object, return it as is
        return input;
      }

      // Extract className and styleText from classDef statement
      const match = classDefRegex.exec(input);
      if (match) {
        // Use any type to avoid type issues
        return {
          $type: 'ClassDefStatement',
          className: match[1],
          styleText: match[2] || undefined,
        } as any;
      }
    }
    return undefined;
  }
}
