import { default as sequenceParser } from '../generated-parser/sequenceParser';
const ProgContext = sequenceParser.ProgContext;

ProgContext.prototype.Starter = function () {
  const declaredStarter = this.head()?.starterExp()?.starter()?.getFormattedText();
  let starterFromStartingMessage;
  let starterFromParticipant;
  let starterFromParticipantGroup;
  const stat = this.block()?.stat();
  if (stat && stat[0]) {
    const messageFrom = stat[0].message()?.messageBody()?.from()?.getFormattedText();
    const asyncMessageFrom = stat[0].asyncMessage()?.from()?.getFormattedText();
    starterFromStartingMessage = messageFrom || asyncMessageFrom;
  } else {
    const children = this.head()?.children;
    if (children && children[0]) {
      const child = children[0];
      if (child instanceof sequenceParser.ParticipantContext) {
        starterFromParticipant = child.name()?.getFormattedText();
      }
      if (child instanceof sequenceParser.GroupContext) {
        const participants = child.participant();
        if (participants && participants[0]) {
          starterFromParticipantGroup = participants[0].name()?.getFormattedText();
        }
      }
    }
  }

  return (
    declaredStarter ||
    starterFromStartingMessage ||
    starterFromParticipant ||
    starterFromParticipantGroup ||
    '_STARTER_'
  );
};
