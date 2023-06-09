/**
 * Matches a timeline section title
 */
export const timelineSectionTitleRegex = /section[\t ]+([^\n\r]+)/y;
export const matchTimelineSectionTitle = (text: string, startOffset: number) => {
  timelineSectionTitleRegex.lastIndex = startOffset;
  return timelineSectionTitleRegex.exec(text);
};

/**
 * Matches a timeline period title
 */
export const timelinePeroidTitleRegex = /([^\n\r:]+)/y;
export const matchTimelinePeroidTitle = (text: string, startOffset: number) => {
  timelinePeroidTitleRegex.lastIndex = startOffset;
  return timelinePeroidTitleRegex.exec(text);
};

/**
 * Matches a timeline event
 */
export const timelineEventRegex = /([^\n\r:]+)/y;
export const matchTimelineEventTitle = (text: string, startOffset: number) => {
  timelinePeroidTitleRegex.lastIndex = startOffset;
  return timelinePeroidTitleRegex.exec(text);
};
