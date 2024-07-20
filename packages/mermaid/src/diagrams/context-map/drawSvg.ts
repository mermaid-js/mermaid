import type * as d3 from 'd3';
import type { Link } from './contextMap.js';

export function buildGraph(
  svg: D3Svg,
  { nodes, links }: { nodes: Node[]; links: Link[] },
  configuration: Configuration
) {
  const contextMap = new ContextMap(configuration);
  contextMap.create(svg, links, nodes);

  // show the center svg.append("circle").attr("x", 0).attr("y", 0).attr("r", 5).attr("fill", "green")
}

export type D3Svg = d3.Selection<SVGSVGElement, any, any, any>;
export class ContextMap {
  constructor(private configuration: Configuration) {}

  create(svg: D3Svg, links: Link[], nodes: Node[]) {
    const height = this.configuration.height;
    const width = this.configuration.width;

    svg.attr('viewBox', [-width / 2, -height / 2, width, height]);

    const contextMapNodes = nodes.map((node) =>
      ContextMapNode.createContextMapNode(node, this.configuration)
    );
    ContextMapNode.disposeNodesInThePlane(
      contextMapNodes,
      { width, height },
      this.configuration.nodeMargin
    );

    const contextMapLinks = ContextMapLink.createContextMapLinksFromNodes(
      contextMapNodes,
      links,
      this.configuration
    );

    contextMapLinks.forEach((contextMapLink) => contextMapLink.appendPathTo(svg));
    contextMapNodes.forEach((contextMapNode) => contextMapNode.appendTo(svg));
    contextMapLinks.forEach((contextMapLink) => contextMapLink.appendLabelsTo(svg));
  }
}

export interface Node {
  id: string;
}

export interface Font {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}
interface EllipseSize {
  rx: number;
  ry: number;
}
interface NodeMargin {
  horizontal: number;
  vertical: number;
}
export class Configuration {
  constructor(
    public width: number,
    public height: number,
    public font: Font,
    public calculateTextWidth: (text?: string) => number,
    public calculateTextHeight: (text?: string) => number,
    public ellipseSize: EllipseSize,
    public nodeMargin: NodeMargin
  ) {}
}

interface Point {
  x: number;
  y: number;
}
interface LabelSize {
  labelCenter: Point;
  labelPosition: Point;
  boxWidth: number;
  boxHeight: number;
  boxTextPosition: Point;
  bodyWidth: number;
  bodyPosition: Point;
  bodyTextPosition: Point;
  font: Font;
}
export class ContextMapLink {
  constructor(
    public link: Link,
    private targetLabelSize: LabelSize,
    private sourceLabelSize: LabelSize,
    private middleLabelSize: { font: Font },
    public targetPoint: Point,
    public sourcePoint: Point
  ) {}

  static createContextMapLinksFromNodes(
    nodes: ContextMapNode[],
    links: Link[],
    config: Configuration
  ): ContextMapLink[] {
    const nodeMap = nodes.reduce((map, node) => {
      map.set(node.id, node);
      return map;
    }, new Map<string, ContextMapNode>());

    const contextMapLinks: ContextMapLink[] = [];
    for (const link of links) {
      const sourceNode = nodeMap.get(link.source.id);
      const targetNode = nodeMap.get(link.target.id);
      if (sourceNode && targetNode) {
        contextMapLinks.push(
          ContextMapLink.createContextMapLink(sourceNode, targetNode, link, config)
        );
      }
    }
    return contextMapLinks;
  }

  static createContextMapLink(
    sourceNode: ContextMapNode,
    targetNode: ContextMapNode,
    link: Link,
    config: Configuration
  ) {
    const sourceLabelIntersection = targetNode.calculateIntersection(sourceNode.position);
    const targetLabelSize: LabelSize = ContextMapLink.calculateLabelSize(
      config,
      link.target.boxText,
      link.target.bodyText,
      sourceLabelIntersection
    );

    const targetLabelIntersection = sourceNode.calculateIntersection(targetNode.position);
    const sourceLabelSize: LabelSize = ContextMapLink.calculateLabelSize(
      config,
      link.source.boxText,
      link.source.bodyText,
      targetLabelIntersection
    );

    const contextMapLink = new ContextMapLink(
      link,
      targetLabelSize,
      sourceLabelSize,
      { font: config.font },
      targetNode.position,
      sourceNode.position
    );
    return contextMapLink;
  }

  appendLabelsTo(svg: D3Svg) {
    this.appendLabel(
      svg,
      this.targetLabelSize,
      this.link.target.boxText,
      this.link.target.bodyText
    );
    this.appendLabel(
      svg,
      this.sourceLabelSize,
      this.link.source.boxText,
      this.link.source.bodyText
    );
    this.appendMiddleLabel(svg);
  }

  appendPathTo(svg: D3Svg) {
    this.appendPath(svg);
  }

  private static calculateLabelSize(
    config: Configuration,
    boxText: string | undefined,
    bodyText: string | undefined,
    labelIntersection: Point
  ) {
    const boxTextWidth = config.calculateTextWidth(boxText);
    const bodyTextWidth = config.calculateTextWidth(bodyText);
    const boxHeight = Math.max(
      config.calculateTextHeight(boxText),
      config.calculateTextHeight(bodyText)
    );
    const targetWidth = boxTextWidth + bodyTextWidth;
    const targetLabelSize: LabelSize = {
      labelCenter: labelIntersection,
      labelPosition: {
        x: labelIntersection.x - targetWidth / 2,
        y: labelIntersection.y - boxHeight / 2,
      },
      boxWidth: targetWidth,
      boxHeight: boxHeight,
      boxTextPosition: { x: 1, y: boxHeight - 3 },
      bodyWidth: bodyTextWidth + 2,
      bodyPosition: { x: boxTextWidth, y: 0 },
      bodyTextPosition: { x: boxTextWidth + 1, y: boxHeight - 3 },
      font: config.font,
    };
    return targetLabelSize;
  }

  private appendPath(svg: D3Svg) {
    const sourceLabelPos = this.sourceLabelSize.labelCenter;
    const targetLabelPos = this.targetLabelSize.labelCenter;

    svg
      .append('path')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .attr(
        'd',
        `M${sourceLabelPos.x},${sourceLabelPos.y}A0,0 0 0,1 ${targetLabelPos.x},${targetLabelPos.y}`
      );
  }

  private appendMiddleLabel(svg: D3Svg) {
    const calculateMidPoint = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => [
      (x1 + x2) / 2,
      (y1 + y2) / 2,
    ];

    const midPoint = calculateMidPoint(
      [this.sourcePoint.x, this.sourcePoint.y],
      [this.targetPoint.x, this.targetPoint.y]
    );

    const middleLabel = svg.append('g');
    middleLabel
      .append('text')
      .attr('font-size', this.middleLabelSize.font.fontSize)
      .attr('font-family', this.middleLabelSize.font.fontFamily)
      .attr('font-weight', this.middleLabelSize.font.fontWeight)
      .text(this.link.middleText ?? '')
      .attr('x', midPoint[0])
      .attr('y', midPoint[1]);
  }

  private appendLabel(
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
      .attr('display', boxText?.length ?? 0 ? null : 'none');

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
      .attr('display', bodyText?.length ?? 0 ? null : 'none');

    label
      .append('text')
      .attr('font-size', font.fontSize)
      .attr('font-family', font.fontFamily)
      .attr('font-weight', font.fontWeight)
      .attr('x', bodyTextPosition.x)
      .attr('y', bodyTextPosition.y)
      .text(bodyText ?? '');
  }
}

export class ContextMapNode {
  private rx: number;
  private ry: number;
  constructor(
    public width: number,
    public height: number,

    private textWidth: number,
    private textHeight: number,
    private font: Font,

    public id: string,

    public textPosition: Point = { x: 0, y: 0 },
    public position: Point = { x: 0, y: 0 }
  ) {
    this.rx = width / 2;
    this.ry = height / 2;
  }

  static disposeNodesInThePlane(
    nodes: ContextMapNode[],
    boxSize: { width: number; height: number },
    margin = { horizontal: 0, vertical: 0 }
  ) {
    const center = { x: 0, y: 0 };
    const nodeNumber = nodes.length;

    const proposedColumns = Math.ceil(Math.sqrt(nodeNumber));

    const perRowTotalWidth: number[] = [];
    const perRowTotalHeight: number[] = [];
    let totalHeight = 0;

    let counter = 0;
    let row = 0;
    while (counter < nodes.length) {
      let maxRowHeight = 0;
      for (let column = 0; column < proposedColumns; column++) {
        const node = nodes?.[counter];
        if (!node) {
          break;
        }
        const largerWidth = (perRowTotalWidth[row] ?? 0) + node.width + margin.horizontal * 2;
        if (largerWidth < boxSize.width) {
          perRowTotalWidth[row] = largerWidth;
          if (node.height > maxRowHeight) {
            maxRowHeight = node.height + margin.vertical * 2;
          }
          counter++;
        }
      }
      perRowTotalHeight[row] = (perRowTotalHeight?.[row] ?? 0) + maxRowHeight;
      totalHeight += maxRowHeight;
      row++;
    }

    row = 0;
    let inCurrentRowUsedWidth = 0;
    let inCurrentRowWidthStartingPoint = center.x - perRowTotalWidth[row] / 2;
    let heightStartingPoint = center.y + totalHeight / 2;

    for (const node of nodes) {
      if (perRowTotalWidth[row] <= inCurrentRowUsedWidth) {
        row++;
        inCurrentRowUsedWidth = 0;
        inCurrentRowWidthStartingPoint = center.x - perRowTotalWidth[row] / 2;
        heightStartingPoint -= perRowTotalHeight[row];
      }

      const width = node.width + margin.horizontal * 2;
      const x = inCurrentRowWidthStartingPoint + width / 2;
      const y = heightStartingPoint - perRowTotalHeight[row] / 2;
      inCurrentRowWidthStartingPoint += width;
      inCurrentRowUsedWidth += width;

      node.setPosition({ x, y });
    }

    return nodes;
  }

  static createContextMapNode(node: Node, configuration: Configuration) {
    const textWidth = configuration.calculateTextWidth(node.id);
    const textHeight = configuration.calculateTextHeight(node.id);
    const width = configuration.ellipseSize.rx + textWidth;
    const height = configuration.ellipseSize.ry + textHeight;
    const textX = -(textWidth / 2);
    const textY = textHeight / 4;
    return new ContextMapNode(width, height, textWidth, textHeight, configuration.font, node.id, {
      x: textX,
      y: textY,
    });
  }

  calculateIntersection(
    { x: x2, y: y2 }: Point,
    { x: centerX, y: centerY }: Point = { x: this.position.x, y: this.position.y },
    { rx: a, ry: b }: EllipseSize = { rx: this.rx, ry: this.ry }
  ) {
    const deltaX = x2 - centerX;
    const deltaY = y2 - centerY;
    const angle = Math.atan((deltaY / deltaX) * (a / b));
    let x: number, y: number;
    if (deltaX >= 0) {
      x = centerX + a * Math.cos(angle);
      y = centerY + b * Math.sin(angle);
    } else {
      x = centerX - a * Math.cos(angle);
      y = centerY - b * Math.sin(angle);
    }
    return { x: x, y: y };
  }

  setPosition(position: Point) {
    this.position = position;
  }

  appendTo(svg: D3Svg) {
    const node = svg
      .append('g')
      .attr('transform', `translate(${this.position.x},${this.position.y})`);

    node
      .append('ellipse')
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('rx', this.rx)
      .attr('ry', this.ry)
      .attr('fill', 'white');

    node
      .append('text')
      .attr('font-size', this.font.fontSize)
      .attr('font-family', this.font.fontFamily)
      .attr('font-weight', this.font.fontWeight)
      .attr('x', this.textPosition.x)
      .attr('y', this.textPosition.y)
      .text(this.id);
  }
}
