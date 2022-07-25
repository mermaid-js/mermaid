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
    'mindmap-node ' + (section === -1 ? 'section-root' : 'section-' + section)
  );

  const rect = {
    fill: '#EDF2AE',
    stroke: '#666',
    width: node.width,
    anchor: 'start',
    height: 100,
    rx: 3,
    ry: 3,
  };

  const r = nodeElem
    .append('rect')
    // .attr('width', node.width)
    // .attr('fill', section === -1 ? rect.fill : section2Color(section))
    // .attr('stroke', section === -1 ? rect.stroke : 0)
    .attr('rx', rect.rx)
    .attr('ry', rect.ry)
    .attr('id', 'node-' + node.id)
    .attr('class', 'node-bkg ');

  const textElem = nodeElem.append('g');

  const txt = textElem
    .append('text')
    .text(node.descr)
    .attr('dy', '1em')
    .attr('alignment-baseline', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .call(wrap, node.width);
  const bbox = txt.node().getBBox();
  node.height = bbox.height + conf.fontSize * 1.1 * 0.5;
  node.width = bbox.width + conf.fontSize * 1.1 * 0.5;
  r.attr('height', node.height).attr('width', node.width);
  textElem.attr('transform', 'translate(' + node.width / 2 + ', ' + 0 + ')');
  // Position the node to its coordinate
  if (node.x || node.y) {
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
