/**
 * Matches sankey link source node
 */
export const sankeyLinkSourceRegex = /(?:"((?:""|[^"])+)")|([^\n\r,]+(?=%%)|[^\n\r,]+)/;

/**
 * Matches sankey link target node
 */
export const sankeyLinkTargetRegex = /,(?:(?:"((?:""|[^"])+)")|([^\n\r,]+))/;

/**
 * Matches sankey link value
 */
export const sankeyLinkValueRegex = /,("(?:0|[1-9]\d*)(?:\.\d+)?"|[\t ]*(?:0|[1-9]\d*)(?:\.\d+)?)/;
