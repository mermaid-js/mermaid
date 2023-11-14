import type { Packet } from 'mermaid-parser';
import type { PacketDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export type Block = Pick<ArrayElement<Packet['blocks']>, 'start' | 'end' | 'label'>;
export type Row = Required<Block>[];

export interface PacketDB extends DiagramDBBase<PacketDiagramConfig> {
  pushWord: (word: Row) => void;
  getPacket: () => Row[];
}

export interface PacketStyleOptions {
  byteFontSize?: string;
  startByteColor?: string;
  endByteColor?: string;
  labelColor?: string;
  labelFontSize?: string;
  blockStrokeColor?: string;
  blockStrokeWidth?: string;
  blockFillColor?: string;
  titleColor?: string;
  titleFontSize?: string;
}

export interface PacketData {
  packet: Row[];
}
