import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { DrawDefinition, Group, SVG } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import type { PacketDB, Row } from './types.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import type { Diagram } from '../../Diagram.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as PacketDB;
  const config = db.getConfig?.() as Required<PacketDiagramConfig>;
  const { rowHeight, paddingY, bitWidth, bitsPerRow } = config;
  const words = db.getPacket();
  const svgHeight = (rowHeight + paddingY) * words.length + paddingY;
  const svgWidth = bitWidth * bitsPerRow + 2;

  const svg: SVG = selectSvgElement(id);
  configureSvgSize(svg, svgHeight, svgWidth, true);
  svg.attr('height', svgHeight + 'px');

  for (const [row, packet] of words.entries()) {
    drawWord(svg, packet, row, config);
  }
};

const drawWord = (
  svg: SVG,
  row: Row,
  rowNumber: number,
  { rowHeight, paddingX, paddingY, bitWidth, bitsPerRow, showBits }: Required<PacketDiagramConfig>
) => {
  const group: Group = svg.append('g');
  const wordY = rowNumber * (rowHeight + paddingY) + paddingY;
  for (const block of row) {
    const blockX = (block.start % bitsPerRow) * bitWidth + 1;
    const width = (block.end - block.start + 1) * bitWidth - paddingX;
    // Block rectangle
    group
      .append('rect')
      .attr('x', blockX)
      .attr('y', wordY)
      .attr('width', width)
      .attr('height', rowHeight)
      .attr('class', 'block');

    // Block label
    group
      .append('text')
      .attr('x', blockX + width / 2)
      .attr('y', wordY + rowHeight / 2)
      .attr('class', 'label')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(block.label);

    if (!showBits) {
      continue;
    }
    // Start byte count
    const isSingleBlock = block.end === block.start;
    const bitNumberY = wordY - 2;
    group
      .append('text')
      .attr('x', blockX + (isSingleBlock ? width / 2 : 0))
      .attr('y', bitNumberY)
      .attr('class', 'byte start')
      .attr('dominant-baseline', 'auto')
      .attr('text-anchor', isSingleBlock ? 'middle' : 'start')
      .text(block.start);

    // Draw end byte count if it is not the same as start byte count
    if (!isSingleBlock) {
      group
        .append('text')
        .attr('x', blockX + width)
        .attr('y', bitNumberY)
        .attr('class', 'byte end')
        .attr('dominant-baseline', 'auto')
        .attr('text-anchor', 'end')
        .text(block.end);
    }
  }
};
export const renderer = { draw };
