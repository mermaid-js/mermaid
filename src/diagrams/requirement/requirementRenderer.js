import { line, select } from 'd3';
import dagre from 'dagre';
import graphlib from 'graphlib';
// import * as configApi from '../../config';
import { log } from '../../logger';
import { configureSvgSize } from '../../utils';
import common from '../common/common';
import { parser } from './parser/requirementDiagram';
import requirementDb from './requirementDb';
import markers from './requirementMarkers';

const conf = {};
let relCnt = 0;

export const setConf = function (cnf) {
  if (typeof cnf === 'undefined') {
    return;
  }
  const keys = Object.keys(cnf);
  for (let i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};

const newRectNode = (parentNode, id) => {
  return parentNode
    .insert('rect', '#' + id)
    .attr('class', 'req reqBox')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', conf.rect_min_width + 'px')
    .attr('height', conf.rect_min_height + 'px');
};

const newTitleNode = (parentNode, id, txts) => {
  let x = conf.rect_min_width / 2;

  let title = parentNode
    .append('text')
    .attr('class', 'req reqLabel reqTitle')
    .attr('id', id)
    .attr('x', x)
    .attr('y', conf.rect_padding)
    .attr('dominant-baseline', 'hanging');
  // .attr(
  //   'style',
  //   'font-family: ' + configApi.getConfig().fontFamily + '; font-size: ' + conf.fontSize + 'px'
  // )
  let i = 0;
  txts.forEach((textStr) => {
    if (i == 0) {
      title
        .append('tspan')
        .attr('text-anchor', 'middle')
        .attr('x', conf.rect_min_width / 2)
        .attr('dy', 0)
        .text(textStr);
    } else {
      title
        .append('tspan')
        .attr('text-anchor', 'middle')
        .attr('x', conf.rect_min_width / 2)
        .attr('dy', conf.line_height * 0.75)
        .text(textStr);
    }
    i++;
  });

  let yPadding = 1.5 * conf.rect_padding;
  let linePadding = i * conf.line_height * 0.75;
  let totalY = yPadding + linePadding;

  parentNode
    .append('line')
    .attr('class', 'req-title-line')
    .attr('x1', '0')
    .attr('x2', conf.rect_min_width)
    .attr('y1', totalY)
    .attr('y2', totalY);

  return {
    titleNode: title,
    y: totalY,
  };
};

const newBodyNode = (parentNode, id, txts, yStart) => {
  let body = parentNode
    .append('text')
    .attr('class', 'req reqLabel')
    .attr('id', id)
    .attr('x', conf.rect_padding)
    .attr('y', yStart)
    .attr('dominant-baseline', 'hanging');
  // .attr(
  //   'style',
  //   'font-family: ' + configApi.getConfig().fontFamily + '; font-size: ' + conf.fontSize + 'px'
  // );

  let currentRow = 0;
  const charLimit = 30;
  let wrappedTxts = [];
  txts.forEach((textStr) => {
    let currentTextLen = textStr.length;
    while (currentTextLen > charLimit && currentRow < 3) {
      let firstPart = textStr.substring(0, charLimit);
      textStr = textStr.substring(charLimit, textStr.length);
      currentTextLen = textStr.length;
      wrappedTxts[wrappedTxts.length] = firstPart;
      currentRow++;
    }
    if (currentRow == 3) {
      let lastStr = wrappedTxts[wrappedTxts.length - 1];
      wrappedTxts[wrappedTxts.length - 1] = lastStr.substring(0, lastStr.length - 4) + '...';
    } else {
      wrappedTxts[wrappedTxts.length] = textStr;
    }
    currentRow = 0;
  });

  wrappedTxts.forEach((textStr) => {
    body.append('tspan').attr('x', conf.rect_padding).attr('dy', conf.line_height).text(textStr);
  });

  return body;
};

const addEdgeLabel = (parentNode, svgPath, conf, txt) => {
  // Find the half-way point
  const len = svgPath.node().getTotalLength();
  const labelPoint = svgPath.node().getPointAtLength(len * 0.5);

  // Append a text node containing the label
  const labelId = 'rel' + relCnt;
  relCnt++;

  const labelNode = parentNode
    .append('text')
    .attr('class', 'req relationshipLabel')
    .attr('id', labelId)
    .attr('x', labelPoint.x)
    .attr('y', labelPoint.y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    // .attr('style', 'font-family: ' + conf.fontFamily + '; font-size: ' + conf.fontSize + 'px')
    .text(txt);

  // Figure out how big the opaque 'container' rectangle needs to be
  const labelBBox = labelNode.node().getBBox();

  // Insert the opaque rectangle before the text label
  parentNode
    .insert('rect', '#' + labelId)
    .attr('class', 'req reqLabelBox')
    .attr('x', labelPoint.x - labelBBox.width / 2)
    .attr('y', labelPoint.y - labelBBox.height / 2)
    .attr('width', labelBBox.width)
    .attr('height', labelBBox.height)
    .attr('fill', 'white')
    .attr('fill-opacity', '85%');
};

const drawRelationshipFromLayout = function (svg, rel, g, insert) {
  // Find the edge relating to this relationship
  const edge = g.edge(elementString(rel.src), elementString(rel.dst));

  // Get a function that will generate the line path
  const lineFunction = line()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    });

  // Insert the line at the right place
  const svgPath = svg
    .insert('path', '#' + insert)
    .attr('class', 'er relationshipLine')
    .attr('d', lineFunction(edge.points))
    .attr('fill', 'none');

  if (rel.type == requirementDb.Relationships.CONTAINS) {
    svgPath.attr(
      'marker-start',
      'url(' + common.getUrl(conf.arrowMarkerAbsolute) + '#' + rel.type + '_line_ending' + ')'
    );
  } else {
    svgPath.attr('stroke-dasharray', '10,7');
    svgPath.attr(
      'marker-end',
      'url(' +
        common.getUrl(conf.arrowMarkerAbsolute) +
        '#' +
        markers.ReqMarkers.ARROW +
        '_line_ending' +
        ')'
    );
  }

  addEdgeLabel(svg, svgPath, conf, `<<${rel.type}>>`);

  return;
};

export const drawReqs = (reqs, graph, svgNode) => {
  Object.keys(reqs).forEach((reqName) => {
    let req = reqs[reqName];
    reqName = elementString(reqName);
    log.info('Added new requirement: ', reqName);

    const groupNode = svgNode.append('g').attr('id', reqName);
    const textId = 'req-' + reqName;
    const rectNode = newRectNode(groupNode, textId);

    let nodes = [];

    let titleNodeInfo = newTitleNode(groupNode, reqName + '_title', [
      `<<${req.type}>>`,
      `${req.name}`,
    ]);

    nodes.push(titleNodeInfo.titleNode);

    let bodyNode = newBodyNode(
      groupNode,
      reqName + '_body',
      [
        `Id: ${req.id}`,
        `Text: ${req.text}`,
        `Risk: ${req.risk}`,
        `Verification: ${req.verifyMethod}`,
      ],
      titleNodeInfo.y
    );

    nodes.push(bodyNode);

    const rectBBox = rectNode.node().getBBox();

    // Add the entity to the graph
    graph.setNode(reqName, {
      width: rectBBox.width,
      height: rectBBox.height,
      shape: 'rect',
      id: reqName,
    });
  });
};

export const drawElements = (els, graph, svgNode) => {
  Object.keys(els).forEach((elName) => {
    let el = els[elName];
    const id = elementString(elName);

    const groupNode = svgNode.append('g').attr('id', id);
    const textId = 'element-' + id;
    const rectNode = newRectNode(groupNode, textId);

    let nodes = [];

    let titleNodeInfo = newTitleNode(groupNode, textId + '_title', [`<<Element>>`, `${elName}`]);

    nodes.push(titleNodeInfo.titleNode);

    let bodyNode = newBodyNode(
      groupNode,
      textId + '_body',
      [`Type: ${el.type || 'Not Specified'}`, `Doc Ref: ${el.docRef || 'None'}`],
      titleNodeInfo.y
    );

    nodes.push(bodyNode);

    const rectBBox = rectNode.node().getBBox();

    // Add the entity to the graph
    graph.setNode(id, {
      width: rectBBox.width,
      height: rectBBox.height,
      shape: 'rect',
      id: id,
    });
  });
};

const addRelationships = (relationships, g) => {
  relationships.forEach(function (r) {
    let src = elementString(r.src);
    let dst = elementString(r.dst);
    g.setEdge(src, dst, { relationship: r });
  });
  return relationships;
};

const adjustEntities = function (svgNode, graph) {
  graph.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      svgNode.select('#' + v);
      svgNode
        .select('#' + v)
        .attr(
          'transform',
          'translate(' +
            (graph.node(v).x - graph.node(v).width / 2) +
            ',' +
            (graph.node(v).y - graph.node(v).height / 2) +
            ' )'
        );
    }
  });
  return;
};

const elementString = (str) => {
  return str.replace(/\s/g, '').replace(/\./g, '_');
};

export const draw = (text, id) => {
  parser.yy = requirementDb;
  parser.yy.clear();
  parser.parse(text);

  const svg = select(`[id='${id}']`);
  markers.insertLineEndings(svg, conf);

  const g = new graphlib.Graph({
    multigraph: false,
    compound: false,
    directed: true,
  })
    .setGraph({
      rankdir: conf.layoutDirection,
      marginx: 20,
      marginy: 20,
      nodesep: 100,
      edgesep: 100,
      ranksep: 100,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  let requirements = requirementDb.getRequirements();
  let elements = requirementDb.getElements();
  let relationships = requirementDb.getRelationships();

  drawReqs(requirements, g, svg);
  drawElements(elements, g, svg);
  addRelationships(relationships, g);
  dagre.layout(g);
  adjustEntities(svg, g);

  relationships.forEach(function (rel) {
    drawRelationshipFromLayout(svg, rel, g, id);
  });

  // svg.attr('height', '500px');
  const padding = conf.rect_padding;
  const svgBounds = svg.node().getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(svg, height, width, conf.useMaxWidth);

  svg.attr('viewBox', `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`);
};

export default {
  setConf,
  draw,
};
