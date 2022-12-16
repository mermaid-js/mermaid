import { antlr4, ParticipantListener } from '../positioning/ParticipantListener';

export function OrderedParticipants(rootContext: any) {
  const listener = new ParticipantListener();
  const walker = antlr4.default.tree.ParseTreeWalker.DEFAULT;
  walker.walk(listener, rootContext);
  return listener.result();
}
