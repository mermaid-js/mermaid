import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import intersect from '../intersect/index.js';
import { compileStyles, styles2String } from './handDrawnShapeStyles.js';
import { getNodeClasses, insertLabel, labelHelper, updateNodeBounds } from './util.js';

interface UsecaseJsonRow {
  key: string;
  accessibleKey: string;
  value: string;
}

type UsecaseJsonTableNode = Node & {
  labelType?: 'text' | 'markdown';
  jsonRows?: UsecaseJsonRow[];
  accessibleName?: string;
};

interface MeasuredBox {
  width: number;
  height: number;
  x?: number;
  y?: number;
  left?: number;
  top?: number;
}

interface MeasuredCell {
  label: D3Selection<SVGGElement>;
  bbox: MeasuredBox;
}

const CELL_PADDING_X = 8;
const CELL_PADDING_Y = 4;
const DEFAULT_BORDER_WIDTH = 1;

const positionLabel = (
  label: D3Selection<SVGGElement>,
  bbox: MeasuredBox,
  centerX: number,
  centerY: number
) => {
  const originX = bbox.x ?? bbox.left ?? 0;
  const originY = bbox.y ?? bbox.top ?? 0;
  label.attr(
    'transform',
    `translate(${centerX - bbox.width / 2 - originX},${centerY - bbox.height / 2 - originY})`
  );
};

const numericStrokeWidth = (value: string | undefined) => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_BORDER_WIDTH;
};

export async function usecaseJsonTable<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  const tableNode = node as UsecaseJsonTableNode;
  const { labelStyles, nodeStyles } = styles2String(node);
  const { stylesMap } = compileStyles(node);
  node.labelStyle = labelStyles;

  const {
    shapeSvg,
    bbox: titleBox,
    label: titleLabel,
  } = await labelHelper(parent, node, getNodeClasses(node, 'usecase-json-table'));
  shapeSvg.attr('role', 'img');
  if (tableNode.accessibleName) {
    shapeSvg.attr('aria-label', tableNode.accessibleName);
  }
  titleLabel.attr('class', 'label usecase-json-title');

  const tableGroup = shapeSvg.append('g').attr('class', 'usecase-json-table-grid');
  const measuredRows: { key: MeasuredCell; value: MeasuredCell }[] = [];
  for (const row of tableNode.jsonRows ?? []) {
    const key = await insertLabel(tableGroup, row.key, {
      labelStyle: labelStyles,
      useHtmlLabels: node.useHtmlLabels,
      padding: 0,
      centerLabel: true,
    });
    const value = await insertLabel(tableGroup, row.value, {
      labelStyle: labelStyles,
      useHtmlLabels: node.useHtmlLabels,
      padding: 0,
      centerLabel: true,
    });
    measuredRows.push({
      key: {
        label: key.label.attr('class', 'label usecase-json-key'),
        bbox: key.bbox,
      },
      value: {
        label: value.label.attr('class', 'label usecase-json-value'),
        bbox: value.bbox,
      },
    });
  }

  const keyWidth =
    Math.max(0, ...measuredRows.map(({ key }) => key.bbox.width)) + CELL_PADDING_X * 2;
  const measuredValueWidth =
    Math.max(0, ...measuredRows.map(({ value }) => value.bbox.width)) + CELL_PADDING_X * 2;
  const titleWidth = titleBox.width + CELL_PADDING_X * 2;
  const innerWidth = Math.max(titleWidth, keyWidth + measuredValueWidth);
  const valueWidth = measuredValueWidth + Math.max(0, innerWidth - keyWidth - measuredValueWidth);
  const titleHeight = titleBox.height + CELL_PADDING_Y * 2;
  const rowHeights = measuredRows.map(
    ({ key, value }) => Math.max(key.bbox.height, value.bbox.height) + CELL_PADDING_Y * 2
  );
  const innerHeight = titleHeight + rowHeights.reduce((sum, height) => sum + height, 0);
  const borderWidth = numericStrokeWidth(stylesMap.get('stroke-width'));
  const totalWidth = innerWidth + borderWidth * 2;
  const totalHeight = innerHeight + borderWidth * 2;
  const left = -innerWidth / 2;
  const top = -innerHeight / 2;

  const outerBorder = shapeSvg
    .insert('rect', ':first-child')
    .attr('class', 'label-container usecase-json-border')
    .attr('x', -totalWidth / 2)
    .attr('y', -totalHeight / 2)
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('style', nodeStyles);

  tableGroup
    .insert('rect', ':first-child')
    .attr('class', 'usecase-json-cell usecase-json-title-cell')
    .attr('x', left)
    .attr('y', top)
    .attr('width', innerWidth)
    .attr('height', titleHeight)
    .attr('style', nodeStyles);
  positionLabel(titleLabel, titleBox, 0, top + titleHeight / 2);

  let rowTop = top + titleHeight;
  measuredRows.forEach(({ key, value }, index) => {
    const rowHeight = rowHeights[index];
    const rowGroup = tableGroup
      .append('g')
      .attr('class', 'usecase-json-row')
      .attr('data-row-index', index)
      .attr('transform', `translate(0,${rowTop})`);

    rowGroup
      .append('rect')
      .attr('class', 'usecase-json-cell usecase-json-key-cell')
      .attr('x', left)
      .attr('y', 0)
      .attr('width', keyWidth)
      .attr('height', rowHeight)
      .attr('style', nodeStyles);
    rowGroup
      .append('rect')
      .attr('class', 'usecase-json-cell usecase-json-value-cell')
      .attr('x', left + keyWidth)
      .attr('y', 0)
      .attr('width', valueWidth)
      .attr('height', rowHeight)
      .attr('style', nodeStyles);

    rowGroup.node()?.append(key.label.node()!, value.label.node()!);
    positionLabel(key.label, key.bbox, left + keyWidth / 2, rowHeight / 2);
    positionLabel(value.label, value.bbox, left + keyWidth + valueWidth / 2, rowHeight / 2);
    rowTop += rowHeight;
  });

  updateNodeBounds(node, outerBorder);
  node.intersect = (point) => intersect.rect(node, point);
  return shapeSvg;
}
