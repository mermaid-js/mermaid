import { CustomPatternMatcherFunc } from 'chevrotain';

/**
 * Matches a timeline section title
 */
export const timelineSectionTitleRegex = /section[\t ]+([^\n\r]+)/y;
export const matchTimelineSectionTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  timelineSectionTitleRegex.lastIndex = startOffset;
  return timelineSectionTitleRegex.exec(text);
};

/**
 * Matches a timeline period title
 */
export const timelinePeriodTitleRegex = /([^\n\r:]+)/y;
export const matchTimelinePeriodTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  timelinePeriodTitleRegex.lastIndex = startOffset;
  return timelinePeriodTitleRegex.exec(text);
};

/**
 * Matches a timeline period event
 */
export const timelinePeriodEventRegex = /([^\n\r:]+)/y;
export const matchTimelinePeriodEvent: CustomPatternMatcherFunc = (text, startOffset) => {
  timelinePeriodEventRegex.lastIndex = startOffset;
  return timelinePeriodEventRegex.exec(text);
};
