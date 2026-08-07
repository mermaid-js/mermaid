import { select } from 'd3';
import { createText } from '../../createText.js';
import type { Node } from '../../types.js';
import { getConfig } from '../../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../../../diagrams/common/common.js';
import { decodeEntities, handleUndefinedAttr } from '../../../utils.js';
import type { D3Selection } from '../../../types.js';

const SECTION_GAP = 3;
const MIN_WRAP_WIDTH = 32;

/**
 * Renders a stacked multi-section node label (name, stereotype, description
 * lines) as pure SVG text, one `createText` call per section so each section
 * can be styled through its own CSS class.
 *
 * Drop-in for `labelHelper` on nodes carrying a `stereotype`: same element
 * structure and return contract. The wrap width is a soft limit - an
 * unbreakable word may exceed it, and the calling shape self-sizes from the
 * returned bounds.
 */
export const c4LabelHelper = async <T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node,
  classes?: string
) => {
  const config = getConfig();

  const shapeSvg = parent
    .insert('g')
    .attr('class', classes ?? 'node default')
    .attr('id', node.domId || node.id);

  const labelEl = shapeSvg
    .insert('g')
    .attr('class', 'label')
    .attr('style', handleUndefinedAttr(node.labelStyle));

  const name = typeof node.label === 'string' ? node.label : (node.label?.[0] ?? '');
  const sections = [
    { text: name, cssClass: 'c4-name' },
    { text: node.stereotype, cssClass: 'c4-type' },
    ...(node.description ?? []).map((line) => ({ text: line, cssClass: 'c4-descr' })),
  ].filter((section) => section.text);

  const wrapWidth = node.width
    ? Math.max(node.width - 2 * (node.padding ?? 0), MIN_WRAP_WIDTH)
    : (getConfig().flowchart?.wrappingWidth ?? 200);
  // Wrapping is opt-in via the root `wrap` config, matching the legacy C4
  // renderer; the (currently ignored) c4.wrap option is tracked in #7949.
  const width = config.wrap ? wrapWidth : Number.POSITIVE_INFINITY;

  const rendered = await Promise.all(
    sections.map(async (section) => {
      // Appending before the first await pins the section order in the DOM.
      const sectionEl = labelEl.append('g').attr('class', section.cssClass);
      const textEl = await createText(
        sectionEl,
        sanitizeText(decodeEntities(section.text ?? ''), config),
        {
          useHtmlLabels: false,
          markdown: false,
          isNode: true,
          width,
          style: node.labelStyle,
        },
        config
      );
      // Center each wrapped line within the section; the outer tspan elements sit at x=0.
      select(textEl).selectAll('tspan.text-outer-tspan').attr('text-anchor', 'middle');
      // Without markdown every word is "normal"; drop the presentation attributes so
      // font weight and style from CSS (section classes, per-element config) inherit.
      select(textEl)
        .selectAll('tspan.text-inner-tspan')
        .attr('font-weight', null)
        .attr('font-style', null);
      return { el: sectionEl, box: sectionEl.node()!.getBBox() };
    })
  );

  const totalWidth = Math.max(...rendered.map(({ box }) => box.width), 0);
  let y = 0;
  for (const { el, box } of rendered) {
    el.attr('transform', `translate(${totalWidth / 2 - box.x - box.width / 2}, ${y - box.y})`);
    y += box.height + SECTION_GAP;
  }
  const totalHeight = rendered.length > 0 ? y - SECTION_GAP : 0;

  labelEl.insert('rect', ':first-child');
  labelEl.attr('transform', `translate(${-totalWidth / 2}, ${-totalHeight / 2})`);

  const bbox = labelEl.node()!.getBBox();
  const halfPadding = (node.padding ?? 0) / 2;
  return { shapeSvg, bbox, halfPadding, label: labelEl };
};
