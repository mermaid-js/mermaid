import { getNodeClasses, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import type { D3Selection } from '../../../types.js';
import { calculateTextWidth, decodeEntities } from '../../../utils.js';
import { getConfig, sanitizeText } from '../../../diagram-api/diagramAPI.js';
import { createText } from '../../createText.js';
import { select } from 'd3';
import type { Requirement, Element } from '../../../diagrams/requirement/types.js';

export async function requirementBox<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const requirementNode = node as unknown as Requirement;
  const elementNode = node as unknown as Element;
  const padding = 20;
  const gap = 20;
  const isRequirementNode = 'verifyMethod' in node;
  const classes = getNodeClasses(node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', classes)
    .attr('id', node.domId ?? node.id);

  let typeHeight;
  if (isRequirementNode) {
    typeHeight = await addText(
      shapeSvg,
      `&lt;&lt;${requirementNode.type}&gt;&gt;`,
      0,
      node.labelStyle
    );
  } else {
    typeHeight = await addText(shapeSvg, '&lt;&lt;Element&gt;&gt;', 0, node.labelStyle);
  }

  let accumulativeHeight = typeHeight;
  const nameHeight = await addText(
    shapeSvg,
    requirementNode.name,
    accumulativeHeight,
    node.labelStyle + '; font-weight: bold;'
  );
  accumulativeHeight += nameHeight + gap;

  // Requirement
  if (isRequirementNode) {
    const idHeight = await addText(
      shapeSvg,
      `${requirementNode.requirementId ? `Id: ${requirementNode.requirementId}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );

    accumulativeHeight += idHeight;
    const textHeight = await addText(
      shapeSvg,
      `${requirementNode.text ? `Text: ${requirementNode.text}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );
    accumulativeHeight += textHeight;
    const riskHeight = await addText(
      shapeSvg,
      `${requirementNode.risk ? `Risk: ${requirementNode.risk}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );
    accumulativeHeight += riskHeight;
    await addText(
      shapeSvg,
      `${requirementNode.verifyMethod ? `Verification: ${requirementNode.verifyMethod}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );
  } else {
    // Element
    const typeHeight = await addText(
      shapeSvg,
      `${elementNode.type ? `Type: ${elementNode.type}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );
    accumulativeHeight += typeHeight;
    await addText(
      shapeSvg,
      `${elementNode.docRef ? `Doc Ref: ${elementNode.docRef}` : ''}`,
      accumulativeHeight,
      node.labelStyle
    );
  }

  const totalWidth = (shapeSvg.node()?.getBBox().width ?? 200) + padding;
  const totalHeight = (shapeSvg.node()?.getBBox().height ?? 200) + padding;
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  // Setup roughjs
  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  // Create and center rectangle
  const roughRect = rc.rectangle(x, y, totalWidth, totalHeight, options);

  const rect = shapeSvg.insert(() => roughRect, ':first-child');
  rect.attr('class', 'basic label-container').attr('style', nodeStyles);

  // Re-translate labels now that rect is centered
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeSvg.selectAll('.label').each((_: any, i: number, nodes: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = select<any, unknown>(nodes[i]);

    const transform = text.attr('transform');
    let translateX = 0;
    let translateY = 0;
    if (transform) {
      const regex = RegExp(/translate\(([^,]+),([^)]+)\)/);
      const translate = regex.exec(transform);
      if (translate) {
        translateX = parseFloat(translate[1]);
        translateY = parseFloat(translate[2]);
      }
    }

    const newTranslateY = translateY - totalHeight / 2;
    let newTranslateX = x + padding / 2;

    // Keep type and name labels centered.
    if (i === 0 || i === 1) {
      newTranslateX = translateX;
    }
    // Set the updated transform attribute
    text.attr('transform', `translate(${newTranslateX}, ${newTranslateY + padding})`);
  });

  // Insert divider line if there is body text
  if (accumulativeHeight > typeHeight + nameHeight + gap) {
    const roughLine = rc.line(
      x,
      y + typeHeight + nameHeight + gap,
      x + totalWidth,
      y + typeHeight + nameHeight + gap,
      options
    );
    const dividerLine = shapeSvg.insert(() => roughLine);
    dividerLine.attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}

async function addText<T extends SVGGraphicsElement>(
  parentGroup: D3Selection<T>,
  inputText: string,
  yOffset: number,
  style = ''
) {
  if (inputText === '') {
    return 0;
  }
  const textEl = parentGroup.insert('g').attr('class', 'label').attr('style', style);
  const config = getConfig();
  const useHtmlLabels = config.htmlLabels ?? true;

  const text = await createText(
    textEl,
    sanitizeText(decodeEntities(inputText)),
    {
      width: calculateTextWidth(inputText, config) + 50, // Add room for error when splitting text into multiple lines
      classes: 'markdown-node-label',
      useHtmlLabels,
      style,
    },
    config
  );
  let bbox;

  if (!useHtmlLabels) {
    const textChild = text.children[0];
    for (const child of textChild.children) {
      child.textContent = child.textContent.replaceAll('&gt;', '>').replaceAll('&lt;', '<');
      if (style) {
        child.setAttribute('style', style);
      }
    }
    // Get the bounding box after the text update
    bbox = text.getBBox();
    // Add extra height so it is similar to the html labels
    bbox.height += 6;
  } else {
    const div = text.children[0];
    const dv = select(text);

    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  // Center text and offset by yOffset
  textEl.attr('transform', `translate(${-bbox.width / 2},${-bbox.height / 2 + yOffset})`);
  return bbox.height;
}
