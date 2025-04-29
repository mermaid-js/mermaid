import type { CstNode, GrammarAST, ValueType } from 'langium';

import { AbstractMermaidValueConverter } from '../common/index.js';

export class MindmapValueConverter extends AbstractMermaidValueConverter {
  protected runCustomConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    _cstNode: CstNode
  ): ValueType | undefined {
    console.debug('MermaidValueConverter', rule.name, input);
    if (rule.name === 'CIRCLE_STR') {
      return input.replace('((', '').replace('))', '').trim();
    } else if (rule.name === 'CIRCLE_QSTR') {
      return input.replace('(("', '').replace('"))', '').trim();
    } else if (rule.name === 'ROUNDED_STR') {
      return input.replace('(', '').replace(')', '').trim();
    } else if (rule.name === 'ROUNDED_QSTR') {
      return input.replace('("', '').replace('")', '').trim();
    } else if (rule.name === 'SQUARE_STR') {
      return input.replace('[', '').replace(']', '').trim();
    } else if (rule.name === 'SQUARE_QSTR') {
      return input.replace('["', '').replace('"]', '').trim();
    } else if (rule.name === 'BANG_STR') {
      return input.replace('))', '').replace('((', '').trim();
    } else if (rule.name === 'BANG_QSTR') {
      return input.replace('))"', '').replace('"((', '').trim();
    } else if (rule.name === 'HEXAGON_STR') {
      return input.replace('{{', '').replace('}}', '').trim();
    } else if (rule.name === 'HEXAGON_QSTR') {
      return input.replace('{{"', '').replace('"}}', '').trim();
    } else if (rule.name === 'CLOUD_STR') {
      return input.replace(')', '').replace('(', '').trim();
    } else if (rule.name === 'CLOUD_QSTR') {
      return input.replace(')"', '').replace('"(', '').trim();
    } else if (rule.name === 'ARCH_TEXT_ICON') {
      return input.replace(/["()]/g, '');
    } else if (rule.name === 'ARCH_TITLE') {
      return input.replace(/[[\]]/g, '').trim();
    } else if (rule.name === 'CLASS') {
      return input.replace(':::', '').trim();
    } else if (rule.name === 'ICON') {
      return input.replace('::icon(', '').replace(')', '').trim();
    } else if (rule.name === 'INDENTATION') {
      console.debug('INDENTATION', input.length);
      return input.length;
    }
    return undefined;
  }
}
