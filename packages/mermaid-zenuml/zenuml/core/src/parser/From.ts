import sequenceParser from '../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const CreationContext = seqParser.CreationContext;
const StatContext = seqParser.StatContext;
const MessageContext = seqParser.MessageContext;
const AsyncMessageContext = seqParser.AsyncMessageContext;
const RetContext = seqParser.RetContext;

// @ts-ignore
CreationContext.prototype.From = function () {
  // @ts-ignore
  if (this.parentCtx instanceof StatContext) {
    // @ts-ignore
    return this.ClosestAncestorStat().Origin();
  }
  return undefined;
};

// @ts-ignore
MessageContext.prototype.ProvidedFrom = function () {
  // @ts-ignore
  return this.messageBody()?.from()?.getFormattedText();
};
// @ts-ignore
MessageContext.prototype.From = function () {
  // @ts-ignore
  return this.ProvidedFrom() || this.ClosestAncestorStat().Origin();
};

// @ts-ignore
AsyncMessageContext.prototype.From = function () {
  if (this.from()) {
    // @ts-ignore
    return this.from().getFormattedText();
  }
  // @ts-ignore
  return this.ClosestAncestorStat().Origin();
};

// @ts-ignore
RetContext.prototype.From = function () {
  // @ts-ignore
  return this.ClosestAncestorStat().Origin();
};
export {};
