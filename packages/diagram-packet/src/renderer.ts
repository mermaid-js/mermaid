import type { Diagram } from '../../Diagram.js';
import type { PacketDiagramConfig } from '../../config.type.js';
import type { DiagramRenderer, DrawDefinition, SVG, SVGGroup } from '../../diagram-api/types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { PacketDB, PacketWord } from './types.js';

const draw: DrawDefinition = (_text, id, _version, diagram: Diagram) => {
  const db = diagram.db as PacketDB;
  const config = db.getConfig();
  const { rowHeight, paddingY, bitWidth, bitsPerRow } = config;
  const words = db.getPacket();
  const title = db.getDiagramTitle();
  const totalRowHeight = rowHeight + paddingY;
  const svgHeight = totalRowHeight * (words.length + 1) - (title ? 0 : rowHeight);
  const svgWidth = bitWidth * bitsPerRow + 2;
  const svg: SVG = selectSvgElement(id);

  svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  configureSvgSize(svg, svgHeight, svgWidth, config.useMaxWidth);

  for (const [word, packet] of words.entries()) {
    drawWord(svg, packet, word, config);
  }

  svg
    .append('text')
    .text(title)
    .attr('x', svgWidth / 2)
    .attr('y', svgHeight - totalRowHeight / 2)
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('class', 'packetTitle');
};

const drawWord = (
  svg: SVG,
  word: PacketWord,
  rowNumber: number,
  {
    rowHeight,
    paddingX,
    paddingY,
    bitWidth,
    bitsPerRow,
    showBits,
    bitOrder,
  }: Required<PacketDiagramConfig>
) => {
  const group: SVGGroup = svg.append('g');
  const wordY = rowNumber * (rowHeight + paddingY) + paddingY;
  const descending = bitOrder === 'descending';
  for (const block of word) {
    const bits = block.end - block.start + 1;
    // Column the block starts at within its row. `descending` mirrors the row, so the row
    // reads from its highest bit down to its lowest, as hardware registers are drawn.
    const firstColumn = block.start % bitsPerRow;
    const column = descending ? bitsPerRow - firstColumn - bits : firstColumn;
    const blockX = column * bitWidth + 1;
    const width = bits * bitWidth - paddingX;
    // Block rectangle
    group
      .append('rect')
      .attr('x', blockX)
      .attr('y', wordY)
      .attr('width', width)
      .attr('height', rowHeight)
      .attr('class', 'packetBlock');

    // Block label
    group
      .append('text')
      .attr('x', blockX + width / 2)
      .attr('y', wordY + rowHeight / 2)
      .attr('class', 'packetLabel')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(block.label);

    if (!showBits) {
      continue;
    }
    // A mirrored block runs from its highest bit on the left down to its lowest on the right.
    const [leadingBit, trailingBit] = descending
      ? [block.end, block.start]
      : [block.start, block.end];

    // Start byte count
    const isSingleBlock = bits === 1;
    const bitNumberY = wordY - 2;
    group
      .append('text')
      .attr('x', blockX + (isSingleBlock ? width / 2 : 0))
      .attr('y', bitNumberY)
      .attr('class', 'packetByte start')
      .attr('dominant-baseline', 'auto')
      .attr('text-anchor', isSingleBlock ? 'middle' : 'start')
      .text(leadingBit);

    // Draw end byte count if it is not the same as start byte count
    if (!isSingleBlock) {
      group
        .append('text')
        .attr('x', blockX + width)
        .attr('y', bitNumberY)
        .attr('class', 'packetByte end')
        .attr('dominant-baseline', 'auto')
        .attr('text-anchor', 'end')
        .text(trailingBit);
    }
  }
};
export const renderer: DiagramRenderer = { draw };
