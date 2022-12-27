import { default as sequenceParser } from '../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const RetContext = seqParser.RetContext;
const ProgContext = seqParser.ProgContext;
const MessageContext = seqParser.MessageContext;
const CreationContext = seqParser.CreationContext;

RetContext.prototype.ReturnTo = function () {
  const stat = this.parentCtx;
  const block = stat.parentCtx;
  const blockParent = block.parentCtx;
  if (blockParent instanceof ProgContext) {
    return blockParent.Starter();
  } else {
    let ctx = blockParent;
    while (ctx && !(ctx instanceof MessageContext) && !(ctx instanceof CreationContext)) {
      if (ctx instanceof ProgContext) {
        return ctx.Starter();
      }
      ctx = ctx.parentCtx;
    }
    if (ctx instanceof MessageContext) {
      return ctx.messageBody()?.from()?.getFormattedText() || ctx.ClosestAncestorStat().Origin();
    }
    return ctx.ClosestAncestorStat().Origin();
  }
};
