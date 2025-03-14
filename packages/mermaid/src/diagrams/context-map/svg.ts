import type { SVG } from '../../mermaid.js';
import type { Point } from '../../types.js';
import type { D3Svg, EllipseSize, Font, LabelSize } from './drawSvg.js';
import type { Link } from './contextMap.js';

export interface NewContextMapLink {
  link: Link;
  targetLabelSize: LabelSize;
  sourceLabelSize: LabelSize;
  middleLabelSize: { font: Font };
  targetPoint: Point;
  sourcePoint: Point;
}

export function appendContextMapLinkToSvg(svg: SVG, contextMapLink: NewContextMapLink) {
  appendLabel(
    svg,
    contextMapLink.targetLabelSize,
    contextMapLink.link.target.boxText,
    contextMapLink.link.target.bodyText
  );
  appendLabel(
    svg,
    contextMapLink.sourceLabelSize,
    contextMapLink.link.source.boxText,
    contextMapLink.link.source.bodyText
  );
  appendMiddleLabel(svg, contextMapLink);
}

export function appendContextMapLinkPathToSvg(svg: D3Svg, contextMapLink: NewContextMapLink) {
  const sourceLabelPos = contextMapLink.sourceLabelSize.labelCenter;
  const targetLabelPos = contextMapLink.targetLabelSize.labelCenter;

  svg
    .append('path')
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .attr(
      'd',
      `M${sourceLabelPos.x},${sourceLabelPos.y}A0,0 0 0,1 ${targetLabelPos.x},${targetLabelPos.y}`
    );
}

function appendMiddleLabel(svg: D3Svg, contextMapLink: NewContextMapLink) {
  const calculateMidPoint = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => [
    (x1 + x2) / 2,
    (y1 + y2) / 2,
  ];

  const midPoint = calculateMidPoint(
    [contextMapLink.sourcePoint.x, contextMapLink.sourcePoint.y],
    [contextMapLink.targetPoint.x, contextMapLink.targetPoint.y]
  );

  const middleLabel = svg.append('g');
  middleLabel
    .append('text')
    .attr('font-size', contextMapLink.middleLabelSize.font.fontSize)
    .attr('font-family', contextMapLink.middleLabelSize.font.fontFamily)
    .attr('font-weight', contextMapLink.middleLabelSize.font.fontWeight)
    .text(contextMapLink.link.middleText ?? '')
    .attr('x', midPoint[0])
    .attr('y', midPoint[1]);
}

function appendLabel(
  svg: D3Svg,
  {
    boxWidth,
    bodyWidth,
    boxHeight,
    font,
    labelPosition,
    boxTextPosition,
    bodyPosition,
    bodyTextPosition,
  }: LabelSize,
  boxText?: string,
  bodyText?: string
) {
  const label = svg
    .append('g')
    .attr('transform', `translate(${labelPosition.x},${labelPosition.y})`);

  label
    .append('rect')
    .attr('height', boxHeight)
    .attr('width', boxWidth)
    .attr('fill', 'white')
    .attr('x', 0)
    .attr('y', 0)
    .attr('display', (boxText?.length ?? 0) ? null : 'none');

  label
    .append('text')
    .attr('font-size', font.fontSize)
    .attr('font-family', font.fontFamily)
    .attr('font-weight', font.fontWeight)
    .attr('x', boxTextPosition.x)
    .attr('y', boxTextPosition.y)
    .text(boxText ?? '');

  label
    .append('rect')
    .attr('width', bodyWidth)
    .attr('height', boxHeight)
    .attr('stroke-width', 1)
    .attr('stroke', 'black')
    .attr('fill', 'white')
    .attr('x', bodyPosition.x)
    .attr('y', bodyPosition.y)
    .attr('display', (bodyText?.length ?? 0) ? null : 'none');

  label
    .append('text')
    .attr('font-size', font.fontSize)
    .attr('font-family', font.fontFamily)
    .attr('font-weight', font.fontWeight)
    .attr('x', bodyTextPosition.x)
    .attr('y', bodyTextPosition.y)
    .text(bodyText ?? '');
}

export interface NewContextMapNode {
  id: string;
  width: number;
  height: number;
  textPosition: Point | { x: 0; y: 0 };
  position: Point | { x: 0; y: 0 };
  ellipseSize: EllipseSize;
  font: Font;
}

export function appendContextMapNodeToSvg(svg: SVG, contextMapNode: NewContextMapNode) {
  const node = svg
    .append('g')
    .attr('transform', `translate(${contextMapNode.position.x},${contextMapNode.position.y})`);

  node
    .append('ellipse')
    .attr('stroke', 'black')
    .attr('stroke-width', 1.5)
    .attr('rx', contextMapNode.ellipseSize.rx)
    .attr('ry', contextMapNode.ellipseSize.ry)
    .attr('fill', 'white');

  node
    .append('text')
    .attr('font-size', contextMapNode.font.fontSize)
    .attr('font-family', contextMapNode.font.fontFamily)
    .attr('font-weight', contextMapNode.font.fontWeight)
    .attr('x', contextMapNode.textPosition.x)
    .attr('y', contextMapNode.textPosition.y)
    .text(contextMapNode.id);
}
