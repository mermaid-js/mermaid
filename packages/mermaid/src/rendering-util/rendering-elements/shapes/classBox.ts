import { updateNodeBounds } from './util.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { select } from 'd3';
import type { Node } from '../../types.js';
import type { ClassNode } from '../../../diagrams/class/classTypes.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import intersect from '../intersect/index.js';
import { textHelper } from '../../../diagrams/class/shapeUtil.js';
import { evaluate } from '../../../diagrams/common/common.js';
import type { D3Selection } from '../../../types.js';

export async function classBox<T extends SVGGraphicsElement>(parent: D3Selection<T>, node: Node) {
  const config = getConfig();
  const PADDING = config.class!.padding ?? 12;
  const GAP = PADDING;
  const useHtmlLabels = node.useHtmlLabels ?? evaluate(config.htmlLabels) ?? true;

  // Treat node as classNode
  const classNode = node as unknown as ClassNode;
  classNode.annotations = classNode.annotations ?? [];
  classNode.members = classNode.members ?? [];
  classNode.methods = classNode.methods ?? [];

  const { shapeSvg, bbox } = await textHelper(parent, node, config, useHtmlLabels, GAP);

  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;

  node.cssStyles = classNode.styles || '';

  const styles = classNode.styles?.join(';') || nodeStyles || '';

  if (!node.cssStyles) {
    node.cssStyles = styles.replaceAll('!important', '').split(';');
  }

  const renderExtraBox =
    classNode.members.length === 0 &&
    classNode.methods.length === 0 &&
    !config.class?.hideEmptyMembersBox;

  // Setup roughjs
  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const w = Math.max(node.width ?? 0, bbox.width);
  let h = Math.max(node.height ?? 0, bbox.height);
  const nodeHeightGreater = (node.height ?? 0) > bbox.height;
  if (classNode.members.length === 0 && classNode.methods.length === 0) {
    h += GAP;
  } else if (classNode.members.length > 0 && classNode.methods.length === 0) {
    h += GAP * 2;
  }

  const x = -w / 2;
  const y = -h / 2;
  let extraHeight = renderExtraBox
    ? PADDING * 2
    : classNode.members.length === 0 && classNode.methods.length === 0
      ? -PADDING
      : 0;
  if (nodeHeightGreater) {
    extraHeight = PADDING * 2;
  }

  // Create and center rectangle
  const roughRect = rc.rectangle(
    x - PADDING,
    y -
      PADDING -
      (renderExtraBox
        ? PADDING
        : classNode.members.length === 0 && classNode.methods.length === 0
          ? -PADDING / 2
          : 0),
    w + 2 * PADDING,
    h + 2 * PADDING + extraHeight,
    options
  );

  const rect = shapeSvg.insert(() => roughRect, ':first-child');
  rect.attr('class', 'basic label-container');
  const rectBBox = rect.node()!.getBBox();

  // Rect is centered so now adjust labels.
  const annotationGroupHeight =
    (shapeSvg.select('.annotation-group').node() as SVGGraphicsElement).getBBox().height -
      (renderExtraBox ? PADDING / 2 : 0) || 0;
  const labelGroupHeight =
    (shapeSvg.select('.label-group').node() as SVGGraphicsElement).getBBox().height -
      (renderExtraBox ? PADDING / 2 : 0) || 0;
  const membersGroupHeight =
    (shapeSvg.select('.members-group').node() as SVGGraphicsElement).getBBox().height -
      (renderExtraBox ? PADDING / 2 : 0) || 0;

  // Y value in the middle of the first line and remaining space.
  const methodsAreaPlacement =
    (annotationGroupHeight +
      labelGroupHeight +
      y +
      PADDING -
      (y -
        PADDING -
        (renderExtraBox
          ? PADDING
          : classNode.members.length === 0 && classNode.methods.length === 0
            ? -PADDING / 2
            : 0))) /
    2;

  // TODO: Fix types
  shapeSvg.selectAll('.text').each((_: any, i: number, nodes: any) => {
    const text = select<any, unknown>(nodes[i]);
    // Get the current transform attribute
    const transform = text.attr('transform');
    // Initialize variables for the translation values
    let translateY = 0;
    // Check if the transform attribute exists
    if (transform) {
      const regex = RegExp(/translate\(([^,]+),([^)]+)\)/);
      const translate = regex.exec(transform);
      if (translate) {
        translateY = parseFloat(translate[2]);
      }
    }
    // Add to the y value
    let newTranslateY =
      translateY +
      y +
      PADDING -
      (renderExtraBox
        ? PADDING
        : classNode.members.length === 0 && classNode.methods.length === 0
          ? -PADDING / 2
          : 0);
    if (text.attr('class').includes('methods-group')) {
      if (nodeHeightGreater) {
        newTranslateY =
          Math.max(
            methodsAreaPlacement,
            annotationGroupHeight + labelGroupHeight + membersGroupHeight + y + GAP * 2 + PADDING
          ) +
          GAP * 2;
      } else {
        newTranslateY =
          annotationGroupHeight + labelGroupHeight + membersGroupHeight + y + GAP * 4 + PADDING;
      }
    }
    if (
      classNode.members.length === 0 &&
      classNode.methods.length === 0 &&
      config.class?.hideEmptyMembersBox
    ) {
      if (classNode.annotations.length > 0) {
        newTranslateY = translateY - GAP;
      } else {
        newTranslateY = translateY;
      }
    }
    if (!useHtmlLabels) {
      // Fix so non html labels are better centered.
      // BBox of text seems to be slightly different when calculated so we offset
      newTranslateY -= 4;
    }
    let newTranslateX = x;
    if (
      text.attr('class').includes('label-group') ||
      text.attr('class').includes('annotation-group')
    ) {
      newTranslateX = -text.node()?.getBBox().width / 2 || 0;
      shapeSvg.selectAll('text').each(function (_: any, i: number, nodes: any) {
        if (window.getComputedStyle(nodes[i]).textAnchor === 'middle') {
          newTranslateX = 0;
        }
      });
    }
    // Set the updated transform attribute
    text.attr('transform', `translate(${newTranslateX}, ${newTranslateY})`);
  });

  // Render divider lines.
  // Line y-values are offset by 0.001 so gradient stroke can apply.
  // If y-values are the same then the height of the bounding box is zero and it doesn't work.
  // First line (under label)
  if (classNode.members.length > 0 || classNode.methods.length > 0 || renderExtraBox) {
    const firstLineY = annotationGroupHeight + labelGroupHeight + y + PADDING;
    const roughLine = rc.line(
      rectBBox.x,
      firstLineY,
      rectBBox.x + rectBBox.width,
      firstLineY + 0.001,
      options
    );
    const line = shapeSvg.insert(() => roughLine);
    line.attr('class', 'divider').attr('style', styles);
  }

  // Second line (under members)
  if (renderExtraBox || classNode.members.length > 0 || classNode.methods.length > 0) {
    const secondLineY =
      annotationGroupHeight + labelGroupHeight + membersGroupHeight + y + GAP * 2 + PADDING;
    const roughLine = rc.line(
      rectBBox.x,
      nodeHeightGreater ? Math.max(methodsAreaPlacement, secondLineY) : secondLineY,
      rectBBox.x + rectBBox.width,
      (nodeHeightGreater ? Math.max(methodsAreaPlacement, secondLineY) : secondLineY) + 0.001,
      options
    );
    const line = shapeSvg.insert(() => roughLine);
    line.attr('class', 'divider').attr('style', styles);
  }

  /// Apply styles ///
  if (classNode.look !== 'handDrawn') {
    shapeSvg.selectAll('path').attr('style', styles);
  }
  // Apply other styles like stroke-width and stroke-dasharray to border (not background of shape)
  rect.select(':nth-child(2)').attr('style', styles);
  // Divider lines
  shapeSvg.selectAll('.divider').select('path').attr('style', styles);
  // Text elements
  if (node.labelStyle) {
    shapeSvg.selectAll('span').attr('style', node.labelStyle);
  } else {
    shapeSvg.selectAll('span').attr('style', styles);
  }
  // SVG text uses fill not color
  if (!useHtmlLabels) {
    // We just want to apply color to the text
    const colorRegex = RegExp(/color\s*:\s*([^;]*)/);
    const match = colorRegex.exec(styles);
    if (match) {
      const colorStyle = match[0].replace('color', 'fill');
      shapeSvg.selectAll('tspan').attr('style', colorStyle);
    } else if (labelStyles) {
      const match = colorRegex.exec(labelStyles);
      if (match) {
        const colorStyle = match[0].replace('color', 'fill');
        shapeSvg.selectAll('tspan').attr('style', colorStyle);
      }
    }
  }

  updateNodeBounds(node, rect);
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
}
