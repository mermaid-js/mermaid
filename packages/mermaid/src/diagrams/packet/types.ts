import type { Packet } from 'mermaid-parser';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { PacketDiagramConfig } from '../../config.type.js';

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export type Block = Pick<ArrayElement<Packet['blocks']>, 'start' | 'end' | 'label'>;
export type Row = Required<Block>[];

export interface PacketDB extends DiagramDB {
  getPacket: () => Row[];
  getConfig: () => Required<PacketDiagramConfig>;
  clear: () => void;
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
}

export interface PacketData {
  packet: Row[];
}
