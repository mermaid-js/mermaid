/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CstNode, DefaultValueConverter, ValueType } from 'langium';
import { AbstractRule } from 'langium/lib/grammar/generated/ast.js';

import {
  accessibilityDescrRegex,
  accessibilityTitleRegex,
  titleRegex,
  timelineSectionTitleRegex,
  timelineEventRegex,
  timelinePeroidTitleRegex,
} from './matchers/index.js';

export class MermaidValueConverter extends DefaultValueConverter {
  override runConverter(rule: AbstractRule, input: string, cstNode: CstNode): ValueType {
    let regex: RegExp | undefined;
    switch (rule.name) {
      // common
      case 'ACC_DESCR': {
        regex = new RegExp(accessibilityDescrRegex.source);
        break;
      }
      case 'ACC_TITLE': {
        regex = new RegExp(accessibilityTitleRegex.source);
        break;
      }
      case 'TITLE': {
        regex = new RegExp(titleRegex.source);
        break;
      }

      // timeline
      case 'SECTION_TITLE': {
        regex = new RegExp(timelineSectionTitleRegex.source);
        break;
      }
      case 'PERIOD_TITLE': {
        regex = new RegExp(timelinePeroidTitleRegex.source);
        break;
      }
      case 'EVENT': {
        regex = new RegExp(timelineEventRegex.source);
        break;
      }
    }
    if (regex !== undefined) {
      const match = regex.exec(input);
      if (match !== null) {
        if (match[1] !== undefined) {
          if (rule.name === 'EVENT') {
            match[1] = match[1].replace('<br>', '\n');
          }
          return match[1].trim().replace(/\s\s+/g, ' ') || undefined!;
        } else if (match[2] !== undefined) {
          const result = match[2]
            .replaceAll(/^\s*/gm, '')
            .replaceAll(/\s+$/gm, '')
            .replace(/\s\s+/g, ' ');
          return result || undefined!;
        }
        return undefined!;
      }
    }
    return super.runConverter(rule, input, cstNode);
  }
}
/* eslint-enable @typescript-eslint/no-non-null-assertion */
