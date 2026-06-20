import type { SVG } from '../../diagram-api/types.js';
import type { D3Selection } from '../../types.js';
import type { LayoutData, Node, NodeNote } from '../../rendering-util/types.js';

const NOTE_MIN_WIDTH = 50;
const NOTE_MAX_WIDTH = 230;
const NOTE_PADDING_X = 5;
const NOTE_PADDING_Y = 2;
const NOTE_FONT_SIZE = 12;
const NOTE_LINE_HEIGHT = 15;
const NOTE_OPACITY = 0.96;
const NOTE_TARGET_GAP = 1;

type NotesLayer = D3Selection<SVGGElement>;
type PositionedNode = Node & Required<Pick<Node, 'x' | 'y'>>;

const isPositionedNode = (node: Node | undefined): node is Node & Required<Pick<Node, 'x' | 'y'>> =>
  node?.x !== undefined && node?.y !== undefined;

const getRootGroup = (svg: SVG): NotesLayer => {
  const svgGroup = svg.select<SVGGElement>('g');
  const rootGroup = svgGroup.select<SVGGElement>('g.root');
  return rootGroup.empty() ? svgGroup : rootGroup;
};

const estimateTextWidth = (text: string) => text.length * NOTE_FONT_SIZE * 0.58;

const measureText = (layer: NotesLayer, text: string, fontFamily: string) => {
  if (text.length === 0) {
    return 0;
  }

  const measuringText = layer
    .append('text')
    .attr('font-family', fontFamily)
    .attr('font-size', NOTE_FONT_SIZE)
    .attr('visibility', 'hidden')
    .text(text);

  let width = estimateTextWidth(text);
  const node = measuringText.node();
  try {
    const measuredWidth = node?.getComputedTextLength?.();
    if (measuredWidth !== undefined && Number.isFinite(measuredWidth)) {
      width = measuredWidth;
    }
  } finally {
    measuringText.remove();
  }

  return width;
};

const splitLongToken = (layer: NotesLayer, token: string, maxWidth: number, fontFamily: string) => {
  const chunks: string[] = [];
  let chunk = '';

  for (const char of token) {
    const candidate = chunk + char;
    if (chunk.length > 0 && measureText(layer, candidate, fontFamily) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }

  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  return chunks;
};

const wrapLine = (layer: NotesLayer, line: string, maxWidth: number, fontFamily: string) => {
  if (measureText(layer, line, fontFamily) <= maxWidth) {
    return [line];
  }

  const wrappedLines: string[] = [];
  let currentLine = '';
  const tokens = line.split(/(\s+)/).filter((token) => token.length > 0);

  for (const token of tokens) {
    const candidate = currentLine + token;
    if (candidate.trim().length === 0 || measureText(layer, candidate, fontFamily) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine.trim().length > 0) {
      wrappedLines.push(currentLine.trimEnd());
      currentLine = token.trimStart();
    }

    if (measureText(layer, currentLine, fontFamily) > maxWidth) {
      const chunks = splitLongToken(layer, currentLine, maxWidth, fontFamily);
      wrappedLines.push(...chunks.slice(0, -1));
      currentLine = chunks.at(-1) ?? '';
    }
  }

  if (currentLine.trim().length > 0) {
    wrappedLines.push(currentLine.trimEnd());
  }

  return wrappedLines.length > 0 ? wrappedLines : [''];
};

const wrapNoteText = (layer: NotesLayer, text: string, fontFamily: string) => {
  const maxTextWidth = NOTE_MAX_WIDTH - NOTE_PADDING_X * 2;
  return text
    .split('\n')
    .flatMap((line) => wrapLine(layer, line.trimEnd(), maxTextWidth, fontFamily));
};

const noteFontFamily = (data4Layout: LayoutData) =>
  data4Layout.config.themeVariables?.fontFamily ?? 'Arial, sans-serif';

const parseTranslate = (transform: string | null) => {
  const match = transform?.match(
    /translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/
  );
  if (!match) {
    return undefined;
  }

  return {
    x: Number(match[1]),
    y: Number(match[2] ?? 0),
  };
};

const findRenderedNodeElement = (root: SVGGElement | null, node: Node) => {
  if (!root) {
    return undefined;
  }

  return [...root.querySelectorAll<SVGGElement>('g.node')].find(
    (element) => element.id === node.domId || element.id === node.id
  );
};

const getRenderedPositionedNode = (
  root: SVGGElement | null,
  node: Node | undefined
): PositionedNode | undefined => {
  if (!node) {
    return undefined;
  }

  if (isPositionedNode(node)) {
    return node;
  }

  const renderedNode = findRenderedNodeElement(root, node);
  const position = parseTranslate(renderedNode?.getAttribute('transform') ?? null);
  if (!renderedNode || !position) {
    return undefined;
  }

  const bbox = renderedNode.getBBox();
  return {
    ...node,
    x: position.x,
    y: position.y,
    width: bbox.width,
    height: bbox.height,
  };
};

const getNoteTranslate = (target: Node, note: NodeNote, width: number, height: number) => {
  const targetWidth = target.width ?? 0;
  const targetHeight = target.height ?? 0;
  const targetLeft = target.x! - targetWidth / 2;
  const targetRight = target.x! + targetWidth / 2;
  const targetTop = target.y! - targetHeight / 2;
  const targetBottom = target.y! + targetHeight / 2;

  switch (note.position) {
    case 'left':
      return { x: targetLeft - width - NOTE_TARGET_GAP, y: target.y! - height / 2 };
    case 'right':
      return { x: targetRight + NOTE_TARGET_GAP, y: target.y! - height / 2 };
    case 'top':
      return { x: target.x! - width / 2, y: targetTop - height - NOTE_TARGET_GAP };
    case 'bottom':
      return { x: target.x! - width / 2, y: targetBottom + NOTE_TARGET_GAP };
  }
};

const drawNote = (layer: NotesLayer, target: Node, note: NodeNote, data4Layout: LayoutData) => {
  const fontFamily = noteFontFamily(data4Layout);
  const lines = wrapNoteText(layer, note.text, fontFamily);
  const textWidth = Math.max(...lines.map((line) => measureText(layer, line, fontFamily)), 0);
  const noteWidth = Math.max(
    NOTE_MIN_WIDTH,
    Math.min(NOTE_MAX_WIDTH, textWidth + NOTE_PADDING_X * 2)
  );
  const noteHeight = lines.length * NOTE_LINE_HEIGHT + NOTE_PADDING_Y * 2;
  const { x, y } = getNoteTranslate(target, note, noteWidth, noteHeight);

  const noteGroup = layer
    .append('g')
    .attr('class', `flowchart-note flowchart-note-${note.position}`)
    .attr('data-target', note.target)
    .attr('transform', `translate(${x}, ${y})`);

  noteGroup
    .append('rect')
    .attr('class', 'flowchart-note-background')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', noteWidth)
    .attr('height', noteHeight)
    .attr('opacity', NOTE_OPACITY);

  const text = noteGroup
    .append('text')
    .attr('class', 'flowchart-note-text')
    .attr('x', NOTE_PADDING_X)
    .attr('y', NOTE_PADDING_Y + NOTE_FONT_SIZE)
    .attr('font-family', fontFamily)
    .attr('font-size', NOTE_FONT_SIZE);

  lines.forEach((line, index) => {
    text
      .append('tspan')
      .attr('x', NOTE_PADDING_X)
      .attr('dy', index === 0 ? 0 : NOTE_LINE_HEIGHT)
      .text(line);
  });
};

export const drawFlowchartNotes = (svg: SVG, data4Layout: LayoutData) => {
  const notes = data4Layout.notes ?? [];
  if (notes.length === 0) {
    return;
  }

  const rootGroup = getRootGroup(svg);
  const rootElement = rootGroup.node();
  const nodes = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  const layer = rootGroup.append('g').attr('class', 'flowchart-notes');

  for (const note of notes) {
    const target = getRenderedPositionedNode(rootElement, nodes.get(note.target));
    if (target) {
      drawNote(layer, target, note, data4Layout);
    }
  }
};
