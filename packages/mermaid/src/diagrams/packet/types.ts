import type { Packet } from 'mermaid-parser';
import type { DiagramDB } from '../../diagram-api/types.js';

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export type Block = Pick<ArrayElement<Packet['blocks']>, 'start' | 'end' | 'label'>;
export type Row = Required<Block>[];

export interface PacketDB extends DiagramDB {
  getPacket: () => Row[];
}
