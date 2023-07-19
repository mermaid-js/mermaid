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
export const timelinePeroidTitleRegex = /([^\n\r:]+)/y;
export const matchTimelinePeroidTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  timelinePeroidTitleRegex.lastIndex = startOffset;
  return timelinePeroidTitleRegex.exec(text);
};

/**
 * Matches a timeline period event
 */
export const timelinePeriodEventRegex = /([^\n\r:]+)/y;
export const matchTimelinePeriodEventTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  timelinePeroidTitleRegex.lastIndex = startOffset;
  return timelinePeroidTitleRegex.exec(text);
};
