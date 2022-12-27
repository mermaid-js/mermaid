import { default as antlr4 } from 'antlr4';
import { default as sequenceParser } from '../../../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const StatContext = seqParser.StatContext;

antlr4.ParserRuleContext.prototype.ClosestAncestorStat = function () {
  let current = this;
  while (!(current instanceof StatContext)) {
    current = current.parentCtx;
  }
  if (current instanceof StatContext) {
    return current;
  }
  return undefined;
};

antlr4.ParserRuleContext.prototype.ClosestAncestorBlock = function () {
  const parentCtx = this.ClosestAncestorStat()?.parentCtx;
  // if parent is a block, return it
  if (parentCtx instanceof seqParser.BlockContext) {
    return parentCtx;
  }
  console.warn('Cannot find closest ancestor block for context:', this);
  return undefined;
};

export {};
