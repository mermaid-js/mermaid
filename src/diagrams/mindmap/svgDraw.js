const lineBreakRegex = /<br\s*\/?>/gi;
import { select } from 'd3';
import db from './mindmapDb';

/**
 * @param {string} text The text to be wrapped
 * @param {number} width The max width of the text
 */
function wrap(text, width) {
  text.each(function () {
    var text = select(this),
      words = text
        .text()
        .split(/(\s+|<br>)/)
        .reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = parseFloat(text.attr('dy')),
      tspan = text
        .text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', dy + 'em');
    for (let j = 0; j < words.length; j++) {
      word = words[words.length - 1 - j];
      line.push(word);
      tspan.text(line.join(' ').trim());
      if (tspan.node().getComputedTextLength() > width || word === '<br>') {
        line.pop();
        tspan.text(line.join(' ').trim());
        if (word === '<br>') {
          line = [''];
        } else {
          line = [word];
        }

        tspan = text
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', lineHeight + 'em')
          .text(word);
      }
    }
  });
}

const defaultBkg = function (elem, node, section, conf) {
  const rd = 5;
  const r = elem
    .append('path')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + db.type2Str(node.type))
    .attr(
      'd',
      `M0 ${node.height - rd} v${-node.height + 2 * rd} q0,-5 5,-5 h${
        node.width - 2 * rd
      } q5,0 5,5 v${node.height - rd} H0 Z`
    );

  elem
    .append('line')
    .attr('class', 'node-line-' + section)
    .attr('x1', 0)
    .attr('y1', node.height)
    .attr('x2', node.width)
    .attr('y2', node.height);
};
const rectBkg = function (elem, node, section, conf) {
  const r = elem
    .append('rect')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + db.type2Str(node.type))
    .attr('height', node.height)
    .attr('width', node.width);
};
const circleBkg = function (elem, node, section, conf) {
  const r = elem
    .append('circle')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + db.type2Str(node.type))
    .attr('r', node.width / 2);
  // .attr('width', node.width);
};
const roundedRectBkg = function (elem, node, section, conf) {
  const r = elem
    .append('rect')
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg node-' + db.type2Str(node.type))
    .attr('height', node.height)
    .attr('rx', node.padding)
    .attr('ry', node.padding)
    .attr('width', node.width);
};

/**
 * @param {object} elem The D3 dom element in which the node is to be added
 * @param {object} node The node to be added
 * @param section
 * @param {object} conf The configuration object
 * @returns {number} The height nodes dom element
 */
export const drawNode = function (elem, node, section, conf) {
  const nodeElem = elem.append('g');
  nodeElem.attr(
    'class',
    (node.class ? node.class + ' ' : '') +
      'mindmap-node ' +
      (section === -1 ? 'section-root' : 'section-' + section)
  );
  const bkgElem = nodeElem.append('g');

  // Create the wrapped text element
  const textElem = nodeElem.append('g');
  const txt = textElem
    .append('text')
    .text(node.descr)
    .attr('dy', '1em')
    // .attr('dy', '0')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .call(wrap, node.width);
  const bbox = txt.node().getBBox();
  node.height = bbox.height + conf.fontSize * 1.1 * 0.5 + node.padding;
  node.width = bbox.width + 2 * node.padding;

  // textElem.attr('transform', 'translate(' + node.width / 2 + ', ' + node.height / 2 + ')');
  textElem.attr('transform', 'translate(' + node.width / 2 + ', ' + node.padding / 2 + ')');
  {
    /* <i class="mdi mdi-arrange-bring-to-front"></i> */
  }
  switch (node.type) {
    case db.nodeType.DEFAULT:
      defaultBkg(bkgElem, node, section, conf);
      break;
    case db.nodeType.ROUNDED_RECT:
      roundedRectBkg(bkgElem, node, section, conf);
      break;
    case db.nodeType.RECT:
      rectBkg(bkgElem, node, section, conf);
      break;
    case db.nodeType.CIRCLE:
      bkgElem.attr('transform', 'translate(' + node.width / 2 + ', ' + +node.height / 2 + ')');
      circleBkg(bkgElem, node, section, conf);
      break;
    default:
    // defaultBkg(bkgElem, node, section, conf);
  }

  // Position the node to its coordinate
  if (typeof node.x !== 'undefined' && typeof node.y !== 'undefined') {
    nodeElem.attr('transform', 'translate(' + node.x + ',' + node.y + ')');
  }
  db.setElementForId(node.id, nodeElem);
  return node.height;
};

export const drawEdge = function drawEdge(edgesElem, mindmap, parent, depth, section, conf) {
  edgesElem
    .append('line')
    .attr('x1', parent.x + parent.width / 2)
    .attr('y1', parent.y + parent.height / 2)
    .attr('x2', mindmap.x + mindmap.width / 2)
    .attr('y2', mindmap.y + mindmap.height / 2)
    // .attr('stroke', color)
    // .attr('stroke-width', 15 - depth * 3)
    .attr('class', 'edge section-edge-' + section + ' edge-depth-' + depth);
};

export const positionNode = function (node, conf) {
  const nodeElem = db.getElementById(node.id);

  const x = node.x || 0;
  const y = node.y || 0;
  // Position the node to its coordinate
  nodeElem.attr('transform', 'translate(' + x + ',' + y + ')');
};

export default { drawNode, positionNode, drawEdge };
