import type { CstNode, GrammarAST, ValueType } from 'langium';
import { DefaultValueConverter } from 'langium';

export abstract class AbstractMermaidValueConverter extends DefaultValueConverter {
  /**
   * A method contains convert logic to be used by class.
   *
   * @param rule - Parsed rule.
   * @param input - Matched string.
   * @param cstNode - Node in the Concrete Syntax Tree (CST).
   * @returns converted the value if it's available or `undefined` if it's not.
   */
  protected abstract runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType | undefined;

  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | undefined = this.runCommonConverter(rule, input, cstNode);

    value ??= this.runCustomConverter(rule, input, cstNode);
    if (value === undefined) {
      return super.runConverter(rule, input, cstNode);
    }

    return value;
  }

  private runCommonConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    // Title and accessibilities
    if (rule.name === 'TITLE') {
      return this.processTitleAndAccessibilities(input, 'title');
    } else if (rule.name === 'ACC_DESCR') {
      return this.processTitleAndAccessibilities(input, 'accDescr');
    } else if (rule.name === 'ACC_TITLE') {
      return this.processTitleAndAccessibilities(input, 'accTitle');
    }
    // Markdown string
    if (
      rule.name === 'STRING' &&
      (input.startsWith('"`') || input.startsWith("'`") || input.startsWith('`'))
    ) {
      // A Markdown string keeps its backticks
      // Remove quotes (`result`, '`result`' or "`result`" gives `result`)
      return input.replace(/(^["']|["']$)/g, '');
    }
    return undefined;
  }

  private processTitleAndAccessibilities(input: string, keyword: string) {
    // Remove the keyword at the beginning of the string (it can be followed by a colon)
    // If we're left with enclosing braces, remove them
    // Remove enclosing quotes if they exist
    // Trim each line (separated by newlines)
    // Replace multiple spaces or tabs with a single space
    return input
      .replace(new RegExp(`^\\s*${keyword}\\s*:?\\s*`), '')
      .replace(/^[\s{}]+|[\s{}]+$/g, '')
      .replace(/(^["']|["']$)/g, '')
      .replace(/[\t ]{2,}/gm, ' ')
      .replace(/[\n\r]+[\t ]+/gm, '\n');
  }
}

export class CommonValueConverter extends AbstractMermaidValueConverter {
  protected override runCustomConverter(
    _rule: GrammarAST.AbstractRule,
    _input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    return undefined;
  }
}
