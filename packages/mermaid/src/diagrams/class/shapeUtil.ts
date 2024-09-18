import { select } from 'd3';
import { getConfig } from '../../config.js';
import { getNodeClasses } from '../../rendering-util/rendering-elements/shapes/util.js';
import { calculateTextHeight, calculateTextWidth, decodeEntities } from '../../utils.js';
import type { ClassMember, ClassNode } from './classTypes.js';
import { sanitizeText } from '../../diagram-api/diagramAPI.js';
import { createText } from '../../rendering-util/createText.js';
import { hasKatex } from '../common/common.js';
import type { Node } from '../../rendering-util/types.js';
import type { MermaidConfig } from '../../config.type.js';

// Creates the shapeSvg and inserts text
export const textHelper = async (
  parent: SVGAElement,
  node: any,
  config: MermaidConfig,
  GAP = config.class!.padding ?? 12
) => {
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
  if (node.annotations.length > 0) {
    const annotation = node.annotations[0];
    await addText(annotationGroup, { text: `«${annotation}»` } as unknown as ClassMember, 0);

    const annotationGroupBBox = annotationGroup.node().getBBox();
    annotationGroupHeight = annotationGroupBBox.height;
  }

  labelGroup = shapeSvg.insert('g').attr('class', 'label-group text');
  await addText(labelGroup, node, 0, ['font-weight: bolder']);
  const labelGroupBBox = labelGroup.node().getBBox();
  labelGroupHeight = labelGroupBBox.height;

  membersGroup = shapeSvg.insert('g').attr('class', 'members-group text');
  let yOffset = 0;
  for (const member of node.members) {
    await addText(membersGroup, member, yOffset, [member.parseClassifier()]);
    yOffset += calculateTextHeight(member.text, config) + TEXT_PADDING;
  }
  membersGroupHeight = membersGroup.node().getBBox().height;

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

// Modified version of labelHelper() to help create and place text for classes
const addText = async (
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  node: Node | ClassNode | ClassMember,
  yOffset: number,
  styles: string[] = []
) => {
  const textEl = parentGroup.insert('g').attr('class', 'label').attr('style', styles.join('; '));
  const config = getConfig();
  let useHtmlLabels = config.class?.htmlLabels ?? config.htmlLabels ?? true;

  let textContent = '';
  // Support regular node type (.label) and classNodes (.text)
  if ('text' in node) {
    textContent = node.text;
  } else {
    textContent = node.label!;
  }

  if (hasKatex(textContent)) {
    useHtmlLabels = true;
  }

  const text = await createText(
    textEl,
    sanitizeText(decodeEntities(textContent)),
    {
      width: calculateTextWidth(textContent, config) + 50, // Add room for error when splitting text into multiple lines
      classes: 'markdown-node-label',
      useHtmlLabels,
    },
    config
  );
  let bbox;
  let numberOfLines = 1;

  // createText() creates unwanted behavior because of syntax, so fix
  if (!useHtmlLabels) {
    // Undo font-weight
    select(text).selectAll('tspan').attr('font-weight', '');

    numberOfLines = text.children.length;

    const textChild = text.children[0];
    if (text.textContent === '' || text.textContent.includes('&gt')) {
      textChild.textContent =
        textContent[0] +
        textContent.substring(1).replaceAll('&gt;', '>').replaceAll('&lt;', '<').trim();

      // Text was improperly removed due to spaces (preserve one space if present)
      const preserveSpace = textContent[1] === ' ';
      if (preserveSpace) {
        textChild.textContent = textChild.textContent[0] + ' ' + textChild.textContent.substring(1);
      }
    }

    // To support empty boxes
    if (textChild.textContent === 'undefined') {
      textChild.textContent = '';
    }

    // Get the bounding box after the text update
    bbox = text.getBBox();
  } else {
    const div = text.children[0];
    const dv = select(text);

    numberOfLines = div.innerHTML.split('<br>').length;
    // Katex math support
    if (div.innerHTML.includes('</math>')) {
      numberOfLines += div.innerHTML.split('<mrow>').length - 1;
    }

    // Support images
    const images = div.getElementsByTagName('img');
    if (images) {
      const noImgText = textContent.replace(/<img[^>]*>/g, '').trim() === '';
      await Promise.all(
        [...images].map(
          (img) =>
            new Promise((res) => {
              function setupImage() {
                img.style.display = 'flex';
                img.style.flexDirection = 'column';

                if (noImgText) {
                  // default size if no text
                  const bodyFontSize =
                    config.fontSize?.toString() ?? window.getComputedStyle(document.body).fontSize;
                  const enlargingFactor = 5;
                  const width = parseInt(bodyFontSize, 10) * enlargingFactor + 'px';
                  img.style.minWidth = width;
                  img.style.maxWidth = width;
                } else {
                  img.style.width = '100%';
                }
                res(img);
              }
              setTimeout(() => {
                if (img.complete) {
                  setupImage();
                }
              });
              img.addEventListener('error', setupImage);
              img.addEventListener('load', setupImage);
            })
        )
      );
    }

    bbox = div.getBoundingClientRect();
    dv.attr('width', bbox.width);
    dv.attr('height', bbox.height);
  }

  // Center text and offset by yOffset
  textEl.attr('transform', 'translate(0,' + (-bbox.height / (2 * numberOfLines) + yOffset) + ')');
};
