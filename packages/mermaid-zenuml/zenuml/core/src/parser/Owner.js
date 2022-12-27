import { default as sequenceParser } from '../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const CreationContext = seqParser.CreationContext;
const MessageContext = seqParser.MessageContext;
const AsyncMessageContext = seqParser.AsyncMessageContext;

CreationContext.prototype.Assignee = function () {
  return this.creationBody()?.assignment()?.assignee()?.getFormattedText();
};

CreationContext.prototype.Constructor = function () {
  return this.creationBody()?.construct()?.getFormattedText();
};

// Owner is essentially the 'to' or receiver of a message.
// For example, in `S -> A.m1 {B.m2 {C.m3}}`,
//                       |     |     |
// Owner of              m1    m2    m3
CreationContext.prototype.Owner = function () {
  if (!this.Constructor()) {
    return 'Missing Constructor';
  }
  const assignee = this.Assignee();
  const type = this.Constructor();
  return assignee ? `${assignee}:${type}` : type;
};

MessageContext.prototype.To = function () {
  return this.messageBody()?.to()?.getFormattedText();
};

MessageContext.prototype.Owner = function () {
  return this.To() || getOwnerFromAncestor(this.parentCtx);
};

function getOwnerFromAncestor(ctx) {
  while (ctx) {
    if (ctx instanceof CreationContext || ctx instanceof MessageContext) {
      return ctx.Owner();
    }
    ctx = ctx.parentCtx;
  }
  return undefined;
}

AsyncMessageContext.prototype.To = function () {
  return this.to()?.getFormattedText();
};

AsyncMessageContext.prototype.Owner = function () {
  return this.To() || getOwnerFromAncestor(this.parentCtx);
};
