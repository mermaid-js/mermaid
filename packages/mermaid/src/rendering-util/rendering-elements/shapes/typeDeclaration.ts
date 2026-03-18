import { getConfig, sanitizeText } from '../../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../../config.js';
import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { getNodeClasses, updateNodeBounds } from './util.js';
import intersect from '../intersect/index.js';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import { createRoundedRectPathD } from './roundedRectPath.js';
import rough from 'roughjs';
import { calculateTextWidth, decodeEntities } from '../../../utils.js';
import { createText } from '../../createText.js';
import { select } from 'd3';
import type { Bounds, Point } from '../../../types.js';
import type { AgentFlowTypeDeclaration } from '../../../diagrams/agentflow/types.js';

const PADDING = 10;
const LINE_HEIGHT_EXTRA = 6;

/**
 * Renders a single text section and returns its height.
 * Adapted from requirementBox's addText pattern.
 */
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
  const useHtmlLabels = getEffectiveHtmlLabels(config);

  const text = await createText(
    textEl,
    sanitizeText(decodeEntities(inputText)),
    {
      width: calculateTextWidth(inputText, config) + 50,
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
      if (style) {
        child.setAttribute('style', style);
      }
    }
    bbox = text.getBBox();
    bbox.height += LINE_HEIGHT_EXTRA;
  } else {
    const div = text.children[0] as HTMLDivElement;
    const dv = select(text);
    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  textEl.attr('transform', `translate(${-bbox.width / 2},${-bbox.height / 2 + yOffset})`);
  return bbox.height;
}

/**
 * Type declaration shape for agentflow diagrams.
 *
 * Renders a structured box:
 *   ┌──────────────────┐
 *   │  «record»         │  (kind badge)
 *   │  CoffeeCopy       │  (type name, bold)
 *   ├──────────────────┤
 *   │ hero_tagline: String   │  (fields)
 *   │ hero_subtitle: String  │
 *   │ about: String          │
 *   └──────────────────┘
 */
export async function typeDeclaration<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const { nodeStyles } = styles2String(node);
  const classes = getNodeClasses(node);

  const typeData = node.metadata?.typeDeclaration as AgentFlowTypeDeclaration | undefined;

  const shapeSvg = parent
    .insert('g')
    .attr('class', classes)
    .attr('id', node.domId ?? node.id);

  // -- Render text sections, measuring as we go --
  let accHeight = PADDING;
  let maxWidth = 0;

  // Kind badge: «record», «alias», or «type»
  const kindLabel =
    typeData?.kind === 'record' ? 'record' : typeData?.kind === 'alias' ? 'alias' : 'type';
  const kindHeight = await addText(
    shapeSvg,
    `«${kindLabel}»`,
    accHeight,
    node.labelStyle + '; font-style: italic; opacity: 0.7;'
  );
  accHeight += kindHeight;

  // Type name (bold)
  const typeName = typeData?.name ?? node.label ?? '';
  const nameHeight = await addText(
    shapeSvg,
    typeName,
    accHeight,
    node.labelStyle + '; font-weight: bold;'
  );
  accHeight += nameHeight;

  // Add padding below the name before the separator
  accHeight += PADDING / 2;
  const headerHeight = accHeight;

  // Fields (for record types)
  let fieldsHeight = 0;
  if (typeData?.kind === 'record' && typeData.fields.length > 0) {
    accHeight += PADDING * 1.5; // gap after separator before fields
    for (const field of typeData.fields) {
      const fieldText = `${field.name}: ${field.type}`;
      const fh = await addText(shapeSvg, fieldText, accHeight, node.labelStyle);
      accHeight += fh;
      fieldsHeight += fh;
    }
  } else if (typeData?.kind === 'alias') {
    accHeight += PADDING * 1.5;
    const exprHeight = await addText(
      shapeSvg,
      `= ${(typeData as { expression: string }).expression}`,
      accHeight,
      node.labelStyle + '; opacity: 0.7;'
    );
    accHeight += exprHeight;
    fieldsHeight += exprHeight;
  }

  accHeight += PADDING; // bottom padding

  // Measure all text widths
  shapeSvg.selectAll('.label').each(function () {
    const bbox = (this as SVGGraphicsElement).getBBox();
    if (bbox.width > maxWidth) {
      maxWidth = bbox.width;
    }
  });

  const totalWidth = maxWidth + PADDING * 2;
  const totalHeight = accHeight;
  const x = -totalWidth / 2;
  const y = -totalHeight / 2;

  // Re-center all text labels horizontally now that we know totalWidth
  shapeSvg.selectAll<SVGGraphicsElement, unknown>('.label').each(function () {
    const el = select(this);
    const currentTransform = el.attr('transform') || '';
    const match = /translate\(([^,]+),([^)]+)\)/.exec(currentTransform);
    if (match) {
      const currentY = parseFloat(match[2]);
      const bbox = this.getBBox();
      el.attr('transform', `translate(${-bbox.width / 2},${currentY + y})`);
    }
  });

  // -- Draw background rect --
  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});
  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const roughNode = rc.path(createRoundedRectPathD(x, y, totalWidth, totalHeight, 4), options);
  const rect = shapeSvg.insert(() => roughNode, ':first-child');
  rect.attr('class', 'basic label-container type-declaration-box').attr('style', nodeStyles);

  // -- Separator line between header and fields --
  if (fieldsHeight > 0) {
    const sepY = y + headerHeight - PADDING / 4;
    const roughLine = rc.line(x, sepY, x + totalWidth, sepY, options);
    const dividerLine = shapeSvg.insert(() => roughLine);
    dividerLine.attr('class', 'type-declaration-separator').attr('style', nodeStyles);
  }

  updateNodeBounds(node, rect);

  node.calcIntersect = function (bounds: Bounds, point: Point) {
    return intersect.rect(bounds, point);
  };

  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
