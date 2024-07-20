import * as d3 from 'd3';

import { Configuration, ContextMap, ContextMapLink, ContextMapNode } from './drawSvg.js';
import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';

describe('graph construction', () => {
  const fakeFont = { fontSize: 0, fontFamily: 'any', fontWeight: 0 };

  test('node size', () => {
    const nodeId = 'CustomerSelfServiceContext';
    const node = { id: nodeId };
    const calculateTextWidth = (text?: string): number => text?.length ?? 0;
    const textHeight = 15;
    const fontSize = 10;
    const fontFamily = 'arial';
    const fontWeight = 8;
    const ellipseSize = { rx: 50, ry: 10 };
    const config = new Configuration(
      500,
      500,
      { fontSize, fontFamily, fontWeight },
      calculateTextWidth,
      (_) => textHeight,
      ellipseSize,
      { horizontal: 0, vertical: 0 }
    );

    const contextMapNode = ContextMapNode.createContextMapNode(node, config);

    expect(contextMapNode.position).toStrictEqual({ x: 0, y: 0 });
    expect(contextMapNode.width).toBe(ellipseSize.rx + calculateTextWidth(nodeId));
    expect(contextMapNode.height).toBe(ellipseSize.ry + textHeight);
    expect(contextMapNode.id).toBe('CustomerSelfServiceContext');
    expect(contextMapNode.textPosition).toStrictEqual({
      x: -calculateTextWidth(nodeId) / 2,
      y: textHeight / 4,
    });
  });

  // const textWidth = configuration.calculateTextWidth(node.id)
  // const textHeight = configuration.calculateTextHeight(node.id)
  // const width =  configuration.ellipseSize.rx+textWidth
  // const height =  configuration.ellipseSize.ry+textHeight
  // const textX = -(textWidth/2)
  // const textY = textHeight/4
  // const targetNode = ContextMapNode.createContextMapNode(node, config)
  // const link =  {
  //     source: { id: 'CustomerSelfServiceContext', boxText: undefined, bodyText: undefined },
  //     target: { id: 'PrintingContext', boxText: undefined, bodyText: undefined },
  //     middleText: 'Shared Kernel',
  //   }

  // const contextMapLink = ContextMapLink.createContextMapLink(
  //   sourceNode,
  //   targetNode,
  //   link,
  //   config
  // )

  test('distribute nodes in the plane', () => {
    const config = new Configuration(
      500,
      500,
      fakeFont,
      (text?: string): number => 0,
      (_) => 15,
      { rx: 50, ry: 10 },
      { horizontal: 0, vertical: 0 }
    );

    const contextMapNodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
    ];

    const disposedNodes = ContextMapNode.disposeNodesInThePlane(contextMapNodes, {
      width: 500,
      height: 500,
    });

    const { x: topLeftNodeX, y: topLeftNodeY } = disposedNodes[0].position;
    const { x: topRightNodeX, y: topRightNodeY } = disposedNodes[1].position;
    const { x: botLeftNodeX, y: botLeftNodeY } = disposedNodes[2].position;
    const { x: botRightNodeX, y: botRightNodeY } = disposedNodes[3].position;

    expect(topLeftNodeX + topRightNodeX).toBe(0);
    expect(topLeftNodeY).toBe(topRightNodeY);
    expect(botLeftNodeX + botRightNodeX).toBe(0);
    expect(botLeftNodeY).toBe(botRightNodeY);
  });

  test('distribute 2 nodes in the plane', () => {
    const nodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
    ];

    ContextMapNode.disposeNodesInThePlane(nodes, { width: 500, height: 500 });

    expect(nodes[0].position).toStrictEqual({ x: -50, y: 0 });
    expect(nodes[1].position).toStrictEqual({ x: 50, y: 0 });
  });

  test('distribute 4 nodes in the plane', () => {
    const nodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
    ];

    ContextMapNode.disposeNodesInThePlane(nodes, { width: 500, height: 500 });

    expect(nodes[0].position).toStrictEqual({ x: -50, y: +10 });

    expect(nodes[1].position).toStrictEqual({ x: +50, y: 10 });

    expect(nodes[2].position).toStrictEqual({ x: -50, y: -10 });

    expect(nodes[3].position).toStrictEqual({ x: +50, y: -10 });
  });

  test('distribute 4 nodes in the plane with little width', () => {
    const nodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
    ];

    ContextMapNode.disposeNodesInThePlane(nodes, { width: 120, height: 800 });

    expect(nodes[0].position).toStrictEqual({ x: 0, y: 30 });

    expect(nodes[1].position).toStrictEqual({ x: 0, y: 10 });

    expect(nodes[2].position).toStrictEqual({ x: 0, y: -10 });

    expect(nodes[3].position).toStrictEqual({ x: 0, y: -30 });
  });

  test('distribute 4 nodes in the plane considering margins', () => {
    const nodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'any'),
    ];

    ContextMapNode.disposeNodesInThePlane(
      nodes,
      { width: 400, height: 800 },
      { horizontal: 10, vertical: 10 }
    );

    expect(nodes[0].position).toStrictEqual({ x: -60, y: 20 });

    expect(nodes[1].position).toStrictEqual({ x: +60, y: 20 });

    expect(nodes[2].position).toStrictEqual({ x: -60, y: -20 });

    expect(nodes[3].position).toStrictEqual({ x: +60, y: -20 });
  });

  test('crete link between two nodes', () => {
    const config = new Configuration(
      500,
      500,
      fakeFont,
      (text?: string): number => text?.length ?? 0,
      (_) => 15,
      { rx: 50, ry: 10 },
      { horizontal: 0, vertical: 0 }
    );

    const nodes = [
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'A', { x: -100, y: 0 }),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'B', { x: 100, y: 0 }),
      new ContextMapNode(100, 20, 0, 0, fakeFont, 'C', { x: 200, y: 200 }),
    ];
    const links = [
      {
        source: { id: 'A', boxText: undefined, bodyText: undefined },
        target: { id: 'B', boxText: undefined, bodyText: undefined },
        middleText: undefined,
      },
      {
        source: { id: 'A', boxText: undefined, bodyText: undefined },
        target: { id: 'C', boxText: undefined, bodyText: undefined },
        middleText: undefined,
      },
    ];

    const contextMapLinks = ContextMapLink.createContextMapLinksFromNodes(nodes, links, config);

    expect(contextMapLinks[0].link.source.id).toBe('A');
    expect(contextMapLinks[0].link.target.id).toBe('B');

    expect(contextMapLinks[1].link.source.id).toBe('A');
    expect(contextMapLinks[1].link.target.id).toBe('C');
  });
});
