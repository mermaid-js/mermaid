export enum TextType {
  MessageContent,
  ParticipantName,
}

export interface WidthFunc {
  (text: string, type: TextType): number;
}
