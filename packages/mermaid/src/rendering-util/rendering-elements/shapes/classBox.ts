import { getNodeClasses, updateNodeBounds } from './util.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { createText } from '../../createText.js';
import { select } from 'd3';
import type { Node } from '../../types.js';
import { calculateTextHeight, calculateTextWidth } from '../../../utils.js';
import type { ClassMember, ClassNode } from '../../../diagrams/class/classTypes.js';
import rough from 'roughjs';
import { styles2String, userNodeOverrides } from './handDrawnShapeStyles.js';
import intersect from '../intersect/index.js';

const config = getConfig();
const PADDING = config.class!.padding ?? 10;
const GAP = PADDING;

export const classBox = async (parent: SVGAElement, node: Node): Promise<SVGAElement> => {
  const useHtmlLabels = config.class?.htmlLabels ?? config.htmlLabels ?? true;

  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { cssStyles } = node;

  const classNode = node as unknown as ClassNode;
  node.cssStyles = classNode.styles;
  if (!classNode.annotations) {
    classNode.annotations = [];
  }
  if (!classNode.members) {
    classNode.members = [];
  }
  if (!classNode.methods) {
    classNode.methods = [];
  }

  const styles = classNode.styles ? classNode.styles.join(';') : '';

  const { shapeSvg, bbox } = await textHelper(parent, node);

  const renderExtraBox =
    classNode.members.length === 0 &&
    classNode.methods.length === 0 &&
    !config.class?.hideEmptyMembersBox;

  // @ts-ignore TODO: Fix rough typings
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const w = bbox.width;
  const h = bbox.height;
  const x = -w / 2;
  const y = -h / 2;

  const roughRect = rc.rectangle(
    x - PADDING,
    y - PADDING - (renderExtraBox ? PADDING : 0),
    w + 2 * PADDING,
    h + 2 * PADDING + (renderExtraBox ? PADDING * 2 : 0),
    options
  );

  const rect = shapeSvg.insert(() => roughRect, ':first-child');
  rect
    .attr('class', 'basic label-container')
    .attr('style', styles)
    .attr('style', cssStyles)
    .attr('style', nodeStyles);
  const rectBBox = rect.node().getBBox();

  // Rect is centered so now adjust labels.
  // TODO: Fix types
  shapeSvg.selectAll('.text').each((_: any, i: number, nodes: any) => {
    const text = select<any, unknown>(nodes[i]);

    // Get the current transform attribute
    const transform = text.attr('transform');

    // Initialize variables for the translation values
    let translateY = 0;

    // Check if the transform attribute exists
    if (transform) {
      // Extract the translate values using a regex
      const regex = RegExp(/translate\(([^,]+),([^)]+)\)/);
      const translate = regex.exec(transform);

      if (translate) {
        translateY = parseFloat(translate[2]);
      }
    }

    // Add to the y value
    const newTranslateY = translateY + y + PADDING - (renderExtraBox ? PADDING : 0);
    let newTranslateX = x;

    if (text.attr('class').includes('label') || text.attr('class').includes('annotation')) {
      newTranslateX = -text.node()?.getBBox().width / 2 || 0;
    }

    // Set the updated transform attribute
    text.attr('transform', `translate(${newTranslateX},${newTranslateY})`);
  });

  // Render divider lines.
  const annotationGroupHeight =
    shapeSvg.select('.annotation-group').node().getBBox().height -
      (renderExtraBox ? PADDING / 2 : 0) || 0;
  const labelGroupHeight =
    shapeSvg.select('.label-group').node().getBBox().height - (renderExtraBox ? PADDING / 2 : 0) ||
    0;
  const membersGroupHeight =
    shapeSvg.select('.members-group').node().getBBox().height -
      (renderExtraBox ? PADDING / 2 : 0) || 0;
  if (
    classNode.label &&
    (classNode.members.length > 0 || classNode.methods.length > 0 || renderExtraBox)
  ) {
    const roughLine = rc.line(
      rectBBox.x,
      annotationGroupHeight + labelGroupHeight + y + PADDING,
      rectBBox.x + rectBBox.width,
      annotationGroupHeight + labelGroupHeight + y + PADDING,
      options
    );
    const line = shapeSvg.insert(() => roughLine);
    line
      .attr('class', 'divider', 'style', styles)
      .attr('style', cssStyles)
      .attr('style', nodeStyles);
  }

  if (classNode.members.length > 0 && classNode.methods.length > 0) {
    const roughLine = rc.line(
      rectBBox.x,
      annotationGroupHeight + labelGroupHeight + membersGroupHeight + y + GAP * 2 + PADDING,
      rectBBox.x + rectBBox.width,
      annotationGroupHeight + labelGroupHeight + membersGroupHeight + y + PADDING + GAP * 2,
      options
    );
    const line = shapeSvg.insert(() => roughLine);
    line
      .attr('class', 'divider', 'style', styles)
      .attr('style', cssStyles)
      .attr('style', nodeStyles);
  }

  if (classNode.look !== 'handDrawn') {
    if (cssStyles) {
      shapeSvg.selectAll('path').attr('style', cssStyles);
    }
    if (nodeStyles) {
      shapeSvg.selectAll('path').attr('style', nodeStyles);
    }
    if (styles) {
      shapeSvg.selectAll('path').attr('style', styles);
    }
  }

  // // Ignore background stroke
  shapeSvg.select(':nth-child(2)').attr('style', styles);

  // Divider lines
  shapeSvg.selectAll('.divider').select('path').attr('style', styles);

  // Text elements
  shapeSvg.selectAll('span').attr('style', styles);
  // SVG text uses fill, stroke, and stroke-width
  if (!useHtmlLabels) {
    // We just want to apply color to the text
    const colorRegex = RegExp(/color\s*:\s*([^;]*)/);

    const match = colorRegex.exec(styles);
    if (match) {
      const colorStyle = match[0].replace('color', 'fill');
      shapeSvg.selectAll('tspan').attr('style', colorStyle);
    }
  }

  updateNodeBounds(node, rect);
  node.intersect = function (point) {
    return intersect.rect(node, point);
  };

  return shapeSvg;
};

const textHelper = async (parent: SVGAElement, node: any) => {
  const shapeSvg = parent
    // @ts-ignore: Ignore error for using .insert on SVGAElement
    .insert('g')
    .attr('class', getNodeClasses(node))
    .attr('id', node.domId || node.id);

  const TEXT_PADDING = 6;

  let annotationGroup = null;
  let labelGroup = null;
  let membersGroup = null;
  let methodsGroup = null;

  let annotationGroupHeight = 0;
  let labelGroupHeight = 0;
  let membersGroupHeight = 0;

  annotationGroup = shapeSvg.insert('g').attr('class', 'annotation-group text');
  if (node.annotations && node.annotations.length > 0) {
    const annotation = node.annotations[0];
    await addText(annotationGroup, { text: `«${annotation}»` } as unknown as ClassMember, 0);

    const annotationGroupBBox = annotationGroup.node().getBBox();
    annotationGroupHeight = annotationGroupBBox.height;
  }

  labelGroup = shapeSvg.insert('g').attr('class', 'label-group text');
  await addText(labelGroup, node, 0, ['font-weight: bolder;']);
  const labelGroupBBox = labelGroup.node().getBBox();
  labelGroupHeight = labelGroupBBox.height;

  membersGroup = shapeSvg.insert('g').attr('class', 'members-group text');
  let yOffset = 0;
  if (node.members) {
    for (const member of node.members) {
      await addText(membersGroup, member, yOffset, [member.parseClassifier()]);
      yOffset += calculateTextHeight(member.text, config) + TEXT_PADDING;
    }
    membersGroupHeight = membersGroup.node().getBBox().height;
  }

  methodsGroup = shapeSvg.insert('g').attr('class', 'methods-group text');
  let methodsYOffset = 0;
  for (const method of node.methods) {
    await addText(methodsGroup, method, methodsYOffset, [method.parseClassifier()]);
    methodsYOffset += calculateTextHeight(method.text, config) + TEXT_PADDING;
  }

  let bbox = shapeSvg.node().getBBox();

  // Center annotation
  if (annotationGroup !== null) {
    const annotationGroupBBox = annotationGroup.node().getBBox();
    annotationGroup.attr('transform', `translate(${-annotationGroupBBox.width / 2})`);
  }

  // Adjust label
  labelGroup.attr('transform', `translate(${-labelGroupBBox.width / 2}, ${annotationGroupHeight})`);

  bbox = shapeSvg.node().getBBox();

  membersGroup.attr(
    'transform',
    `translate(${0}, ${annotationGroupHeight + labelGroupHeight + GAP * 2})`
  );
  bbox = shapeSvg.node().getBBox();
  methodsGroup.attr(
    'transform',
    `translate(${0}, ${annotationGroupHeight + labelGroupHeight + (membersGroupHeight ? membersGroupHeight + GAP * 4 : GAP * 2)})`
  );

  bbox = shapeSvg.node().getBBox();

  return { shapeSvg, bbox };
};

const addText = async (
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  node: Node | ClassNode | ClassMember,
  yOffset: number,
  styles: string[] = []
) => {
  const textEl = parentGroup.insert('g').attr('class', 'label').attr('style', styles);
  const config = getConfig();
  const useHtmlLabels = config.class?.htmlLabels ?? config.htmlLabels ?? true;

  let textContent = '';
  if ('text' in node) {
    textContent = node.text;
  } else {
    textContent = node.label!;
  }

  const text = await createText(
    textEl,
    textContent,
    {
      width: calculateTextWidth(textContent, config) + 50, // Add room for error when splitting text into multiple lines
      classes: 'markdown-node-label',
      useHtmlLabels,
    },
    config
  );

  let bbox;

  // createText() creates unwanted behavior because of syntax, so fix
  if (!useHtmlLabels) {
    text.children[0].textContent = text.textContent.replaceAll('&gt;', '>').replaceAll('&lt;', '<');
    if (text.children[0].textContent === '') {
      const preserveSpace = textContent[1] === ' ';
      // Text was improperly removed due to spaces (preserve one space if present)
      text.children[0].textContent =
        textContent[0] +
        textContent.substring(1).replaceAll('&gt;', '>').replaceAll('&lt;', '<').trim();
      if (preserveSpace) {
        text.children[0].textContent =
          text.children[0].textContent[0] + ' ' + text.children[0].textContent.substring(1);
      }
    }
    // Get rid of extra multi-line text elements
    if (text.children.length > 1) {
      text.removeChild(text.children[1]);
    }

    // Get the bounding box after the text update
    bbox = text.getBBox();
  } else {
    const div = text.children[0];
    const dv = select(text);

    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  textEl.attr('transform', 'translate(0,' + (-bbox.height / 2 + yOffset) + ')');
};
