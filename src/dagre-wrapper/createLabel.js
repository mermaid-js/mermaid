import { select } from 'd3';
import { log } from '../logger'; // eslint-disable-line
import { evaluate } from '../diagrams/common/common';
// let vertexNode;
// if (evaluate(getConfig().flowchart.htmlLabels)) {
//   // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
//   const node = {
//     label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, s => `<i class='${s.replace(':', ' ')}'></i>`)
//   };
//   vertexNode = addHtmlLabel(svg, node).node();
//   vertexNode.parentNode.removeChild(vertexNode);
// } else {
//   const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//   svgLabel.setAttribute('style', styles.labelStyle.replace('color:', 'fill:'));

//   const rows = vertexText.split(common.lineBreakRegex);

//   for (let j = 0; j < rows.length; j++) {
//     const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//     tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
//     tspan.setAttribute('dy', '1em');
//     tspan.setAttribute('x', '1');
//     tspan.textContent = rows[j];
//     svgLabel.appendChild(tspan);
//   }
//   vertexNode = svgLabel;
// }
import { getConfig } from '../config';

function applyStyle(dom, styleFn) {
  if (styleFn) {
    dom.attr('style', styleFn);
  }
}

function addHtmlLabel(node) {
  // var fo = root.append('foreignObject').attr('width', '100000');

  // var div = fo.append('xhtml:div');
  // div.attr('xmlns', 'http://www.w3.org/1999/xhtml');

  // var label = node.label;
  // switch (typeof label) {
  //   case 'function':
  //     div.insert(label);
  //     break;
  //   case 'object':
  //     // Currently we assume this is a DOM object.
  //     div.insert(function() {
  //       return label;
  //     });
  //     break;
  //   default:
  //     div.html(label);
  // }

  // applyStyle(div, node.labelStyle);
  // div.style('display', 'inline-block');
  // // Fix for firefox
  // div.style('white-space', 'nowrap');

  // var client = div.node().getBoundingClientRect();
  // fo.attr('width', client.width).attr('height', client.height);
  const fo = select(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
  const div = fo.append('xhtml:div');

  const label = node.label;
  const labelClass = node.isNode ? 'nodeLabel' : 'edgeLabel';
  div.html(
    '<span class="' +
      labelClass +
      '" ' +
      (node.labelStyle ? 'style="' + node.labelStyle + '"' : '') +
      '>' +
      label +
      '</span>'
  );

  applyStyle(div, node.labelStyle);
  div.style('display', 'inline-block');
  // Fix for firefox
  div.style('white-space', 'nowrap');
  div.attr('xmlns', 'http://www.w3.org/1999/xhtml');
  return fo.node();
}

const createLabel = (_vertexText, style, isTitle, isNode) => {
  let vertexText = _vertexText || '';
  if (typeof vertexText === 'object') vertexText = vertexText[0];
  if (evaluate(getConfig().flowchart.htmlLabels)) {
    // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
    vertexText = vertexText.replace(/\\n|\n/g, '<br />');
    log.info('vertexText' + vertexText);
    const node = {
      isNode,
      label: vertexText.replace(
        /fa[lrsb]?:fa-[\w-]+/g,
        (s) => `<i class='${s.replace(':', ' ')}'></i>`
      ),
      labelStyle: style.replace('fill:', 'color:'),
    };
    let vertexNode = addHtmlLabel(node);
    // vertexNode.parentNode.removeChild(vertexNode);
    return vertexNode;
  } else {
    const svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svgLabel.setAttribute('style', style.replace('color:', 'fill:'));
    let rows = [];
    if (typeof vertexText === 'string') {
      rows = vertexText.split(/\\n|\n|<br\s*\/?>/gi);
    } else if (Array.isArray(vertexText)) {
      rows = vertexText;
    } else {
      rows = [];
    }

    for (let j = 0; j < rows.length; j++) {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      tspan.setAttribute('dy', '1em');
      tspan.setAttribute('x', '0');
      if (isTitle) {
        tspan.setAttribute('class', 'title-row');
      } else {
        tspan.setAttribute('class', 'row');
      }
      tspan.textContent = rows[j].trim();
      svgLabel.appendChild(tspan);
    }
    return svgLabel;
  }
};

export default createLabel;
