import { CustomPatternMatcherFunc } from 'chevrotain';

/**
 * Matches single and multiline accessible description
 */
export const accessibilityDescrRegex = /accDescr(?:[\t ]*:[\t ]*([^\n\r]*)|\s*{([^}]*)})/y;
export const matchAccessibilityDescr: CustomPatternMatcherFunc = (text, startOffset) => {
  accessibilityDescrRegex.lastIndex = startOffset;
  return accessibilityDescrRegex.exec(text);
};

/**
 * Matches single line accessible title
 */
export const accessibilityTitleRegex = /accTitle[\t ]*:[\t ]*([^\n\r]*)/y;
export const matchAccessibilityTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  accessibilityTitleRegex.lastIndex = startOffset;
  return accessibilityTitleRegex.exec(text);
};

/**
 * Matches a single title
 */
export const titleRegex = /title(?:[\t ]+([^\n\r]*)|$)/my;
export const matchTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  titleRegex.lastIndex = startOffset;
  return titleRegex.exec(text);
};
