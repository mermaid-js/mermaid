import { CustomPatternMatcherFunc } from 'chevrotain';

/**
 * Matches sankey link source node
 */
export const sankeyLinkSourceRegex = /("[^\n\r"]+")|([^\n\r,]+)/y;
export const matchSankeyLinkSource: CustomPatternMatcherFunc = (text, startOffset) => {
  sankeyLinkSourceRegex.lastIndex = startOffset;
  return sankeyLinkSourceRegex.exec(text);
};

/**
 * Matches sankey link target node
 */
export const sankeyLinkTargetRegex = /,(?:"([^\n\r"]+)"|([^\n\r,]+))/;

/**
 * Matches sankey link value
 */
export const sankeyLinkValueRegex = /,("(?:0|[1-9]\d*)(?:\.\d+)?"|[\t ]*(?:0|[1-9]\d*)(?:\.\d+)?)/;
