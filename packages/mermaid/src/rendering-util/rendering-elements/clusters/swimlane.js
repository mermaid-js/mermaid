import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { evaluate } from '../../../config.js';
import { log } from '../../../logger.js';
import { select } from 'd3';
import rough from 'roughjs';
import { createText } from '../../createText.ts';
import intersectRect from '../intersect/intersect-rect.js';
import { styles2String, userNodeOverrides } from '../shapes/handDrawnShapeStyles.js';

/**
 * Swimlane cluster shape (lane). Extracted from the shared clusters.js so the
 * swimlane-specific rendering lives on its own; registered in the clusters.js
 * shape dispatch table. Supports LR/TB and the handdrawn (rough) look.
 */
export const swimlane = async (parent, node) => {
  const siteConfig = getConfig();
  const { themeVariables, handDrawnSeed } = siteConfig;
  const { clusterBkg, clusterBorder } = themeVariables;
  const laneStroke = clusterBorder;

  const { labelStyles, nodeStyles, borderStyles, backgroundStyles } = styles2String(node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster swimlane ' + (node.cssClasses || ''))
    .attr('id', node.id)
    .attr('data-id', node.id)
    .attr('data-et', 'cluster')
    .attr('data-look', node.look);

  const useHtmlLabels = evaluate(siteConfig.flowchart.htmlLabels);

  // Determine if this is a left-to-right layout (title on left, rotated)
  const isLR = node.direction === 'LR';

  // Create the label and insert it after the rects
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label swimlane-label');

  const text = await createText(labelEl, node.label, {
    style: node.labelStyle,
    useHtmlLabels,
    isNode: true,
    width: node.width,
  });

  // Get the size of the label
  let bbox = text.getBBox();

  if (useHtmlLabels) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const padding = node.padding ?? 0;
  const width = node.width <= bbox.width + padding ? bbox.width + padding : node.width;
  if (node.width <= bbox.width + padding) {
    node.diff = (width - node.width) / 2 - padding;
  } else {
    node.diff = -padding;
  }

  const height = node.height;
  const laneTop = node.y - height / 2;
  const laneBottom = node.y + height / 2;
  const laneLeft = node.x - width / 2;

  // Top of the content area across all lanes, computed in the swimlanes
  // layout write-back. This is the Y of the highest node in the pool.
  const contentTop =
    node.swimlaneContentTop !== undefined ? node.swimlaneContentTop : laneTop + height / 3;

  // Title band sizing - for LR, the title is on the left; for TB, on top.
  //
  // NOTE: For TB we intentionally use a smaller internal padding so that
  // the visible gap between the title band and the first row of nodes is
  // larger. In LR, the original padding works well visually and is kept.
  const titlePaddingY = isLR ? 4 : 0;
  const desiredTitleSize = bbox.height + 2 * titlePaddingY;

  let titleRect;
  let bodyRect;

  if (isLR) {
    // LR layout: title band is a vertical strip on the left
    // For rotated text, title width is based on label height (rotated)
    const titleWidth = Math.max(desiredTitleSize, bbox.height + 2 * titlePaddingY);
    const bodyX = laneLeft + titleWidth;
    const bodyWidth = Math.max(0, width - titleWidth);

    if (node.look === 'handDrawn') {
      // @ts-ignore TODO: Fix rough typings
      const rc = rough.svg(shapeSvg);
      const titleOptions = userNodeOverrides(node, {
        roughness: 0.7,
        fill: clusterBkg,
        stroke: laneStroke,
        fillWeight: 3,
        seed: handDrawnSeed,
      });
      const bodyOptions = userNodeOverrides(node, {
        roughness: 0.7,
        fill: 'none',
        stroke: laneStroke,
        seed: handDrawnSeed,
      });

      const roughTitle = rc.rectangle(laneLeft, laneTop, titleWidth, height, titleOptions);
      titleRect = shapeSvg.insert(() => roughTitle, ':first-child');
      const roughBody = rc.rectangle(bodyX, laneTop, bodyWidth, height, bodyOptions);
      bodyRect = shapeSvg.insert(() => roughBody, ':first-child');

      titleRect.select('path:nth-child(2)').attr('style', borderStyles.join(';'));
      titleRect.select('path').attr('style', backgroundStyles.join(';').replace('fill', 'stroke'));
    } else {
      titleRect = shapeSvg.insert('rect', ':first-child');
      bodyRect = shapeSvg.insert('rect', ':first-child');

      titleRect
        .attr('class', 'swimlane-title')
        .attr('style', nodeStyles)
        .attr('x', laneLeft)
        .attr('y', laneTop)
        .attr('width', titleWidth)
        .attr('height', height)
        .attr('fill', clusterBkg)
        .attr('stroke', laneStroke);

      bodyRect
        .attr('class', 'swimlane-body')
        .attr('style', nodeStyles)
        .attr('x', bodyX)
        .attr('y', laneTop)
        .attr('width', bodyWidth)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('stroke', laneStroke);
    }

    // Position the label: center it within the title band and rotate -90 degrees
    // After rotation, the label reads bottom-to-top
    const labelCenterX = laneLeft + titleWidth / 2;
    const labelCenterY = node.y;
    labelEl.attr(
      'transform',
      `translate(${labelCenterX}, ${labelCenterY}) rotate(-90) translate(${-bbox.width / 2}, ${-bbox.height / 2})`
    );
  } else {
    // TB layout (default): title band is a horizontal strip on top
    const headerMaxHeight = Math.max(0, contentTop - laneTop);
    const titleHeight = Math.min(desiredTitleSize, headerMaxHeight);

    // The lane body should visually start exactly where the title band ends
    // so that their borders touch. The vertical gap between the title text
    // and the first row of nodes is then controlled purely by the
    // headerMaxHeight/titleHeight relationship (and thus by titlePaddingY).
    const bodyY = laneTop + titleHeight;
    const contentHeight = Math.max(0, laneBottom - bodyY);

    const x = node.x - width / 2;

    if (node.look === 'handDrawn') {
      // @ts-ignore TODO: Fix rough typings
      const rc = rough.svg(shapeSvg);
      const titleOptions = userNodeOverrides(node, {
        roughness: 0.7,
        fill: clusterBkg,
        stroke: laneStroke,
        fillWeight: 3,
        seed: handDrawnSeed,
      });
      const bodyOptions = userNodeOverrides(node, {
        roughness: 0.7,
        fill: 'none',
        stroke: laneStroke,
        seed: handDrawnSeed,
      });

      const roughTitle = rc.rectangle(x, laneTop, width, titleHeight, titleOptions);
      titleRect = shapeSvg.insert(() => roughTitle, ':first-child');
      const roughBody = rc.rectangle(x, bodyY, width, contentHeight, bodyOptions);
      bodyRect = shapeSvg.insert(() => roughBody, ':first-child');

      titleRect.select('path:nth-child(2)').attr('style', borderStyles.join(';'));
      titleRect.select('path').attr('style', backgroundStyles.join(';').replace('fill', 'stroke'));
    } else {
      titleRect = shapeSvg.insert('rect', ':first-child');
      bodyRect = shapeSvg.insert('rect', ':first-child');

      titleRect
        .attr('class', 'swimlane-title')
        .attr('style', nodeStyles)
        .attr('x', x)
        .attr('y', laneTop)
        .attr('width', width)
        .attr('height', titleHeight)
        .attr('fill', clusterBkg)
        .attr('stroke', laneStroke);

      bodyRect
        .attr('class', 'swimlane-body')
        .attr('style', nodeStyles)
        .attr('x', x)
        .attr('y', bodyY)
        .attr('width', width)
        .attr('height', contentHeight)
        .attr('fill', 'none')
        .attr('stroke', laneStroke);
    }

    // Place the label centered within the title band
    const labelX = node.x - bbox.width / 2;
    const labelY = laneTop + (titleHeight - bbox.height) / 2;
    labelEl.attr('transform', `translate(${labelX}, ${labelY})`);
  }

  log.trace('Swimlane data ', node, JSON.stringify(node));

  if (labelStyles) {
    const span = labelEl.select('span');
    if (span) {
      span.attr('style', labelStyles);
    }
  }

  node.offsetX = 0;
  node.width = width;
  node.height = height;
  // Used by layout engine to position subgraph in parent
  node.offsetY = bbox.height - padding / 2;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};
