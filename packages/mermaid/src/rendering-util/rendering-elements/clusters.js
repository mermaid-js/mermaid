import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../config.js';
import { log } from '../../logger.js';
import { getSubGraphTitleMargins } from '../../utils/subGraphTitleMargins.js';
import { select } from 'd3';
import rough from 'roughjs';
import { createText } from '../createText.ts';
import intersectRect from '../rendering-elements/intersect/intersect-rect.js';
import createLabel from './createLabel.js';
import { createRoundedRectPathD } from './shapes/roundedRectPath.ts';
import { compileStyles, styles2String, userNodeOverrides } from './shapes/handDrawnShapeStyles.js';
import { swimlane } from './clusters/swimlane.js';

const rect = async (parent, node) => {
  log.info('Creating subgraph rect for ', node.id, node);
  const siteConfig = getConfig();
  const { themeVariables, handDrawnSeed } = siteConfig;
  const { clusterBkg, clusterBorder } = themeVariables;

  const { labelStyles, nodeStyles, borderStyles, backgroundStyles } = styles2String(node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster ' + node.cssClasses)
    .attr('id', node.domId)
    .attr('data-look', node.look);

  const useHtmlLabels = getEffectiveHtmlLabels(siteConfig);

  // Create the label and insert it after the rect
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label ');

  let text;
  if (node.labelType === 'markdown') {
    text = await createText(labelEl, node.label, {
      style: node.labelStyle,
      useHtmlLabels,
      isNode: true,
      width: node.width,
    });
  } else {
    text = await createLabel(labelEl, node.label, node.labelStyle || '', false, true);
  }

  // Get the size of the label
  let bbox = text.getBBox();

  if (getEffectiveHtmlLabels(siteConfig)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const width = node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (width - node.width) / 2 - node.padding;
  } else {
    node.diff = -node.padding;
  }

  const height = node.height;
  const x = node.x - width / 2;
  const y = node.y - height / 2;

  log.trace('Data ', node, JSON.stringify(node));
  let rect;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: clusterBkg,
      // fill: 'red',
      stroke: clusterBorder,
      fillWeight: 3,
      seed: handDrawnSeed,
    });
    const roughNode = rc.path(createRoundedRectPathD(x, y, width, height, 0), options);
    rect = shapeSvg.insert(() => {
      log.debug('Rough node insert CXC', roughNode);
      return roughNode;
    }, ':first-child');
    // Should we affect the options instead of doing this?
    rect.select('path:nth-child(2)').attr('style', borderStyles.join(';'));
    rect.select('path').attr('style', backgroundStyles.join(';').replace('fill', 'stroke'));
  } else {
    // add the rect
    rect = shapeSvg.insert('rect', ':first-child');
    // center the rect around its coordinate
    rect
      .attr('style', nodeStyles)
      .attr('rx', node.rx)
      .attr('ry', node.ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);
  }
  const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
  labelEl.attr(
    'transform',
    // This puts the label on top of the box instead of inside it
    `translate(${node.x - bbox.width / 2}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
  );

  if (labelStyles) {
    const span = labelEl.select('span');
    if (span) {
      span.attr('style', labelStyles);
    }
  }
  // Center the label

  const rectBox = rect.node().getBBox();
  node.offsetX = 0;
  node.width = rectBox.width;
  node.height = rectBox.height;
  // Used by layout engine to position subgraph in parent
  node.offsetY = bbox.height - node.padding / 2;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};

/**
 * Non visible cluster where the note is group with its
 *
 * @param {any} parent
 * @param {any} node
 * @returns {any} ShapeSvg
 */
const noteGroup = (parent, node) => {
  // Add outer g element
  const shapeSvg = parent.insert('g').attr('class', 'note-cluster').attr('id', node.domId);

  // add the rect
  const rect = shapeSvg.insert('rect', ':first-child');

  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  // center the rect around its coordinate
  rect
    .attr('rx', node.rx)
    .attr('ry', node.ry)
    .attr('x', node.x - node.width / 2 - halfPadding)
    .attr('y', node.y - node.height / 2 - halfPadding)
    .attr('width', node.width + padding)
    .attr('height', node.height + padding)
    .attr('fill', 'none');

  const rectBox = rect.node().getBBox();
  node.width = rectBox.width;
  node.height = rectBox.height;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: { width: 0, height: 0 } };
};

const roundedWithTitle = async (parent, node) => {
  const siteConfig = getConfig();

  const { themeVariables, handDrawnSeed } = siteConfig;
  const { altBackground, compositeBackground, compositeTitleBackground, nodeBorder } =
    themeVariables;

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', node.cssClasses)
    .attr('id', node.domId)
    .attr('data-id', node.id)
    .attr('data-look', node.look);

  // add the rect
  const outerRectG = shapeSvg.insert('g', ':first-child');

  // Create the label and insert it after the rect
  const label = shapeSvg.insert('g').attr('class', 'cluster-label');
  let innerRect = shapeSvg.append('rect');

  const text = await createLabel(label, node.label, node.labelStyle, undefined, true);

  // Get the size of the label
  let bbox = text.getBBox();

  if (getEffectiveHtmlLabels(siteConfig)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  // Rounded With Title
  const padding = 0 * node.padding;
  const halfPadding = padding / 2;

  const width =
    (node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width) + padding;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (width - node.width) / 2 - node.padding;
  } else {
    node.diff = -node.padding;
  }

  const height = node.height + padding;
  // const height = node.height + padding;
  const innerHeight = node.height + padding - bbox.height - 6;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  node.width = width;
  const innerY = node.y - node.height / 2 - halfPadding + bbox.height + 2;

  // add the rect
  let rect;
  if (node.look === 'handDrawn') {
    const isAlt = node.cssClasses.includes('statediagram-cluster-alt');
    const rc = rough.svg(shapeSvg);
    const roughOuterNode =
      node.rx || node.ry
        ? rc.path(createRoundedRectPathD(x, y, width, height, 10), {
            roughness: 0.7,
            fill: compositeTitleBackground,
            fillStyle: 'solid',
            stroke: nodeBorder,
            seed: handDrawnSeed,
          })
        : rc.rectangle(x, y, width, height, { seed: handDrawnSeed });

    rect = shapeSvg.insert(() => roughOuterNode, ':first-child');
    const roughInnerNode = rc.rectangle(x, innerY, width, innerHeight, {
      fill: isAlt ? altBackground : compositeBackground,
      fillStyle: isAlt ? 'hachure' : 'solid',
      stroke: nodeBorder,
      seed: handDrawnSeed,
    });

    rect = shapeSvg.insert(() => roughOuterNode, ':first-child');
    innerRect = shapeSvg.insert(() => roughInnerNode);
  } else {
    rect = outerRectG.insert('rect', ':first-child');
    const outerRectClass = 'outer';

    // center the rect around its coordinate
    rect
      .attr('class', outerRectClass)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('data-look', node.look);
    innerRect
      .attr('class', 'inner')
      .attr('x', x)
      .attr('y', innerY)
      .attr('width', width)
      .attr('height', innerHeight);
  }

  label.attr(
    'transform',
    `translate(${node.x - bbox.width / 2}, ${y + 1 - (getEffectiveHtmlLabels(siteConfig) ? 0 : 3)})`
  );

  const rectBox = rect.node().getBBox();
  node.height = rectBox.height;
  node.offsetX = 0;
  // Used by layout engine to position subgraph in parent
  node.offsetY = bbox.height - node.padding / 2;
  node.labelBBox = bbox;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};
const kanbanSection = async (parent, node) => {
  log.info('Creating subgraph rect for ', node.id, node);
  const siteConfig = getConfig();
  const { themeVariables, handDrawnSeed } = siteConfig;
  const { clusterBkg, clusterBorder } = themeVariables;

  const { labelStyles, nodeStyles, borderStyles, backgroundStyles } = styles2String(node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster ' + node.cssClasses)
    .attr('id', node.domId)
    .attr('data-look', node.look);

  const useHtmlLabels = getEffectiveHtmlLabels(siteConfig);

  // Create the label and insert it after the rect
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label ');

  const text = await createText(labelEl, node.label, {
    style: node.labelStyle,
    useHtmlLabels,
    isNode: true,
    width: node.width,
  });

  // Get the size of the label
  let bbox = text.getBBox();

  if (getEffectiveHtmlLabels(siteConfig)) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const width = node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (width - node.width) / 2 - node.padding;
  } else {
    node.diff = -node.padding;
  }

  const height = node.height;
  const x = node.x - width / 2;
  const y = node.y - height / 2;

  log.trace('Data ', node, JSON.stringify(node));
  let rect;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: clusterBkg,
      // fill: 'red',
      stroke: clusterBorder,
      fillWeight: 4,
      seed: handDrawnSeed,
    });
    const roughNode = rc.path(createRoundedRectPathD(x, y, width, height, node.rx), options);
    rect = shapeSvg.insert(() => {
      log.debug('Rough node insert CXC', roughNode);
      return roughNode;
    }, ':first-child');
    // Should we affect the options instead of doing this?
    rect.select('path:nth-child(2)').attr('style', borderStyles.join(';'));
    rect.select('path').attr('style', backgroundStyles.join(';').replace('fill', 'stroke'));
  } else {
    // add the rect
    rect = shapeSvg.insert('rect', ':first-child');
    // center the rect around its coordinate
    rect
      .attr('style', nodeStyles)
      .attr('rx', node.rx)
      .attr('ry', node.ry)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);
  }
  const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
  labelEl.attr(
    'transform',
    // This puts the label on top of the box instead of inside it
    `translate(${node.x - bbox.width / 2}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
  );

  if (labelStyles) {
    const span = labelEl.select('span');
    if (span) {
      span.attr('style', labelStyles);
    }
  }
  // Center the label

  const rectBox = rect.node().getBBox();
  node.offsetX = 0;
  node.width = rectBox.width;
  node.height = rectBox.height;
  // Used by layout engine to position subgraph in parent
  node.offsetY = bbox.height - node.padding / 2;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};
const divider = (parent, node) => {
  const siteConfig = getConfig();

  const { themeVariables, handDrawnSeed } = siteConfig;
  const { nodeBorder } = themeVariables;

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', node.cssClasses)
    .attr('id', node.domId)
    .attr('data-look', node.look);

  // add the rect
  const outerRectG = shapeSvg.insert('g', ':first-child');

  const padding = 0 * node.padding;

  const width = node.width + padding;

  node.diff = -node.padding;

  const height = node.height + padding;
  // const height = node.height + padding;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  node.width = width;

  // add the rect
  let rect;
  if (node.look === 'handDrawn') {
    const rc = rough.svg(shapeSvg);
    const roughOuterNode = rc.rectangle(x, y, width, height, {
      fill: 'lightgrey',
      roughness: 0.5,
      strokeLineDash: [5],
      stroke: nodeBorder,
      seed: handDrawnSeed,
    });

    rect = shapeSvg.insert(() => roughOuterNode, ':first-child');
  } else {
    rect = outerRectG.insert('rect', ':first-child');
    let outerRectClass = 'outer';
    if (node.look === 'neo') {
      outerRectClass = 'divider';
    } else {
      outerRectClass = 'divider';
    }

    // center the rect around its coordinate
    rect
      .attr('class', outerRectClass)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('data-look', node.look);
  }

  const rectBox = rect.node().getBBox();
  node.height = rectBox.height;
  node.offsetX = 0;
  // Used by layout engine to position subgraph in parent
  node.offsetY = 0;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: {} };
};

const taskGroup = async (parent, node) => {
  log.info('Creating task group for ', node.id, node);
  const siteConfig = getConfig();
  const { themeVariables, handDrawnSeed } = siteConfig;
  const { clusterBorder } = themeVariables;

  const { labelStyles, borderStyles } = styles2String(node);

  // Add outer g element
  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster task-cluster ' + node.cssClasses)
    .attr('id', node.id)
    .attr('data-look', node.look);

  const useHtmlLabels = getEffectiveHtmlLabels(siteConfig);

  // Create the label element
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label');

  // Only create label text if a non-empty label is provided
  let bbox = { width: 0, height: 0 };
  const hasLabel = node.label?.trim();
  if (hasLabel) {
    let text;
    if (node.labelType === 'markdown') {
      text = await createText(labelEl, node.label, {
        style: node.labelStyle,
        useHtmlLabels,
        isNode: true,
        width: node.width,
      });
    } else {
      text = await createLabel(labelEl, node.label, node.labelStyle || '', false, true);
    }

    bbox = text.getBBox();

    if (getEffectiveHtmlLabels(siteConfig)) {
      const div = text.children[0];
      const dv = select(text);
      bbox = div.getBoundingClientRect();
      dv.attr('width', bbox.width);
      dv.attr('height', bbox.height);
    }
  }

  const width = node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (width - node.width) / 2 - node.padding;
  } else {
    node.diff = -node.padding;
  }

  const height = node.height;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  const rx = 10;

  log.trace('Task group data ', node, JSON.stringify(node));
  let rect;
  if (node.look === 'handDrawn') {
    // @ts-ignore TODO: Fix rough typings
    const rc = rough.svg(shapeSvg);
    const options = userNodeOverrides(node, {
      roughness: 0.7,
      fill: 'transparent',
      stroke: clusterBorder,
      fillWeight: 0,
      seed: handDrawnSeed,
      strokeLineDash: [8, 4],
    });
    const roughNode = rc.path(createRoundedRectPathD(x, y, width, height, rx), options);
    rect = shapeSvg.insert(() => {
      log.debug('Rough task group insert', roughNode);
      return roughNode;
    }, ':first-child');
    rect.select('path:nth-child(2)').attr('style', borderStyles.join(';'));
  } else {
    // add the rect with rounded corners, dashed border, no fill
    rect = shapeSvg.insert('rect', ':first-child');
    rect
      .attr('rx', rx)
      .attr('ry', rx)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '8, 4');
  }

  // Position label top-center when present
  if (hasLabel) {
    const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
    labelEl.attr(
      'transform',
      `translate(${node.x - bbox.width / 2}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
    );

    if (labelStyles) {
      const span = labelEl.select('span');
      if (span) {
        span.attr('style', labelStyles);
      }
    }
  }

  const rectBox = rect.node().getBBox();
  node.offsetX = 0;
  node.width = rectBox.width;
  node.height = rectBox.height;
  // Used by layout engine to position subgraph in parent
  node.offsetY = bbox.height - node.padding / 2;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};

/**
 * Shared helper for agentflow container cluster shapes.
 * Renders a labeled rounded-rect cluster with configurable visual style.
 *
 * @param {object} opts
 * @param {string} opts.cssClass    - CSS class suffix (e.g. 'agent-cluster')
 * @param {number} opts.rx          - Corner radius
 * @param {string} opts.fill        - Fill color (or 'none'/'transparent')
 * @param {string} opts.stroke      - Stroke color
 * @param {number} opts.strokeWidth - Stroke width in px
 * @param {number[]} [opts.strokeDash] - Optional dash array for rough.js
 * @param {number} opts.roughness   - rough.js roughness
 * @param {string} [opts.fillStyle] - rough.js fill style (default: none)
 * @param {boolean} [opts.separatorLine] - Whether to draw a header separator line
 */
const createContainerGroup = async (parent, node, opts) => {
  log.info(`Creating ${opts.cssClass} for `, node.id, node);
  const siteConfig = getConfig();
  const { handDrawnSeed } = siteConfig;

  const { labelStyles, borderStyles } = styles2String(node);

  const shapeSvg = parent
    .insert('g')
    .attr('class', 'cluster ' + opts.cssClass + ' ' + node.cssClasses)
    .attr('id', node.id)
    .attr('data-look', node.look);

  const useHtmlLabels = getEffectiveHtmlLabels(siteConfig);
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label');

  let bbox = { width: 0, height: 0 };
  const hasLabel = node.label?.trim();
  if (hasLabel) {
    let text;
    if (node.labelType === 'markdown') {
      text = await createText(labelEl, node.label, {
        style: node.labelStyle,
        useHtmlLabels,
        isNode: true,
        width: node.width,
      });
    } else {
      text = await createLabel(labelEl, node.label, node.labelStyle || '', false, true);
    }
    bbox = text.getBBox();
    if (useHtmlLabels) {
      const div = text.children[0];
      const dv = select(text);
      bbox = div.getBoundingClientRect();
      dv.attr('width', bbox.width);
      dv.attr('height', bbox.height);
    }
  }

  const width = node.width <= bbox.width + node.padding ? bbox.width + node.padding : node.width;
  if (node.width <= bbox.width + node.padding) {
    node.diff = (width - node.width) / 2 - node.padding;
  } else {
    node.diff = -node.padding;
  }

  const height = node.height;
  const x = node.x - width / 2;
  const y = node.y - height / 2;

  let rectEl;
  if (node.look === 'handDrawn') {
    const rc = rough.svg(shapeSvg);
    const roughOpts = userNodeOverrides(node, {
      roughness: opts.roughness,
      fill: opts.fill,
      stroke: opts.stroke,
      strokeWidth: opts.strokeWidth,
      seed: handDrawnSeed,
      ...(opts.fillStyle ? { fillStyle: opts.fillStyle } : { fillWeight: 0 }),
      ...(opts.strokeDash ? { strokeLineDash: opts.strokeDash } : {}),
    });
    const roughNode = rc.path(createRoundedRectPathD(x, y, width, height, opts.rx), roughOpts);
    rectEl = shapeSvg.insert(() => roughNode, ':first-child');
    rectEl.select('path:nth-child(2)').attr('style', borderStyles.join(';'));

    // Draw separator line for agent header if requested
    if (opts.separatorLine && hasLabel) {
      const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
      const separatorY = node.y - node.height / 2 + subGraphTitleTopMargin + bbox.height + 4;
      const line = rc.line(x + 4, separatorY, x + width - 4, separatorY, {
        stroke: opts.stroke,
        strokeWidth: 0.75,
        roughness: 0.5,
        seed: handDrawnSeed,
      });
      shapeSvg.insert(() => line);
    }
  } else {
    rectEl = shapeSvg.insert('rect', ':first-child');
    rectEl
      .attr('rx', opts.rx)
      .attr('ry', opts.rx)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', opts.fill)
      .attr('stroke', opts.stroke)
      .attr('stroke-width', opts.strokeWidth + 'px');
    if (opts.strokeDash) {
      rectEl.attr('stroke-dasharray', opts.strokeDash.join(', '));
    }

    // Draw separator line for agent header if requested
    if (opts.separatorLine && hasLabel) {
      const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
      const separatorY = node.y - node.height / 2 + subGraphTitleTopMargin + bbox.height + 4;
      shapeSvg
        .insert('line')
        .attr('x1', x + 4)
        .attr('y1', separatorY)
        .attr('x2', x + width - 4)
        .attr('y2', separatorY)
        .attr('stroke', opts.stroke)
        .attr('stroke-width', '0.75px');
    }
  }

  if (hasLabel) {
    const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
    labelEl.attr(
      'transform',
      `translate(${node.x - bbox.width / 2}, ${node.y - node.height / 2 + subGraphTitleTopMargin})`
    );
    if (labelStyles) {
      const span = labelEl.select('span');
      if (span) {
        span.attr('style', labelStyles);
      }
    }
  }

  const rectBox = rectEl.node().getBBox();
  node.offsetX = 0;
  node.width = rectBox.width;
  node.height = rectBox.height;
  node.offsetY = bbox.height - node.padding / 2;

  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};

/** Agent group: top-level identity container. Filled, solid 1.5px, rx=14, header separator. */
const agentGroup = async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.agentContainerStroke || themeVariables.primaryBorderColor;
  const fill = themeVariables.agentContainerFill || themeVariables.primaryColor;
  return createContainerGroup(parent, node, {
    cssClass: 'agent-cluster',
    rx: 14,
    fill,
    stroke,
    strokeWidth: 1.5,
    roughness: 0.5,
    fillStyle: 'solid',
    separatorLine: true,
  });
};

/** Flow group: organizational grouping. Transparent, solid 0.75px, rx=10. */
const flowGroup = async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.flowContainerStroke || themeVariables.secondaryBorderColor;
  return createContainerGroup(parent, node, {
    cssClass: 'flow-cluster',
    rx: 10,
    fill: 'none',
    stroke,
    strokeWidth: 0.75,
    roughness: 0.7,
  });
};

/** Skill group: composed capability container. Pill-shaped (rx=20), filled, solid 1px. */
const skillGroup = async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.skillContainerStroke || themeVariables.primaryBorderColor;
  const fill = themeVariables.skillContainerFill || themeVariables.primaryColor;
  return createContainerGroup(parent, node, {
    cssClass: 'skill-cluster',
    rx: 20,
    fill,
    stroke,
    strokeWidth: 1,
    roughness: 0.5,
    fillStyle: 'solid',
  });
};

/** Test group: verification container. Thick solid 2px border, sharp corners (rx=0), no fill. */
const testGroup = async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.testContainerStroke || themeVariables.secondaryBorderColor;
  return createContainerGroup(parent, node, {
    cssClass: 'test-cluster',
    rx: 0,
    fill: 'none',
    stroke,
    strokeWidth: 2,
    roughness: 0.3,
  });
};

/** Directive group: behavioral constraint container. Dot-dash border, light fill, sharp corners. */
const directiveGroup = async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.directiveContainerStroke || themeVariables.tertiaryBorderColor;
  const fill = themeVariables.directiveContainerFill || themeVariables.tertiaryColor || '#f0f0f0';
  return createContainerGroup(parent, node, {
    cssClass: 'directive-cluster',
    rx: 2,
    fill,
    stroke,
    strokeWidth: 1.5,
    roughness: 0.7,
    strokeDash: [8, 3, 2, 3],
  });
};

/** Factory for declaration group clusters (types, templates). Light background, subtle dashed border. */
const createDeclarationGroup = (cssClass) => async (parent, node) => {
  const { themeVariables } = getConfig();
  const stroke = themeVariables.clusterBorder || themeVariables.secondaryBorderColor;
  const fill = themeVariables.tertiaryColor || '#f0f0f0';
  return createContainerGroup(parent, node, {
    cssClass,
    rx: 6,
    fill,
    stroke,
    strokeWidth: 0.75,
    roughness: 0.7,
    strokeDash: [4, 4],
  });
};

const typesGroup = createDeclarationGroup('types-cluster');
const templatesGroup = createDeclarationGroup('templates-cluster');
const connectorsGroup = createDeclarationGroup('connectors-cluster');

/** Group cluster: invisible container, purely for layout grouping. No fill, no stroke. */
const groupGroup = async (parent, node) => {
  return createContainerGroup(parent, node, {
    cssClass: 'group-cluster',
    rx: 0,
    fill: 'none',
    stroke: 'none',
    strokeWidth: 0,
    roughness: 0,
  });
};

export const getUsecaseSystemBoundaryGeometry = (node, labelBBox) => {
  const boundaryType = node.boundaryType || 'rect';
  const horizontalLabelPadding = boundaryType === 'package' ? 20 : node.padding;
  const tabHeight = boundaryType === 'package' ? labelBBox.height + 10 : 0;
  const width = Math.max(node.width, labelBBox.width + horizontalLabelPadding);
  const height =
    boundaryType === 'package' ? Math.max(node.height, tabHeight + node.padding * 2) : node.height;
  const x = node.x - width / 2;
  const y = node.y - height / 2;

  return {
    boundaryType,
    width,
    height,
    x,
    y,
    bodyY: y + tabHeight,
    bodyHeight: height - tabHeight,
    tabHeight,
    tabWidth: boundaryType === 'package' ? Math.min(width, Math.max(80, labelBBox.width + 20)) : 0,
  };
};

/**
 * Custom cluster shape for use-case system boundaries.
 * @param {any} parent
 * @param {any} node
 * @returns {any} ShapeSvg
 */
const usecaseSystemBoundary = async (parent, node) => {
  log.info('Creating usecase system boundary for ', node.id, node);
  const siteConfig = getConfig();
  const { themeVariables, handDrawnSeed } = siteConfig;
  const { clusterBkg, clusterBorder } = themeVariables;
  const { labelStyles, nodeStyles } = styles2String(node);
  const { stylesMap } = compileStyles(node);

  const boundaryType = node.boundaryType || 'rect';
  const shapeSvg = parent
    .insert('g')
    .attr(
      'class',
      `cluster usecase-system-boundary usecase-system-boundary-${boundaryType} ${node.cssClasses}`
    )
    .attr('id', typeof node.domId === 'string' ? node.domId : node.id)
    .attr('data-boundary-type', boundaryType)
    .attr('data-look', node.look);

  const useHtmlLabels = getEffectiveHtmlLabels(siteConfig);
  const labelEl = shapeSvg.insert('g').attr('class', 'cluster-label system-boundary-title');
  const text = await createText(labelEl, node.label, {
    style: labelStyles,
    useHtmlLabels,
    isNode: true,
  });

  let bbox = text.getBBox();
  if (useHtmlLabels) {
    const div = text.children[0];
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  const geometry = getUsecaseSystemBoundaryGeometry(node, bbox);
  const { width, height, x, y, bodyY, bodyHeight, tabHeight, tabWidth } = geometry;
  node.diff =
    node.width <= bbox.width + node.padding
      ? (width - node.width) / 2 - node.padding
      : -node.padding;

  const roughOptions = userNodeOverrides(node, {
    fill: stylesMap.get('fill') || clusterBkg,
    stroke: stylesMap.get('stroke') || clusterBorder,
    strokeWidth: stylesMap.get('stroke-width')?.replace('px', '') || 1,
    seed: handDrawnSeed,
  });

  if (node.look === 'handDrawn') {
    const rc = rough.svg(shapeSvg);
    const roughBody = rc.rectangle(x, bodyY, width, bodyHeight, roughOptions);
    shapeSvg.insert(() => roughBody, ':first-child').attr('class', 'boundary-body label-container');

    if (boundaryType === 'package') {
      const roughTab = rc.rectangle(x, y, tabWidth, tabHeight, roughOptions);
      shapeSvg
        .insert(() => roughTab, ':first-child')
        .attr('class', 'boundary-tab system-boundary-package-tab label-container');
    }
  } else {
    shapeSvg
      .insert('rect', ':first-child')
      .attr('class', 'boundary-body label-container')
      .attr('style', nodeStyles)
      .attr('x', x)
      .attr('y', bodyY)
      .attr('width', width)
      .attr('height', bodyHeight);

    if (boundaryType === 'package') {
      shapeSvg
        .insert('rect', ':first-child')
        .attr('class', 'boundary-tab system-boundary-package-tab label-container')
        .attr('style', nodeStyles)
        .attr('x', x)
        .attr('y', y)
        .attr('width', tabWidth)
        .attr('height', tabHeight);
    }
  }

  const { subGraphTitleTopMargin } = getSubGraphTitleMargins(siteConfig);
  if (boundaryType === 'package') {
    labelEl.attr(
      'transform',
      `translate(${x + (tabWidth - bbox.width) / 2}, ${y + (tabHeight - bbox.height) / 2})`
    );
  } else {
    labelEl.attr(
      'transform',
      `translate(${node.x - bbox.width / 2}, ${y + subGraphTitleTopMargin})`
    );
  }

  if (labelStyles) {
    labelEl.attr('style', labelStyles);
    labelEl.select('span').attr('style', labelStyles);
  }

  node.offsetX = 0;
  node.width = width;
  node.height = height;
  node.offsetY = bbox.height - node.padding / 2;
  node.labelBBox = bbox;
  node.intersect = function (point) {
    return intersectRect(node, point);
  };

  return { cluster: shapeSvg, labelBBox: bbox };
};

const squareRect = rect;
const shapes = {
  rect,
  squareRect,
  roundedWithTitle,
  noteGroup,
  divider,
  kanbanSection,
  taskGroup,
  agentGroup,
  flowGroup,
  skillGroup,
  testGroup,
  directiveGroup,
  groupGroup,
  typesGroup,
  templatesGroup,
  connectorsGroup,
  usecaseSystemBoundary,
  swimlane,
};

let clusterElems = new Map();

/**
 * @typedef {keyof typeof shapes} ClusterShapeID
 */

/**
 * @param {import('../types.js').ClusterNode} node - Shape defaults to 'rect'
 */
export const insertCluster = async (elem, node) => {
  const shape = node.shape || 'rect';
  const cluster = await shapes[shape](elem, node);
  clusterElems.set(node.id, cluster);
  return cluster;
};

export const getClusterTitleWidth = (elem, node) => {
  // TODO: Doesn't this need an `await`?
  const label = createLabel(elem, node.label, node.labelStyle, undefined, true);
  const width = label.getBBox().width;
  elem.node().removeChild(label);
  return width;
};

export const clear = () => {
  clusterElems = new Map();
};

export const positionCluster = (node) => {
  log.info(
    'Position cluster (' +
      node.id +
      ', ' +
      node.x +
      ', ' +
      node.y +
      ') (' +
      node?.width +
      ', ' +
      node?.height +
      ')',
    clusterElems.get(node.id)
  );
  const el = clusterElems.get(node.id);
  el.cluster.attr('transform', 'translate(' + node.x + ', ' + node.y + ')');
};
