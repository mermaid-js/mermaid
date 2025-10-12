import type { Packet, RecursiveAstOmit } from '@mermaid-js/parser';
import type { DiagramDBBase } from '../../diagram-api/types.js';
import type { ArrayElement } from '../../types.js';
import type { BaseDiagramConfig } from '../../config.type.js';

export type PacketBlock = RecursiveAstOmit<ArrayElement<Packet['blocks']>>;
export type PacketWord = Required<PacketBlock>[];

export interface PacketDiagramConfig extends BaseDiagramConfig {
  /**
   * The number of bits to display per row.
   */
  bitsPerRow?: number;
  /**
   * The width of each bit in the packet diagram.
   */
  bitWidth?: number;
  /**
   * The height of each row in the packet diagram.
   */
  rowHeight?: number;
  /**
   * The horizontal padding between the blocks in a row.
   */
  paddingX?: number;
  /**
   * The vertical padding between the rows.
   */
  paddingY?: number;
  /**
   * Toggle to display or hide bit numbers.
   */
  showBits?: boolean;
  /**
   * The width of the stroke around each block.
   */
  blockStrokeWidth?: string;
  /**
   * The fill color of each block.
   */
  blockFillColor?: string;
  /**
   * The stroke color of each block.
   */
  blockStrokeColor?: string;
  /**
   * Font size for byte numbers
   */
  byteFontSize?: string;
  /**
   * Color for start byte numbers
   */
  startByteColor?: string;
  /**
   * Color for end byte numbers
   */
  endByteColor?: string;
  /**
   * Color for block labels
   */
  labelColor?: string;
  /**
   * Font size for block labels
   */
  labelFontSize?: string;
  /**
   * Color for diagram title
   */
  titleColor?: string;
  /**
   * Font size for diagram title
   */
  titleFontSize?: string;
}

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
