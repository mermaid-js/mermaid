import { select } from 'd3';
import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { D3Element } from '../../types.js';
import { createText } from '../../rendering-util/createText.js';
import { sanitizeText } from '../common/common.js';
import type { FilledIshikawaNode, IshikawaDB } from './ishikawaTypes.js';

const getTextObject = (node: FilledIshikawaNode) => {
  const configuration = getConfig();
  const text = sanitizeText(node.description, configuration);
  const fontSize = configuration.ishikawa?.fontSize ?? 16;
  const fontFamily = configuration.ishikawa?.fontFamily ?? 'Arial, sans-serif';
  const fontWeight = configuration.ishikawa?.fontWeight ?? 'normal';

  return {
    text,
    fontSize,
    fontFamily,
    fontWeight,
  };
};

const createNode = (node: FilledIshikawaNode, _config: MermaidConfig) => {
  const textObject = getTextObject(node);
  const { text, fontSize, fontFamily, fontWeight } = textObject;

  // Create a temporary SVG element to measure text
  const temporarySvg = select('body').append('svg').style('visibility', 'hidden');
  const temporaryText = temporarySvg
    .append('text')
    .style('font-size', fontSize + 'px')
    .style('font-family', fontFamily)
    .style('font-weight', fontWeight)
    .text(text);

  const boundingBox = temporaryText.node()!.getBBox();
  temporarySvg.node()?.remove();

  const padding = node.padding;
  const width = Math.max(boundingBox.width + padding * 2, node.width);
  const height = boundingBox.height + padding * 2;

  return {
    width,
    height,
    textObject,
  };
};

export const drawNode = async (
  db: IshikawaDB,
  svg: D3Element,
  node: FilledIshikawaNode,
  section: number,
  config: MermaidConfig
) => {
  const { width, height, textObject } = createNode(node, config);
  node.width = width;
  node.height = height;
  node.section = section;

  const nodeElement = svg.append('g');
  nodeElement.attr('class', `ishikawa-node ishikawa-node-${node.id} section-${section}`);
  if (node.class) {
    nodeElement.attr('class', nodeElement.attr('class') + ' ' + node.class);
  }

  // Create the node shape based on type
  const shapeElement = nodeElement.append('g');
  let _shape: D3Element;

  switch (node.type) {
    case db.nodeType.RECT: {
      _shape = shapeElement
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 0)
        .attr('ry', 0);
      break;
    }
    case db.nodeType.ROUNDED_RECT: {
      _shape = shapeElement
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 10)
        .attr('ry', 10);
      break;
    }
    case db.nodeType.CIRCLE: {
      const radius = Math.max(width, height) / 2;
      _shape = shapeElement
        .append('circle')
        .attr('r', radius)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
    }
    case db.nodeType.CLOUD: {
      // Simple cloud shape using ellipse
      _shape = shapeElement
        .append('ellipse')
        .attr('rx', width / 2)
        .attr('ry', height / 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2);
      break;
    }
    case db.nodeType.HEXAGON: {
      // Hexagon shape
      const hexagonRadius = Math.max(width, height) / 2;
      const hexagonPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = width / 2 + hexagonRadius * Math.cos(angle);
        const y = height / 2 + hexagonRadius * Math.sin(angle);
        hexagonPoints.push(`${x},${y}`);
      }
      _shape = shapeElement.append('polygon').attr('points', hexagonPoints.join(' '));
      break;
    }
    default: {
      // Default: no border
      _shape = shapeElement
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', 'none');
      break;
    }
  }

  // Add text
  const textElement = nodeElement.append('g');
  const textNode = await createText(
    textElement,
    textObject.text,
    {
      width: width,
      isNode: true,
      classes: 'ishikawa-text',
    },
    config
  );

  // Center the text within the node
  const useHtmlLabels = config.htmlLabels ?? false;
  if (useHtmlLabels) {
    // For HTML labels, center using transform
    const bbox = textNode.getBoundingClientRect();
    textElement.attr('transform', `translate(${width / 2 - bbox.width / 2}, ${height / 2 - bbox.height / 2})`);
  } else {
    // For SVG text, get bounding box and center it
    // Structure: nodeElement (g) -> textElement (g) -> labelGroup (g) -> text (with y='-10.1')
    // Box: nodeElement (g) -> shapeElement (g) -> rect (at 0,0 with width x height)
    
    // Get bbox from the actual text node (the <text> element)
    // This bbox is relative to labelGroup, which is at (0,0) relative to textElement (g)
    const bbox = (textNode as SVGGraphicsElement).getBBox();
    
    // Box is positioned at (0, 0) relative to nodeElement, with size width x height
    // shapeElement has no transform, so rect is at (0,0) to (width, height)
    // Box center relative to nodeElement
    const boxCenterX = width / 2;
    const boxCenterY = height / 2;
    
    // Text bbox center relative to labelGroup (which is at 0,0 relative to textElement g)
    // bbox.x and bbox.y are relative to the <text> element's coordinate system
    const textCenterX = bbox.x + bbox.width / 2;
    const textCenterY = bbox.y + bbox.height / 2;
    
    // Calculate transform to apply to textElement (g) to center text in box
    // textElement (g) is a child of nodeElement, so:
    // - Box center is at (boxCenterX, boxCenterY) relative to nodeElement
    // - Text center is currently at (textCenterX, textCenterY) relative to textElement (g)
    // - We want: textCenter + transform = boxCenter (in nodeElement coordinates)
    // - So: transform = boxCenter - textCenter
    const translateX = boxCenterX - textCenterX;
    const translateY = boxCenterY - textCenterY;
    
    // Verify that text fits in box (mathematical conditions)
    // Conditions: translateX + bbox.x >= 0, translateY + bbox.y >= 0,
    //             translateX + bbox.x + bbox.width <= width,
    //             translateY + bbox.y + bbox.height <= height
    const textLeft = translateX + bbox.x;
    const textTop = translateY + bbox.y;
    const textRight = translateX + bbox.x + bbox.width;
    const textBottom = translateY + bbox.y + bbox.height;
    
    // Ensure text is within box bounds
    if (textLeft < 0 || textTop < 0 || textRight > width || textBottom > height) {
      // Text doesn't fit - adjust to keep it within bounds
      const clampedTranslateX = Math.max(0 - bbox.x, Math.min(width - bbox.x - bbox.width, translateX));
      const clampedTranslateY = Math.max(0 - bbox.y, Math.min(height - bbox.y - bbox.height, translateY));
      textElement.attr('transform', `translate(${clampedTranslateX}, ${clampedTranslateY})`);
    } else {
      // Text fits - apply centered transform
      textElement.attr('transform', `translate(${translateX}, ${translateY})`);
    }
  }

  // Store the element for later positioning
  db.setElementForNodeId(node.id, nodeElement);

  return nodeElement;
};

export const positionNode = (db: IshikawaDB, node: FilledIshikawaNode) => {
  const element = db.getElementByNodeId(node.id);
  if (element) {
    // Position nodeElement so the top-left corner of the box is at (node.x - width/2, node.y - height/2)
    // This centers the box at (node.x, node.y)
    element.attr('transform', `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`);
  }
};

export const draw = (_text: string, _id: string, _version: string, _config: MermaidConfig) => {
  // This function is not used in the current implementation
  // The actual drawing is handled by the renderer
};
