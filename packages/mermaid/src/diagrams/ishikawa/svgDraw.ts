import { select } from 'd3';
import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { createText } from '../../rendering-util/createText.js';
import { sanitizeText } from '../common/common.js';
import type { FilledIshikawaNode, IshikawaDB } from './ishikawaTypes.js';

const getTextObj = (node: FilledIshikawaNode) => {
  const config = getConfig();
  const text = sanitizeText(node.descr, config);
  const fontSize = config.ishikawa?.fontSize ?? 16;
  const fontFamily = config.ishikawa?.fontFamily ?? 'Arial, sans-serif';
  const fontWeight = config.ishikawa?.fontWeight ?? 'normal';

  return {
    text,
    fontSize,
    fontFamily,
    fontWeight,
  };
};

const createNode = (node: FilledIshikawaNode, _config: MermaidConfig) => {
  const textObj = getTextObj(node);
  const { text, fontSize, fontFamily, fontWeight } = textObj;

  // Create a temporary SVG element to measure text
  const tempSvg = select('body').append('svg').style('visibility', 'hidden');
  const tempText = tempSvg
    .append('text')
    .style('font-size', fontSize + 'px')
    .style('font-family', fontFamily)
    .style('font-weight', fontWeight)
    .text(text);

  const bbox = tempText.node()!.getBBox();
  tempSvg.remove();

  const padding = node.padding;
  const width = Math.max(bbox.width + padding * 2, node.width);
  const height = bbox.height + padding * 2;

  return {
    width,
    height,
    textObj,
  };
};

export const drawNode = async (
  db: IshikawaDB,
  svg: D3Element,
  node: FilledIshikawaNode,
  section: number,
  config: MermaidConfig
) => {
  const { width, height, textObj } = createNode(node, config);
  node.width = width;
  node.height = height;
  node.section = section;

  const nodeEl = svg.append('g');
  nodeEl.attr('class', `ishikawa-node ishikawa-node-${node.id} section-${section}`);
  if (node.class) {
    nodeEl.attr('class', nodeEl.attr('class') + ' ' + node.class);
  }

  // Create the node shape based on type
  const shapeEl = nodeEl.append('g');
  let _shape: D3Element;

  switch (node.type) {
    case db.nodeType.RECT: {
      _shape = shapeEl
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 0)
        .attr('ry', 0);
      break;
    }
    case db.nodeType.ROUNDED_RECT: {
      _shape = shapeEl
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 10)
        .attr('ry', 10);
      break;
    }
    case db.nodeType.CIRCLE: {
      const radius = Math.max(width, height) / 2;
      _shape = shapeEl
        .append('circle')
        .attr('r', radius)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
    }
    case db.nodeType.CLOUD: {
      // Simple cloud shape using ellipse
      _shape = shapeEl
        .append('ellipse')
        .attr('rx', width / 2)
        .attr('ry', height / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
    }
    case db.nodeType.HEXAGON: {
      // Hexagon shape
      const hexRadius = Math.max(width, height) / 2;
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = width / 2 + hexRadius * Math.cos(angle);
        const y = height / 2 + hexRadius * Math.sin(angle);
        hexPoints.push(`${x},${y}`);
      }
      _shape = shapeEl.append('polygon').attr('points', hexPoints.join(' '));
      break;
    }
    default: {
      // Default: no border
      _shape = shapeEl
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', 'none');
      break;
    }
  }

  // Add text
  const textEl = nodeEl.append('g');
  await createText(
    textEl,
    textObj.text,
    {
      width: width,
      isNode: true,
      classes: 'ishikawa-text',
    },
    config
  );

  // Store the element for later positioning
  db.setElementForId(node.id, nodeEl);

  return nodeEl;
};

export const positionNode = (db: IshikawaDB, node: FilledIshikawaNode) => {
  const el = db.getElementById(node.id);
  if (el) {
    el.attr('transform', `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`);
  }
};

export const draw = (_text: string, _id: string, _version: string, _config: MermaidConfig) => {
  // This function is not used in the current implementation
  // The actual drawing is handled by the renderer
};
