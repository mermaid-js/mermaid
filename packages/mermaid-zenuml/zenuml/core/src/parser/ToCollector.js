import { Participants } from './Participants';

import antlr4 from 'antlr4';
import { default as sequenceParserListener } from '../generated-parser/sequenceParserListener';
import { default as sequenceParser } from '../generated-parser/sequenceParser';
const seqParser = sequenceParser;
const ProgContext = seqParser.ProgContext;

let participants = undefined;
let isBlind = false;
let groupId = undefined;
const ToCollector = new sequenceParserListener();

// Rules:
// 1. Later declaration win
// 2. Participant declaration overwrite cannot be overwritten by To or Starter
let onParticipant = function (ctx) {
  // if(!(ctx?.name())) return;
  if (isBlind) return;
  const type = ctx?.participantType()?.getFormattedText().replace('@', '');
  const participant = ctx?.name()?.getFormattedText() || 'Missing `Participant`';
  const stereotype = ctx.stereotype()?.name()?.getFormattedText();
  const width = (ctx.width && ctx.width() && Number.parseInt(ctx.width().getText())) || undefined;
  const label = ctx.label && ctx.label()?.name()?.getFormattedText();
  const explicit = true;
  const color = ctx.COLOR()?.getText();
  const comment = ctx.getComment();
  participants.Add(
    participant,
    false,
    stereotype,
    width,
    groupId,
    label,
    explicit,
    type,
    color,
    comment
  );
};
ToCollector.enterParticipant = onParticipant;

let onTo = function (ctx) {
  if (isBlind) return;
  let participant = ctx.getFormattedText();
  participants.Add(participant);
};

ToCollector.enterFrom = onTo;
ToCollector.enterTo = onTo;

ToCollector.enterStarter = function (ctx) {
  let participant = ctx.getFormattedText();
  participants.Add(participant, true);
};

ToCollector.enterCreation = function (ctx) {
  if (isBlind) return;
  const participant = ctx.Owner();
  participants.Add(participant);
};

ToCollector.enterParameters = function () {
  isBlind = true;
};

ToCollector.exitParameters = function () {
  isBlind = false;
};

ToCollector.enterCondition = function () {
  isBlind = true;
};

ToCollector.exitCondition = function () {
  isBlind = false;
};

ToCollector.enterGroup = function (ctx) {
  // group { A } => groupId = undefined
  // group group1 { A } => groupId = "group1"
  groupId = ctx.name()?.getFormattedText();
};

ToCollector.exitGroup = function () {
  groupId = undefined;
};

ToCollector.enterRet = function (ctx) {
  if (ctx.asyncMessage()) {
    return;
  }
  participants.Add(ctx.From());
  participants.Add(ctx.ReturnTo());
};

const walker = antlr4.tree.ParseTreeWalker.DEFAULT;

ToCollector.getParticipants = function (context, withStarter) {
  participants = new Participants();
  if (withStarter && context instanceof ProgContext) {
    participants.Add(context.Starter(), true);
  }
  walker.walk(this, context);
  return participants;
};

export default ToCollector;
