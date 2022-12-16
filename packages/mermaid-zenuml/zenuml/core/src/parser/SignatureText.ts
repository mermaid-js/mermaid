// Owner is the `to` for a message or the name in the creation.
import sequenceParser from '../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const MessageContext = seqParser.MessageContext;
const AsyncMessageContext = seqParser.AsyncMessageContext;
const CreationContext = seqParser.CreationContext;

// @ts-ignore
MessageContext.prototype.SignatureText = function () {
  return this.messageBody()
    ?.func()
    ?.signature()
    ?.map((s: any) => s?.getFormattedText())
    .join('.');
};

// @ts-ignore
AsyncMessageContext.prototype.SignatureText = function () {
  // @ts-ignore
  return this.content()?.getFormattedText();
};

// @ts-ignore
CreationContext.prototype.SignatureText = function () {
  const params = this.creationBody().parameters();
  // @ts-ignore
  const text = params?.parameter()?.length > 0 ? params.getFormattedText() : 'create';
  return '«' + text + '»';
};
