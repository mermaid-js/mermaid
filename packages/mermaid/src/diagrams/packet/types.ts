import type { Packet, RecursiveAstOmit } from '@mermaid-js/parser';
import type { PacketDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { ArrayElement } from '../../types.js';

export type PacketBlock = RecursiveAstOmit<ArrayElement<Packet['blocks']>>;
export type PacketWord = Required<PacketBlock>[];

export interface PacketDB extends DiagramDBBase<PacketDiagramConfig> {
  pushWord: (word: PacketWord) => void;
  getPacket: () => PacketWord[];
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
  packet: PacketWord[];
}
