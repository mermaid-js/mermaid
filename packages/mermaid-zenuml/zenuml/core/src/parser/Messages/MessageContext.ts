import sequenceParser from '../../generated-parser/sequenceParser';

const seqParser = sequenceParser;
const MessageContext = seqParser.MessageContext;

interface IAssignment {
  assignee: string | undefined;
  type: string | undefined;
}

export class Assignment implements IAssignment {
  assignee: string;
  type: string;
  constructor(assignee: string | undefined, type: string | undefined) {
    // check if type is defined, assignee must be defined
    if (type && !assignee) {
      throw new Error('assignee must be defined if type is defined');
    }
    this.assignee = assignee || '';
    this.type = type || '';
  }

  getText() {
    return [this.assignee, this.type].filter(Boolean).join(':');
  }
}

// @ts-ignore
MessageContext.prototype.Assignment = function () {
  let assignmentContext = this.messageBody().assignment();
  // @ts-ignore
  const assignee = assignmentContext?.assignee()?.getFormattedText();
  // @ts-ignore
  const type = assignmentContext?.type()?.getFormattedText();
  if (assignee) {
    return new Assignment(assignee, type);
  }
  return undefined;
};
