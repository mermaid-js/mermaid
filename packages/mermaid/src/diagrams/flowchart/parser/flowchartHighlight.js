/**
 * Syntax highlighting configuration for Lezer flowchart parser
 */

import { styleTags, tags as t } from '@lezer/highlight';

export const flowchartHighlight = styleTags({
  // Keywords
  'graphKeyword subgraph end': t.keyword,
  'style linkStyle classDef class default interpolate': t.keyword,
  'click href call': t.keyword,
  'direction directionTB directionBT directionRL directionLR': t.keyword,
  
  // Identifiers
  'nodeString linkId': t.name,
  
  // Literals
  'string mdString': t.string,
  'num': t.number,
  
  // Operators and punctuation
  'arrow startLink thickArrow thickStartLink dottedArrow dottedStartLink invisibleLink': t.operator,
  'colon semi comma': t.punctuation,
  'ps pe sqs sqe diamondStart diamondStop pipe': t.bracket,
  'stadiumStart stadiumEnd subroutineStart subroutineEnd': t.bracket,
  'cylinderStart cylinderEnd doubleCircleStart doubleCircleEnd': t.bracket,
  'ellipseStart ellipseEnd trapStart trapEnd invTrapStart invTrapEnd': t.bracket,
  
  // Special
  'accTitle accDescr': t.meta,
  'shapeDataStart': t.meta,
  'linkTarget': t.literal,
  
  // Text content
  'text': t.content,
  
  // Comments
  'Comment': t.comment
});
