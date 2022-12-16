const antlr4 = require('antlr4').default;
const sequenceParser = require('../../../generated-parser/sequenceParser').default;

const seqParser = sequenceParser;
const StatContext = seqParser.StatContext;

antlr4.ParserRuleContext.prototype.ClosestAncestorStat = function () {
  let current = this;
  console.log('stat context', StatContext);
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
