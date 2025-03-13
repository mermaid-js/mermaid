import { updateNodeBounds, getNodeClasses } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { userNodeOverrides, styles2String } from './handDrawnShapeStyles.js';
import rough from 'roughjs';
import { drawRect } from './drawRect.js';
import { getConfig } from '../../../config.js';
import type { EntityNode } from '../../../diagrams/er/erTypes.js';
import { createText } from '../../createText.js';
import { evaluate, parseGenericTypes } from '../../../diagrams/common/common.js';
import { select } from 'd3';
import { calculateTextWidth } from '../../../utils.js';
import type { MermaidConfig } from '../../../config.type.js';
import type { D3Selection } from '../../../types.js';

export async function erBox<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  // Treat node as entityNode for certain entityNode checks
  const entityNode = node as unknown as EntityNode;
  if (entityNode.alias) {
    node.label = entityNode.alias;
  }

  // Background shapes are drawn to fill in the background color and cover up the ER diagram edge markers.
  // Draw background shape once.
  if (node.look === 'handDrawn') {
    const { themeVariables } = getConfig();
    const { background } = themeVariables;
    const backgroundNode = {
      ...node,
      id: node.id + '-background',
      look: 'default',
      cssStyles: ['stroke: none', `fill: ${background}`],
    };
    await erBox(parent, backgroundNode);
  }

  const config = getConfig();
  node.useHtmlLabels = config.htmlLabels;
  let PADDING = config.er?.diagramPadding ?? 10;
  let TEXT_PADDING = config.er?.entityPadding ?? 6;

  const { cssStyles } = node;
  const { labelStyles } = styles2String(node);

  // Draw rect if no attributes are found
  if (entityNode.attributes.length === 0 && node.label) {
    const options = {
      rx: 0,
      ry: 0,
      labelPaddingX: PADDING,
      labelPaddingY: PADDING * 1.5,
      classes: '',
    };
    // Set minimum width
    if (
      calculateTextWidth(node.label, config) + options.labelPaddingX * 2 <
      config.er!.minEntityWidth!
    ) {
      node.width = config.er!.minEntityWidth;
    }
    const shapeSvg = await drawRect(parent, node, options);

    // drawRect doesn't center non-htmlLabels correctly as of now, so translate label
    if (!evaluate(config.htmlLabels)) {
      const textElement = shapeSvg.select('text');
      const bbox = (textElement.node() as SVGTextElement)?.getBBox();
      textElement.attr('transform', `translate(${-bbox.width / 2}, 0)`);
    }
    return shapeSvg;
  }

  if (!config.htmlLabels) {
    PADDING *= 1.25;
    TEXT_PADDING *= 1.25;
  }

  let cssClasses = getNodeClasses(node);
  if (!cssClasses) {
    cssClasses = 'node default';
  }

  const shapeSvg = parent
    // @ts-ignore Ignore .insert on SVGAElement
    .insert('g')
    .attr('class', cssClasses)
    .attr('id', node.domId || node.id);

  const nameBBox = await addText(shapeSvg, node.label ?? '', config, 0, 0, ['name'], labelStyles);
  nameBBox.height += TEXT_PADDING;
  let yOffset = 0;
  const yOffsets = [];
  let maxTypeWidth = 0;
  let maxNameWidth = 0;
  let maxKeysWidth = 0;
  let maxCommentWidth = 0;
  let keysPresent = true;
  let commentPresent = true;
  for (const attribute of entityNode.attributes) {
    const typeBBox = await addText(
      shapeSvg,
      attribute.type,
      config,
      0,
      yOffset,
      ['attribute-type'],
      labelStyles
    );
    maxTypeWidth = Math.max(maxTypeWidth, typeBBox.width + PADDING);
    const nameBBox = await addText(
      shapeSvg,
      attribute.name,
      config,
      0,
      yOffset,
      ['attribute-name'],
      labelStyles
    );
    maxNameWidth = Math.max(maxNameWidth, nameBBox.width + PADDING);
    const keysBBox = await addText(
      shapeSvg,
      attribute.keys.join(),
      config,
      0,
      yOffset,
      ['attribute-keys'],
      labelStyles
    );
    maxKeysWidth = Math.max(maxKeysWidth, keysBBox.width + PADDING);
    const commentBBox = await addText(
      shapeSvg,
      attribute.comment,
      config,
      0,
      yOffset,
      ['attribute-comment'],
      labelStyles
    );
    maxCommentWidth = Math.max(maxCommentWidth, commentBBox.width + PADDING);

    yOffset +=
      Math.max(typeBBox.height, nameBBox.height, keysBBox.height, commentBBox.height) +
      TEXT_PADDING;
    yOffsets.push(yOffset);
  }
  yOffsets.pop();
  let totalWidthSections = 4;

  if (maxKeysWidth <= PADDING) {
    keysPresent = false;
    maxKeysWidth = 0;
    totalWidthSections--;
  }
  if (maxCommentWidth <= PADDING) {
    commentPresent = false;
    maxCommentWidth = 0;
    totalWidthSections--;
  }

  const shapeBBox = shapeSvg.node()!.getBBox();
  // Add extra padding to attribute components to accommodate for difference in width
  if (
    nameBBox.width + PADDING * 2 - (maxTypeWidth + maxNameWidth + maxKeysWidth + maxCommentWidth) >
    0
  ) {
    const difference =
      nameBBox.width + PADDING * 2 - (maxTypeWidth + maxNameWidth + maxKeysWidth + maxCommentWidth);
    maxTypeWidth += difference / totalWidthSections;
    maxNameWidth += difference / totalWidthSections;
    if (maxKeysWidth > 0) {
      maxKeysWidth += difference / totalWidthSections;
    }
    if (maxCommentWidth > 0) {
      maxCommentWidth += difference / totalWidthSections;
    }
  }

  const maxWidth = maxTypeWidth + maxNameWidth + maxKeysWidth + maxCommentWidth;

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const w = Math.max(shapeBBox.width + PADDING * 2, node?.width || 0, maxWidth);
  const h = Math.max(shapeBBox.height + (yOffsets[0] || yOffset) + TEXT_PADDING, node?.height || 0);
  const x = -w / 2;
  const y = -h / 2;

  // Translate attribute text labels
  shapeSvg.selectAll('g:not(:first-child)').each((_: any, i: number, nodes: any) => {
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
        if (text.attr('class').includes('attribute-name')) {
          translateX += maxTypeWidth;
        } else if (text.attr('class').includes('attribute-keys')) {
          translateX += maxTypeWidth + maxNameWidth;
        } else if (text.attr('class').includes('attribute-comment')) {
          translateX += maxTypeWidth + maxNameWidth + maxKeysWidth;
        }
      }
    }

    text.attr(
      'transform',
      `translate(${x + PADDING / 2 + translateX}, ${translateY + y + nameBBox.height + TEXT_PADDING / 2})`
    );
  });
  // Center the name
  shapeSvg
    .select('.name')
    .attr('transform', 'translate(' + -nameBBox.width / 2 + ', ' + (y + TEXT_PADDING / 2) + ')');

  // Draw shape
  const roughRect = rc.rectangle(x, y, w, h, options);
  const rect = shapeSvg.insert(() => roughRect, ':first-child').attr('style', cssStyles!.join(''));

  const { themeVariables } = getConfig();
  const { rowEven, rowOdd, nodeBorder } = themeVariables;

  yOffsets.push(0);
  // Draw row rects
  for (const [i, yOffset] of yOffsets.entries()) {
    if (i === 0 && yOffsets.length > 1) {
      continue;
      // Skip first row
    }
    const isEven = i % 2 === 0 && yOffset !== 0;
    const roughRect = rc.rectangle(x, nameBBox.height + y + yOffset, w, nameBBox.height, {
      ...options,
      fill: isEven ? rowEven : rowOdd,
      stroke: nodeBorder,
    });
    shapeSvg
      .insert(() => roughRect, 'g.label')
      .attr('style', cssStyles!.join(''))
      .attr('class', `row-rect-${i % 2 === 0 ? 'even' : 'odd'}`);
  }

  // Draw divider lines
  // Name line
  let roughLine = rc.line(x, nameBBox.height + y, w + x, nameBBox.height + y, options);
  shapeSvg.insert(() => roughLine).attr('class', 'divider');
  // First line
  roughLine = rc.line(maxTypeWidth + x, nameBBox.height + y, maxTypeWidth + x, h + y, options);
  shapeSvg.insert(() => roughLine).attr('class', 'divider');
  // Second line
  if (keysPresent) {
    roughLine = rc.line(
      maxTypeWidth + maxNameWidth + x,
      nameBBox.height + y,
      maxTypeWidth + maxNameWidth + x,
      h + y,
      options
    );
    shapeSvg.insert(() => roughLine).attr('class', 'divider');
  }
  // Third line
  if (commentPresent) {
    roughLine = rc.line(
      maxTypeWidth + maxNameWidth + maxKeysWidth + x,
      nameBBox.height + y,
      maxTypeWidth + maxNameWidth + maxKeysWidth + x,
      h + y,
      options
    );
    shapeSvg.insert(() => roughLine).attr('class', 'divider');
  }

  // Attribute divider lines
  for (const yOffset of yOffsets) {
    roughLine = rc.line(
      x,
      nameBBox.height + y + yOffset,
      w + x,
      nameBBox.height + y + yOffset,
      options
    );
    shapeSvg.insert(() => roughLine).attr('class', 'divider');
  }

  updateNodeBounds(node, rect);

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };
  return shapeSvg;
}

// Helper function to add label text g with translate position and style
async function addText<T extends SVGGraphicsElement>(
  shapeSvg: D3Selection<T>,
  labelText: string,
  config: MermaidConfig,
  translateX = 0,
  translateY = 0,
  classes: string[] = [],
  style = ''
) {
  const label = shapeSvg
    .insert('g')
    .attr('class', `label ${classes.join(' ')}`)
    .attr('transform', `translate(${translateX}, ${translateY})`)
    .attr('style', style);

  // Return types need to be parsed
  if (labelText !== parseGenericTypes(labelText)) {
    labelText = parseGenericTypes(labelText);
    // Work around
    labelText = labelText.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  const text = label.node()!.appendChild(
    await createText(
      label,
      labelText,
      {
        width: calculateTextWidth(labelText, config) + 100,
        style,
        useHtmlLabels: config.htmlLabels,
      },
      config
    )
  );
  // Undo work around now that text passed through correctly
  if (labelText.includes('&lt;') || labelText.includes('&gt;')) {
    let child = text.children[0];
    child.textContent = child.textContent.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    while (child.childNodes[0]) {
      child = child.childNodes[0];
      // Replace its text content
      child.textContent = child.textContent.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    }
  }

  let bbox = text.getBBox();
  if (evaluate(config.htmlLabels)) {
    const div = text.children[0];
    div.style.textAlign = 'start';
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  return bbox;
}
