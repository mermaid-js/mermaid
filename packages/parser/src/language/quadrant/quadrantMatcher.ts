import { CustomPatternMatcherFunc } from 'chevrotain';

/**
 * Matches a quadrant x axis left side
 */
export const quadrantXAxisLeftRegex = /x-axis[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant y axis left side
 */
export const quadrantYAxisLeftRegex = /y-axis[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant axis right side
 */
export const quadrantAxisRightRegex = /-->([^\n\r]+)/;

/**
 * Matches a quadrant first quadrant
 */
export const quadrantFirstQuadrantRegex = /quadrant-1[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant second quadrant
 */
export const quadrantSecondQuadrantRegex = /quadrant-2[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant third quadrant
 */
export const quadrantThirdQuadrantRegex = /quadrant-3[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant forth quadrant
 */
export const quadrantForthQuadrantRegex = /quadrant-4[\t ]+([^\n\r]+)/;

/**
 * Matches a quadrant point title
 */
export const quadrantPointTitleRegex = /([^\n\r:]+)/y;
export const matchQuadrantPointTitle: CustomPatternMatcherFunc = (text, startOffset) => {
  quadrantPointTitleRegex.lastIndex = startOffset;
  return quadrantPointTitleRegex.exec(text);
};

/**
 * Match a quadrant start point
 */
export const quadrantStartPointCoordinateRegex = /:[\t ]+\[(0(\.\d+)?|1(\.0+)?)[\t ]*/;

/**
 * Match a quadrant end point
 */
export const quadrantEndPointCoordinateRegex = /,[\t ]+(0(\.\d+)?|1(\.0+)?)[\t ]*]/;
