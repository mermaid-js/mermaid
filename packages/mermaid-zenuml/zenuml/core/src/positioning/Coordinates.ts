import { ARROW_HEAD_WIDTH, MARGIN, MIN_PARTICIPANT_WIDTH, MINI_GAP } from './Constants';
import { TextType, WidthFunc } from './Coordinate';
import { OrderedParticipants } from './OrderedParticipants';
import { IParticipantModel } from './ParticipantListener';
import { find_optimal } from './david/DavidEisenstat';
import { AllMessages } from './MessageContextListener';
import { OwnableMessage, OwnableMessageType } from './OwnableMessage';

export class Coordinates {
  private m: Array<Array<number>> = [];
  private readonly widthProvider: WidthFunc;
  private readonly participantModels: IParticipantModel[];
  private readonly ownableMessages: OwnableMessage[];

  constructor(ctx: any, widthProvider: WidthFunc) {
    this.participantModels = OrderedParticipants(ctx);
    this.ownableMessages = AllMessages(ctx);

    this.widthProvider = widthProvider;
    this.walkThrough();
  }

  getPosition(participantName: string | undefined): number {
    const pIndex = this.participantModels.findIndex((p) => p.name === participantName);
    if (pIndex === -1) {
      throw Error(`Participant ${participantName} not found`);
    }
    return (
      this.getParticipantGap(this.participantModels[0]) +
      find_optimal(this.m)[pIndex] +
      ARROW_HEAD_WIDTH
    );
  }

  walkThrough() {
    this.withParticipantGaps(this.participantModels);
    this.withMessageGaps(this.ownableMessages, this.participantModels);
  }

  private withMessageGaps(
    ownableMessages: OwnableMessage[],
    participantModels: IParticipantModel[]
  ) {
    ownableMessages.forEach((message) => {
      const indexFrom = participantModels.findIndex((p) => p.name === message.from);
      const indexTo = participantModels.findIndex((p) => p.name === message.to);
      if (indexFrom === -1 || indexTo === -1) {
        console.warn(`Participant ${message.from} or ${message.to} not found`);
        return;
      }
      let leftIndex = Math.min(indexFrom, indexTo);
      let rightIndex = Math.max(indexFrom, indexTo);
      try {
        let messageWidth = this.getMessageWidth(message);
        this.m[leftIndex][rightIndex] = Math.max(
          messageWidth + ARROW_HEAD_WIDTH,
          this.m[leftIndex][rightIndex]
        );
      } catch (e) {
        console.warn(`Could not set message gap between ${message.from} and ${message.to}`);
      }
    });
  }

  private getMessageWidth(message: OwnableMessage) {
    const halfSelf = Coordinates.half(this.widthProvider, message.to);
    let messageWidth = this.widthProvider(message.signature, TextType.MessageContent);
    // hack for creation message
    if (message.type === OwnableMessageType.CreationMessage) {
      messageWidth += halfSelf;
    }
    return messageWidth;
  }
  private withParticipantGaps(participantModels: IParticipantModel[]) {
    this.m = participantModels.map((_, i) => {
      return participantModels.map((v, j) => {
        return j - i === 1 ? this.getParticipantGap(v) : 0;
      });
    });
  }

  private getParticipantGap(p: IParticipantModel) {
    let leftNameOrLabel = this.labelOrName(p.left);
    const halfLeft = Coordinates.half(this.widthProvider, leftNameOrLabel);
    const halfSelf = Coordinates.half(this.widthProvider, p.label || p.name);
    const leftIsVisible = p.left && p.left !== '_STARTER_';
    const selfIsVisible = p.name && p.name !== '_STARTER_';
    return ((leftIsVisible && halfLeft) || 0) + ((selfIsVisible && halfSelf) || 0);
  }

  private labelOrName(name: string) {
    const pIndex = this.participantModels.findIndex((p) => p.name === name);
    if (pIndex === -1) return '';
    return this.participantModels[pIndex].label || this.participantModels[pIndex].name;
  }

  private static half(widthProvider: WidthFunc, participantName: string | undefined) {
    if (participantName === '_STARTER_') {
      return MARGIN / 2;
    }
    const halfLeftParticipantWidth = this.halfWithMargin(widthProvider, participantName);
    return Math.max(halfLeftParticipantWidth, MINI_GAP / 2);
  }

  private static halfWithMargin(widthProvider: WidthFunc, participant: string | undefined) {
    return this._getParticipantWidth(widthProvider, participant) / 2 + MARGIN / 2;
  }

  private static _getParticipantWidth(widthProvider: WidthFunc, participant: string | undefined) {
    return Math.max(
      widthProvider(participant || '', TextType.ParticipantName),
      MIN_PARTICIPANT_WIDTH
    );
  }

  getWidth() {
    const lastParticipant = this.participantModels[this.participantModels.length - 1].name;
    const calculatedWidth =
      this.getPosition(lastParticipant) +
      Coordinates.halfWithMargin(this.widthProvider, lastParticipant);
    return Math.max(calculatedWidth, 200);
  }
}
