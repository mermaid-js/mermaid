import type { Link } from './contextMap.js';
import type { NewContextMapLink, NewContextMapNode } from './svg.js';
import {
  appendContextMapLinkPathToSvg,
  appendContextMapLinkToSvg,
  appendContextMapNodeToSvg,
} from './svg.js';
import type { SVG } from '../../mermaid.js';

export type D3Svg = SVG;

export function buildGraph(
  svg: D3Svg,
  { nodes, links }: { nodes: Node[]; links: Link[] },
  configuration: Configuration
) {
  const contextMap = new ContextMap(configuration);
  contextMap.create(svg, links, nodes);

  // show the center svg.append("circle").attr("x", 0).attr("y", 0).attr("r", 5).attr("fill", "green")
}

export class ContextMap {
  constructor(private configuration: Configuration) {}

  create(svg: D3Svg, links: Link[], nodes: Node[]) {
    const height = this.configuration.height;
    const width = this.configuration.width;
    const scaling = this.configuration.scaling;

    svg.attr('viewBox', [
      (-width * scaling) / 2,
      (-height * scaling) / 2,
      width * scaling,
      height * scaling,
    ]);

    const contextMapNodes = nodes.map((node) =>
      ContextMapNode.createContextMapNode(node, this.configuration)
    );
    ContextMapNode.disposeNodesInThePlane(
      contextMapNodes,
      { width, height },
      this.configuration.nodeMargin
    );

    const springEmbedder = new SpringEmbedder(this.configuration, {
      springRigidityConstK: 0.0055,
      effectOfTimeConstDeltaT: 0.4,
      forceConstant: 100000,
      frictionConstant: 0.05,
      simulationIterations: 1500,
    });

    springEmbedder.runSimulation(contextMapNodes, links, (links, nodes) => {
      svg.selectAll('*').remove();

      links.forEach((contextMapLink) => appendContextMapLinkPathToSvg(svg, contextMapLink));
      nodes.forEach((contextMapNode) => appendContextMapNodeToSvg(svg, contextMapNode));
      links.forEach((contextMapLink) => appendContextMapLinkToSvg(svg, contextMapLink));
    });

    // show bounds
    // svg
    //   .append('rect')
    //   .attr('x', (-height / 2) * scaling)
    //   .attr('y', (-width / 2) * scaling)
    //   .attr('height', height * scaling)
    //   .attr('width', width * scaling)
    //   .attr('stroke-width', 3)
    //   .attr('fill', 'transparent')
    //   .attr('stroke', 'black');
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
export interface EllipseSize {
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
    public nodeMargin: NodeMargin,
    public scaling: number
  ) {}
}

interface Point {
  x: number;
  y: number;
}

export interface LabelSize {
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

class SpringEmbedder {
  constructor(
    private configuration: Configuration,
    private algorithmConfigurations: {
      springRigidityConstK: number;
      effectOfTimeConstDeltaT: number;
      forceConstant: number;
      frictionConstant: number;
      simulationIterations: number;
    }
  ) {}
  runSimulation(
    contextMapNodes: NewContextMapNode[],
    links: Link[],
    drawFn: (links: NewContextMapLink[], nodes: NewContextMapNode[]) => void
  ) {
    let speeds: Record<number, Point> = {};
    for (let time = 0; time < this.algorithmConfigurations.simulationIterations; time++) {
      const contextMapLinks = ContextMapLink.createContextMapLinksFromNodes(
        contextMapNodes,
        links,
        this.configuration
      );
      const forces = this.computeForces(contextMapNodes, contextMapLinks, speeds);
      speeds = this.updatePositions(contextMapNodes, forces, speeds);
    }
    const contextMapLinks = ContextMapLink.createContextMapLinksFromNodes(
      contextMapNodes,
      links,
      this.configuration
    );
    drawFn(contextMapLinks, contextMapNodes);
  }

  private updatePositions(
    contextMapNodes: NewContextMapNode[],
    forces: Record<number, Point>,
    speeds: Record<number, Point>
  ) {
    for (const [i, currentNode] of contextMapNodes.entries()) {
      let speed = speeds[i] || { x: 0, y: 0 };
      const deltaV = this.vectorMultiply(
        forces[i],
        this.algorithmConfigurations.effectOfTimeConstDeltaT
      );
      speed = this.vectorSum(speed, deltaV);
      const deltaX = this.vectorMultiply(
        speed,
        this.algorithmConfigurations.effectOfTimeConstDeltaT
      );
      const newPosition = this.vectorSum(currentNode.position, deltaX);
      if (this.isInsideBounds(newPosition, currentNode)) {
        currentNode.position = newPosition;
        speeds[i] = speed;
      }
    }

    return speeds;
  }

  private computeForces(
    contextMapNodes: NewContextMapNode[],
    contextMapLinks: NewContextMapLink[],
    speeds: Record<number, Point>
  ) {
    const forces: Record<number, Point> = {};
    for (let i = 0; i < contextMapNodes.length; i++) {
      forces[i] = { x: 0, y: 0 };
      const currentNode = contextMapNodes[i];

      for (const [j, otherNode] of contextMapNodes.entries()) {
        if (i === j) {
          continue;
        }

        const gravityForce = this.calculateGravity(currentNode, otherNode);
        const springForce = this.calculateSpring(currentNode, otherNode, contextMapLinks);
        const friction = this.calculateFriction(speeds[i] || { x: 0, y: 0 });
        forces[i] = this.vectorSum(forces[i], gravityForce, springForce, friction);
      }
    }
    return forces;
  }

  calculateSpring(
    currentNode: NewContextMapNode,
    otherNode: NewContextMapNode,
    contextMapLinks: NewContextMapLink[]
  ) {
    const isLinked = contextMapLinks.some((contextMapLink) => {
      return (
        (contextMapLink.link.source.id === currentNode.id &&
          contextMapLink.link.target.id === otherNode.id) ||
        (contextMapLink.link.source.id === otherNode.id &&
          contextMapLink.link.target.id === currentNode.id)
      );
    });
    if (!isLinked) {
      return { x: 0, y: 0 };
    }
    const distance = this.calculateDistanceBetweenNodes(currentNode.position, otherNode.position);
    const forceVector = this.vectorMultiply(
      distance,
      -this.algorithmConfigurations.springRigidityConstK
    );
    return forceVector;
  }

  private isInsideBounds(node: Point, nodeSize: { width: number; height: number }): boolean {
    const height = this.configuration.height * this.configuration.scaling;
    const width = this.configuration.width * this.configuration.scaling;
    const horizontalMargin = this.configuration.nodeMargin.horizontal;
    const verticalMargin = this.configuration.nodeMargin.vertical;

    const nodeWidth = nodeSize.width;
    const nodeHeight = nodeSize.height;
    return (
      node.x - nodeWidth / 2 > -width / 2 + horizontalMargin &&
      node.x + nodeWidth / 2 < width / 2 - horizontalMargin &&
      node.y - nodeHeight / 2 > -height / 2 + verticalMargin &&
      node.y + nodeHeight / 2 < height / 2 - verticalMargin
    );
  }

  private calculateGravity(currentNode: NewContextMapNode, otherNode: NewContextMapNode) {
    const distance = this.calculateDistanceBetweenNodes(currentNode.position, otherNode.position);
    const length = this.calculatePointLength(distance);
    const force = this.algorithmConfigurations.forceConstant / length ** 2;
    const forceVector = this.vectorMultiply(distance, force / length);
    return forceVector;
  }

  private calculateFriction(speed: Point) {
    return this.vectorMultiply(speed, -this.algorithmConfigurations.frictionConstant);
  }

  vectorMultiply(v: Point, c: number) {
    return { x: v.x * c, y: v.y * c };
  }

  vectorSum(...points: Point[]) {
    return points.reduce(
      (acc, v) => {
        return {
          x: acc.x + v.x,
          y: acc.y + v.y,
        };
      },
      { x: 0, y: 0 }
    );
  }

  calculatePointLength(point: Point) {
    return Math.sqrt(point.x ** 2 + point.y ** 2);
  }

  calculateDistanceBetweenNodes(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y };
  }
}

export class ContextMapLink {
  static createContextMapLinksFromNodes(
    nodes: NewContextMapNode[],
    links: Link[],
    config: Configuration
  ): NewContextMapLink[] {
    const nodeMap = nodes.reduce((map, node) => {
      map.set(node.id, node);
      return map;
    }, new Map<string, NewContextMapNode>());

    const contextMapLinks: NewContextMapLink[] = [];
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
    sourceNode: NewContextMapNode,
    targetNode: NewContextMapNode,
    link: Link,
    config: Configuration
  ) {
    const sourceLabelIntersection = ContextMapNode.calculateIntersection(
      targetNode,
      sourceNode.position
    );
    const targetLabelSize: LabelSize = ContextMapLink.calculateLabelSize(
      config,
      link.target.boxText,
      link.target.bodyText,
      sourceLabelIntersection
    );

    const targetLabelIntersection = ContextMapNode.calculateIntersection(
      sourceNode,
      targetNode.position
    );
    const sourceLabelSize: LabelSize = ContextMapLink.calculateLabelSize(
      config,
      link.source.boxText,
      link.source.bodyText,
      targetLabelIntersection
    );

    const contextMapLink = {
      link,
      targetLabelSize,
      sourceLabelSize,
      middleLabelSize: { font: config.font },
      targetPoint: targetNode.position,
      sourcePoint: sourceNode.position,
    };
    return contextMapLink;
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
}

export class ContextMapNode {
  static disposeNodesInThePlane(
    nodes: NewContextMapNode[],
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

      node.position = { x, y };
    }

    return nodes;
  }

  static createContextMapNode(node: Node, configuration: Configuration): NewContextMapNode {
    const textWidth = configuration.calculateTextWidth(node.id);
    const textHeight = configuration.calculateTextHeight(node.id);
    const width = configuration.ellipseSize.rx + textWidth;
    const height = configuration.ellipseSize.ry + textHeight;
    const textX = -(textWidth / 2);
    const textY = textHeight / 4;
    const rx = width / 2;
    const ry = height / 2;
    return {
      width,
      height,
      font: configuration.font,
      id: node.id,
      textPosition: { x: textX, y: textY },
      position: { x: 0, y: 0 },
      ellipseSize: { rx, ry },
    };
  }

  static calculateIntersection(targetNode: NewContextMapNode, { x: x2, y: y2 }: Point) {
    const { x: centerX, y: centerY } = targetNode.position;
    const { rx: a, ry: b } = targetNode.ellipseSize;
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
}
