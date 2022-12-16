const sequenceParser = require('../generated-parser/sequenceParser').default;
const seqParser = sequenceParser;

const CreationContext = seqParser.CreationContext;
CreationContext.prototype.Body = CreationContext.prototype.creationBody;
CreationContext.prototype.isCurrent = function (cursor) {
  return isCurrent.bind(this)(cursor);
};

const MessageContext = seqParser.MessageContext;
MessageContext.prototype.Body = MessageContext.prototype.messageBody;
MessageContext.prototype.isCurrent = function (cursor) {
  return isCurrent.bind(this)(cursor);
};

function isCurrent(cursor) {
  try {
    if (cursor === null || cursor === undefined) return false;
    const start = this.start.start;
    const stop = this.Body().stop.stop + 1;

    return cursor >= start && cursor <= stop;
  } catch (e) {
    return false;
  }
}
