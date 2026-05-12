import type { CstNode, GrammarAST, ValueType } from 'langium';
import { AbstractMermaidValueConverter } from '../common/index.js';

export class TreeViewValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    if (rule.name === 'INDENTATION') {
      return input?.length || 0;
    }
    if (rule.name === 'QUOTED_NAME') {
      // Strip surrounding quotes: "name" or 'name' → name
      return input.substring(1, input.length - 1);
    }
    if (rule.name === 'CLASS_ANNOTATION') {
      // " :::className" → className (strip leading whitespace and :::)
      const trimmed = input.trim();
      return trimmed.substring(3).trim();
    }
    if (rule.name === 'ICON_ANNOTATION') {
      // " icon(name)" → name, " icon()" → empty string
      const trimmed = input.trim();
      return trimmed.substring(5, trimmed.length - 1);
    }
    if (rule.name === 'DESC_ANNOTATION') {
      // " ## description text" → description text
      const trimmed = input.trim();
      return trimmed.substring(2).trim();
    }
    return undefined;
  }
}
