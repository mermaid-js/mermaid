/**
 * Matches sankey link source and target node
 */
export const sankeyLinkNodeRegex = /(?:"((?:""|[^"])+)")|([^\n\r,]+(?=%%)|[^\n\r,]+)/;

/**
 * Matches sankey link value
 */
export const sankeyLinkValueRegex = /("(?:0|[1-9]\d*)(?:\.\d+)?"|[\t ]*(?:0|[1-9]\d*)(?:\.\d+)?)/;
