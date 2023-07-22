import { CustomPatternMatcherFunc } from 'chevrotain';

/**
 * Matches a journey section title
 */
export const journeySectionTitleRegex = /section[\t ]+([^\n\r]+)/;

/**
 * Matches a journey task score
 */
export const journeyTaskScoreRegex = /(?!%%.*):[\t ]+(\d)/;

/**
 * Matches a journey task first actor
 */
export const journeyTaskFirstActorRegex = /(?!%%.*):[\t ]+([^\n\r,]+)/;

/**
 * Matches a journey task another actor
 */
export const journeyTaskAnotherActorRegex = /(?!%%.*),[\t ]+([^\n\r,]+)/;

/**
 * Matches a journey task title
 */
export const journeyPeriodTaskRegex = /(?!%%.*)([^\n\r:]+)/y;
export const matchJourneyTaskTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  journeyPeriodTaskRegex.lastIndex = startOffset;
  return journeyPeriodTaskRegex.exec(text);
};
