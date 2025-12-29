import { getNodeClasses, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '../../types.js';
import { styles2String, userNodeOverridesNewGen } from './handDrawnShapeStyles.js';
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
import { type RoughSVG } from 'roughjs/bin/svg.js';
import { concatenateStyles, fillToStroke } from '../../stylesUtil.js';

export async function erBox<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  // Treat node as entityNode for certain entityNode checks
  const entityNode = node as unknown as EntityNode;
  if (entityNode.alias) {
    node.label = entityNode.alias;
  }

  const config = getConfig();
  node.useHtmlLabels = config.htmlLabels;
  let PADDING = config.er?.diagramPadding ?? 10;
  let TEXT_PADDING = config.er?.entityPadding ?? 6;

  const { labelStyles, nodeStyles, backgroundStyles, borderStyles } = styles2String(node);

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
  const rows = [];
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

    const rowHeight =
      Math.max(typeBBox.height, nameBBox.height, keysBBox.height, commentBBox.height) +
      TEXT_PADDING;
    rows.push({ yOffset, rowHeight });
    yOffset += rowHeight;
  }
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
  const options = userNodeOverridesNewGen(node, {});

  let totalShapeBBoxHeight = 0;
  if (rows.length > 0) {
    totalShapeBBoxHeight = rows.reduce((sum, row) => sum + (row?.rowHeight ?? 0), 0);
  }
  const w = Math.max(shapeBBox.width + PADDING * 2, node?.width || 0, maxWidth);
  const h = Math.max((totalShapeBBoxHeight ?? 0) + nameBBox.height, node?.height || 0);
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
  const rect =
    node.look === 'handDrawn'
      ? drawRoughShape(shapeSvg, rc, x, y, w, h, options, borderStyles)
      : drawClassicShape(shapeSvg, x, y, w, h, borderStyles);

  // Draw header
  if (node.look === 'handDrawn') {
    drawRoughHeader(shapeSvg, rc, x, y, w, nameBBox.height, options, backgroundStyles);
  } else {
    drawClassicHeader(shapeSvg, x, y, w, nameBBox.height, nodeStyles);
  }

  // Draw rows
  for (const [index, row] of rows.entries()) {
    const indexSkippingHeader = index + 1;
    const isEven = indexSkippingHeader % 2 === 0; // TODO: always true ?  && row.yOffset !== 0;
    const rowY = nameBBox.height + y + row?.yOffset;
    const rowH = row?.rowHeight;
    const rowClass = `rect row-${isEven ? 'even' : 'odd'}`;
    const rowBackgroundStyles = isEven ? backgroundStyles : [];
    if (node.look === 'handDrawn') {
      drawRoughRow(shapeSvg, rc, x, rowY, w, rowH, options, rowClass, rowBackgroundStyles);
    } else {
      drawClassicRow(shapeSvg, x, rowY, w, rowH, rowClass, rowBackgroundStyles, ['stroke:none']);
    }
  }

  //===========================
  // = Draw vertical dividers =
  //===========================
  const verticalDivsY1 = nameBBox.height + y;
  const verticalDivsY2 = h + y;

  // Draw first vertical divider line
  const firstDivX = maxTypeWidth + x;
  if (node.look === 'handDrawn') {
    drawRoughDivider(
      shapeSvg,
      rc,
      firstDivX,
      verticalDivsY1,
      firstDivX,
      verticalDivsY2,
      options,
      borderStyles
    );
  } else {
    drawClassicDivider(
      shapeSvg,
      firstDivX,
      verticalDivsY1,
      firstDivX,
      verticalDivsY2,
      borderStyles
    );
  }

  // Draw second vertical divider line
  if (keysPresent) {
    const secondDivX = maxTypeWidth + maxNameWidth + x;
    if (node.look === 'handDrawn') {
      drawRoughDivider(
        shapeSvg,
        rc,
        secondDivX,
        verticalDivsY1,
        secondDivX,
        verticalDivsY2,
        options,
        borderStyles
      );
    } else {
      drawClassicDivider(
        shapeSvg,
        secondDivX,
        verticalDivsY1,
        secondDivX,
        verticalDivsY2,
        borderStyles
      );
    }
  }

  // Draw third vertical divider line
  if (commentPresent) {
    const thirdDivX = maxTypeWidth + maxNameWidth + maxKeysWidth + x;
    if (node.look === 'handDrawn') {
      drawRoughDivider(
        shapeSvg,
        rc,
        thirdDivX,
        verticalDivsY1,
        thirdDivX,
        verticalDivsY2,
        options,
        borderStyles
      );
    } else {
      drawClassicDivider(
        shapeSvg,
        thirdDivX,
        verticalDivsY1,
        thirdDivX,
        verticalDivsY2,
        borderStyles
      );
    }
  }

  const horizontalDivsX1 = x;
  const horizontalDivsX2 = w + x;
  for (const [, row] of rows.entries()) {
    const horizontalDivY = nameBBox.height + y + row.yOffset;
    if (node.look === 'handDrawn') {
      drawRoughDivider(
        shapeSvg,
        rc,
        horizontalDivsX1,
        horizontalDivY,
        horizontalDivsX2,
        horizontalDivY,
        options,
        borderStyles
      );
    } else {
      drawClassicDivider(
        shapeSvg,
        horizontalDivsX1,
        horizontalDivY,
        horizontalDivsX2,
        horizontalDivY,
        borderStyles
      );
    }
  }

  updateNodeBounds(node, rect);

  if (nodeStyles && node.look !== 'handDrawn') {
    const allStyle = nodeStyles.split(';');
    const strokeStyles = allStyle
      ?.filter((e) => {
        return e.includes('stroke');
      })
      ?.map((s) => `${s}`)
      .join('; ');
    shapeSvg.selectAll('path').attr('style', strokeStyles ?? '');
    shapeSvg.selectAll('.rect.row-even path').attr('style', nodeStyles);
  }

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };
  return shapeSvg;
}

function drawRoughShape(
  shapeSvg: D3Selection<SVGGElement>,
  rc: RoughSVG,
  x: number,
  y: number,
  w: number,
  h: number,
  options: any,
  borderStyles: string[]
): D3Selection<SVGGElement> {
  const roughShape = shapeSvg
    .insert(() => rc.rectangle(x, y, w, h, options), ':first-child')
    .attr('class', 'rect shape')
    .attr('fill', 'none');

  roughShape.select('path').remove(); // Useless, only the stroke matters
  roughShape
    .select('path')
    .attr('fill', null) // Set by CSS or style
    .attr('stroke', null) // Set by CSS or style
    .attr('style', concatenateStyles(borderStyles));

  return roughShape;
}

function drawClassicShape(
  shapeSvg: D3Selection<SVGGElement>,
  x: number,
  y: number,
  w: number,
  h: number,
  borderStyles: string[]
) {
  return shapeSvg
    .insert('rect', ':first-child')
    .attr('class', 'rect shape')
    .attr('fill', null)
    .attr('style', concatenateStyles(borderStyles))
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h);
}

function drawRoughHeader(
  shapeSvg: D3Selection<SVGGElement>,
  rc: RoughSVG,
  x: number,
  y: number,
  w: number,
  h: number,
  options: any,
  backgroundStyles: string[]
) {
  shapeSvg // Hachures + cover for edges
    .insert<'rect'>('rect', '.shape')
    .attr('class', `rect row-header-background`)
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h);

  const roughRect = shapeSvg
    .insert(() => rc.rectangle(x, y, w, h, options), '.shape')
    .attr('class', 'rect row-header');

  roughRect
    .select('path')
    .attr('fill', null) // Set by CSS or style
    .attr('stroke', null) // Set by CSS or style
    .attr('style', fillToStroke(backgroundStyles));

  roughRect.select('path:nth-of-type(2)').remove();
}

function drawClassicHeader(
  shapeSvg: D3Selection<SVGGElement>,
  x: number,
  y: number,
  w: number,
  h: number,
  nodeStyles: string
) {
  return shapeSvg
    .insert('rect', '.shape')
    .attr('class', 'rect row-header')
    .attr('style', nodeStyles)
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h);
}

function drawRoughRow(
  shapeSvg: D3Selection<SVGGElement>,
  rc: RoughSVG,
  x: number,
  y: number,
  w: number,
  h: number,
  options: any,
  cssClass: string,
  backgroundStyles: string[]
) {
  shapeSvg // Hachures + cover for edges
    .insert<'rect'>('rect', '.shape')
    .attr('class', `${cssClass}-background`)
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h);

  const roughRect = shapeSvg
    .insert(() => rc.rectangle(x, y, w, h, options), '.shape')
    .attr('class', cssClass);

  roughRect
    .select('path')
    .attr('fill', null) // Set by CSS or style
    .attr('stroke', null) // Set by CSS or style
    .attr('style', fillToStroke(backgroundStyles));

  roughRect.select('path:nth-of-type(2)').remove();
}

function drawClassicRow(
  shapeSvg: D3Selection<SVGGElement>,
  x: number,
  y: number,
  w: number,
  h: number,
  cssClass: string,
  backgroundStyles: string[],
  borderStyles: string[]
) {
  shapeSvg
    .insert<'rect'>('rect', '.shape')
    .attr('class', cssClass)
    .attr('style', concatenateStyles([...backgroundStyles, ...borderStyles]))
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h);
}

function drawRoughDivider(
  shapeSvg: D3Selection<SVGGElement>,
  rc: RoughSVG,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: any,
  cssStyles: string[]
) {
  const roughDivider = shapeSvg
    .insert(() => rc.line(x1, y1, x2, y2, options))
    .attr('class', 'divider');

  roughDivider
    .select('path')
    .attr('fill', null) // Set by CSS or style
    .attr('stroke', null) // Set by CSS or style
    .attr('style', concatenateStyles(cssStyles));
}

function drawClassicDivider(
  shapeSvg: D3Selection<SVGGElement>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cssStyles: string[]
) {
  shapeSvg
    .insert('line')
    .attr('class', 'divider')
    .attr('style', concatenateStyles(cssStyles))
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2);
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
