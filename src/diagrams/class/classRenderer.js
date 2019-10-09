import * as d3 from 'd3';
import dagre from 'dagre-layout';
import graphlib from 'graphlibrary';
import { logger } from '../../logger';
import classDb from './classDb';
import utils from '../../utils';
import { parser } from './parser/classDiagram';

parser.yy = classDb;

const idCache = {};

let classCnt = 0;
const conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
};

// Todo optimize
const getGraphId = function(label) {
  const keys = Object.keys(idCache);

  for (let i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i];
    }
  }

  return undefined;
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */
const insertMarkers = function(elem) {
  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,7 L18,13 V 1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'extensionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'compositionEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'aggregationEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyStart')
    .attr('class', 'extension')
    .attr('refX', 0)
    .attr('refY', 7)
    .attr('markerWidth', 190)
    .attr('markerHeight', 240)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');

  elem
    .append('defs')
    .append('marker')
    .attr('id', 'dependencyEnd')
    .attr('refX', 19)
    .attr('refY', 7)
    .attr('markerWidth', 20)
    .attr('markerHeight', 28)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

let edgeCount = 0;
let total = 0;
const drawEdge = function(elem, path, relation) {
  const getRelationType = function(type) {
    switch (type) {
      case classDb.relationType.AGGREGATION:
        return 'aggregation';
      case classDb.relationType.EXTENSION:
        return 'extension';
      case classDb.relationType.COMPOSITION:
        return 'composition';
      case classDb.relationType.DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(p => !Number.isNaN(p.y));

  // The data for our line
  const lineData = path.points;

  // This is the accessor function we talked about above
  const lineFunction = d3
    .line()
    .x(function(d) {
      return d.x;
    })
    .y(function(d) {
      return d.y;
    })
    .curve(d3.curveBasis);

  const svgPath = elem
    .append('path')
    .attr('d', lineFunction(lineData))
    .attr('id', 'edge' + edgeCount)
    .attr('class', 'relation');
  let url = '';
  if (conf.arrowMarkerAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  if (relation.relation.type1 !== 'none') {
    svgPath.attr(
      'marker-start',
      'url(' + url + '#' + getRelationType(relation.relation.type1) + 'Start' + ')'
    );
  }
  if (relation.relation.type2 !== 'none') {
    svgPath.attr(
      'marker-end',
      'url(' + url + '#' + getRelationType(relation.relation.type2) + 'End' + ')'
    );
  }

  let x, y;
  const l = path.points.length;
  // Calculate Label position
  let labalPosition = utils.calcLabelPosition(path.points);
  x = labalPosition.x;
  y = labalPosition.y;

  let p1_card_x,
    p1_card_y,
    p1_card_padd_x = conf.padding * 2,
    p1_card_padd_y = conf.padding;
  let p2_card_x,
    p2_card_y,
    p2_card_padd_x = conf.padding * 2,
    p2_card_padd_y = -conf.padding / 2;
  if (l % 2 !== 0 && l > 1) {
    let cardinality_1_point = utils.calcCardinalityPosition(
      relation.relation.type1 !== 'none',
      path.points,
      path.points[0]
    );
    let cardinality_2_point = utils.calcCardinalityPosition(
      relation.relation.type2 !== 'none',
      path.points,
      path.points[l - 1]
    );

    logger.debug('cardinality_1_point ' + JSON.stringify(cardinality_1_point));
    logger.debug('cardinality_2_point ' + JSON.stringify(cardinality_2_point));

    p1_card_x = cardinality_1_point.x;
    p1_card_y = cardinality_1_point.y;
    p2_card_x = cardinality_2_point.x;
    p2_card_y = cardinality_2_point.y;
  }

  if (typeof relation.title !== 'undefined') {
    const g = elem.append('g').attr('class', 'classLabel');
    const label = g
      .append('text')
      .attr('class', 'label')
      .attr('x', x)
      .attr('y', y)
      .attr('fill', 'red')
      .attr('text-anchor', 'middle')
      .text(relation.title);

    window.label = label;
    const bounds = label.node().getBBox();

    g.insert('rect', ':first-child')
      .attr('class', 'box')
      .attr('x', bounds.x - conf.padding / 2)
      .attr('y', bounds.y - conf.padding / 2)
      .attr('width', bounds.width + conf.padding)
      .attr('height', bounds.height + conf.padding);
  }

  logger.info('Rendering relation ' + JSON.stringify(relation));
  if (typeof relation.relationTitle1 !== 'undefined' && relation.relationTitle1 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    const label = g
      .append('text')
      .attr('class', 'type1')
      .attr('x', p1_card_x)
      .attr('y', p1_card_y)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle1);
  }
  if (typeof relation.relationTitle2 !== 'undefined' && relation.relationTitle2 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    const label = g
      .append('text')
      .attr('class', 'type2')
      .attr('x', p2_card_x)
      .attr('y', p2_card_y)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle2);
  }

  edgeCount++;
};

const drawClass = function(elem, classDef) {
  logger.info('Rendering class ' + classDef);

  const addTspan = function(textEl, txt, isFirst) {
    const tSpan = textEl
      .append('tspan')
      .attr('x', conf.padding)
      .text(txt);
    if (!isFirst) {
      tSpan.attr('dy', conf.textHeight);
    }
  };

  const id = 'classId' + (classCnt % total);
  const classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  };

  // add class group
  const g = elem
    .append('g')
    .attr('id', id)
    .attr('class', 'classGroup');

  // add title
  const title = g
    .append('text')
    .attr('y', conf.textHeight + conf.padding)
    .attr('x', 0);

  // add annotations
  let isFirst = true;
  classDef.annotations.forEach(function(member) {
    const titleText2 = title.append('tspan').text('«' + member + '»');
    if (!isFirst) titleText2.attr('dy', conf.textHeight);
    isFirst = false;
  });

  console.warn('classDef.id', classDef.id);
  console.warn('isFirst', isFirst);
  // add class title
  const classTitle = title
    .append('tspan')
    .text(classDef.id)
    .attr('class', 'title');

  // If class has annotations the title needs to have an offset of the text height
  if (!isFirst) classTitle.attr('dy', conf.textHeight);

  const titleHeight = title.node().getBBox().height;

  const membersLine = g
    .append('line') // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin / 2)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin / 2);

  const members = g
    .append('text') // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + conf.dividerMargin + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText');
  console.warn(classDef.id, titleHeight, conf.dividerMargin, conf.textHeight);

  isFirst = true;
  classDef.members.forEach(function(member) {
    addTspan(members, member, isFirst);
    isFirst = false;
  });

  const membersBox = members.node().getBBox();

  const methodsLine = g
    .append('line') // text label for the x axis
    .attr('x1', 0)
    .attr('y1', conf.padding + titleHeight + conf.dividerMargin + membersBox.height)
    .attr('y2', conf.padding + titleHeight + conf.dividerMargin + membersBox.height);

  const methods = g
    .append('text') // text label for the x axis
    .attr('x', conf.padding)
    .attr('y', titleHeight + 2 * conf.dividerMargin + membersBox.height + conf.textHeight)
    .attr('fill', 'white')
    .attr('class', 'classText');

  isFirst = true;

  classDef.methods.forEach(function(method) {
    addTspan(methods, method, isFirst);
    isFirst = false;
  });

  const classBox = g.node().getBBox();
  const rect = g
    .insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', classBox.width + 2 * conf.padding)
    .attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin);

  const rectWidth = rect.node().getBBox().width;

  // Center title
  // We subtract the width of each text element from the class box width and divide it by 2
  title.node().childNodes.forEach(function(x) {
    x.setAttribute('x', (rectWidth - x.getBBox().width) / 2);
  });

  membersLine.attr('x2', rectWidth);
  methodsLine.attr('x2', rectWidth);

  classInfo.width = rectWidth;
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin;

  idCache[id] = classInfo;
  classCnt++;
  return classInfo;
};

export const setConf = function(cnf) {
  const keys = Object.keys(cnf);

  keys.forEach(function(key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
export const draw = function(text, id) {
  parser.yy.clear();
  parser.parse(text);

  logger.info('Rendering diagram ' + text);

  /// / Fetch the default direction, use TD if none was found
  const diagram = d3.select(`[id='${id}']`);
  insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const g = new graphlib.Graph({
    multigraph: true
  });

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function() {
    return {};
  });

  const classes = classDb.getClasses();
  const keys = Object.keys(classes);
  total = keys.length;
  for (let i = 0; i < keys.length; i++) {
    const classDef = classes[keys[i]];
    const node = drawClass(diagram, classDef);
    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);
    logger.info('Org height: ' + node.height);
  }

  const relations = classDb.getRelations();
  relations.forEach(function(relation) {
    logger.info(
      'tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation)
    );
    g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), {
      relation: relation
    });
  });
  dagre.layout(g);
  g.nodes().forEach(function(v) {
    if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
      logger.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      d3.select('#' + v).attr(
        'transform',
        'translate(' +
          (g.node(v).x - g.node(v).width / 2) +
          ',' +
          (g.node(v).y - g.node(v).height / 2) +
          ' )'
      );
    }
  });
  g.edges().forEach(function(e) {
    if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
      logger.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      drawEdge(diagram, g.edge(e), g.edge(e).relation);
    }
  });

  diagram.attr('height', '100%');
  diagram.attr('width', `${g.graph().width * 1.5 + 20}`);
  diagram.attr('viewBox', '-10 -10 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20));
};

export default {
  setConf,
  draw
};
