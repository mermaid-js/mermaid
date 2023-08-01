import { DefaultValueConverter, type CstNode, type GrammarAST, type ValueType } from 'langium';

import {
  mindmapClassRegex,
  mindmapIconRegex,
  mindmapNodeBangTitleRegex,
  mindmapNodeCircleTitleRegex,
  mindmapNodeCloudTitleRegex,
  mindmapNodeDefault,
  mindmapNodeHexagonTitleRegex,
  mindmapNodeIdRegex,
  mindmapNodeRoundedSquareTitleRegex,
  mindmapNodeSquareTitleRegex,
} from './mindmapMatcher.js';
import { CommonValueConverter } from '../index.js';

export class MindmapValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode
  ): ValueType {
    let value: ValueType | null = CommonValueConverter.customRunConverter(rule, input, cstNode);
    if (value === null) {
      value = MindmapValueConverter.customRunConverter(rule, input, cstNode);
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
      case 'MINDMAP_CLASS': {
        regex = new RegExp(mindmapClassRegex.source);
        break;
      }
      case 'MINDMAP_ICON': {
        regex = new RegExp(mindmapIconRegex.source);
        break;
      }
      case 'MINDMAP_NODE_ID': {
        regex = new RegExp(mindmapNodeIdRegex.source);
        break;
      }
      case 'MINDMAP_NODE_SQUARE_TITLE': {
        regex = new RegExp(mindmapNodeSquareTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_CIRCLE_TITLE': {
        regex = new RegExp(mindmapNodeCircleTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_ROUNDED_SQUARE_TITLE': {
        regex = new RegExp(mindmapNodeRoundedSquareTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_BANG_TITLE': {
        regex = new RegExp(mindmapNodeBangTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_CLOUD_TITLE': {
        regex = new RegExp(mindmapNodeCloudTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_HEXAGON_TITLE': {
        regex = new RegExp(mindmapNodeHexagonTitleRegex.source);
        break;
      }
      case 'MINDMAP_NODE_DEFAULT': {
        regex = new RegExp(mindmapNodeDefault.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null && match[1] !== undefined) {
        let result = match[1].trim().replaceAll(/[\t ]{2,}/gm, ' ');
        if (
          rule.name === 'MINDMAP_NODE_SQUARE_TITLE' ||
          rule.name === 'MINDMAP_NODE_CIRCLE_TITLE' ||
          rule.name === 'MINDMAP_NODE_ROUNDED_SQUARE_TITLE' ||
          rule.name === 'MINDMAP_NODE_BANG_TITLE' ||
          rule.name === 'MINDMAP_NODE_CLOUD_TITLE' ||
          rule.name === 'MINDMAP_NODE_HEXAGON_TITLE' ||
          rule.name === 'MINDMAP_NODE_DEFAULT'
        ) {
          result = result.replace(/<br>|<\/br>/, '\n');
        }
        return result.replaceAll(/[\n\r]{2,}/gm, '\n');
      }
    }
    return null;
  }
}
