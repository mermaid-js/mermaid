import { line, curveBasis } from 'd3';
import utils from '../../utils.js';
import { log } from '../../logger.js';
import { parseGenericTypes } from '../common/common.js';

let edgeCount = 0;
export const drawEdge = function (elem, path, relation, conf, diagObj) {
  const getRelationType = function (type) {
    switch (type) {
      case diagObj.db.relationType.AGGREGATION:
        return 'aggregation';
      case diagObj.db.relationType.EXTENSION:
        return 'extension';
      case diagObj.db.relationType.COMPOSITION:
        return 'composition';
      case diagObj.db.relationType.DEPENDENCY:
        return 'dependency';
      case diagObj.db.relationType.LOLLIPOP:
        return 'lollipop';
    }
  };

  path.points = path.points.filter((p) => !Number.isNaN(p.y));

  // The data for our line
  const lineData = path.points;

  // This is the accessor function we talked about above
  const lineFunction = line()
    .x(function (d) {
      return d.x;
    })
    .y(function (d) {
      return d.y;
    })
    .curve(curveBasis);

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

  if (relation.relation.lineType == 1) {
    svgPath.attr('class', 'relation dashed-line');
  }
  if (relation.relation.lineType == 10) {
    svgPath.attr('class', 'relation dotted-line');
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
  let labelPosition = utils.calcLabelPosition(path.points);
  x = labelPosition.x;
  y = labelPosition.y;

  let p1_card_x, p1_card_y;
  let p2_card_x, p2_card_y;

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

    log.debug('cardinality_1_point ' + JSON.stringify(cardinality_1_point));
    log.debug('cardinality_2_point ' + JSON.stringify(cardinality_2_point));

    p1_card_x = cardinality_1_point.x;
    p1_card_y = cardinality_1_point.y;
    p2_card_x = cardinality_2_point.x;
    p2_card_y = cardinality_2_point.y;
  }

  if (relation.title !== undefined) {
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

  log.info('Rendering relation ' + JSON.stringify(relation));
  if (relation.relationTitle1 !== undefined && relation.relationTitle1 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    g.append('text')
      .attr('class', 'type1')
      .attr('x', p1_card_x)
      .attr('y', p1_card_y)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle1);
  }
  if (relation.relationTitle2 !== undefined && relation.relationTitle2 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    g.append('text')
      .attr('class', 'type2')
      .attr('x', p2_card_x)
      .attr('y', p2_card_y)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle2);
  }

  edgeCount++;
};

/**
 * Renders a class diagram
 *
 * @param {SVGSVGElement} elem The element to draw it into
 * @param classDef
 * @param conf
 * @param diagObj
 * @todo Add more information in the JSDOC here
 */
export const drawClass = function (elem, classDef, conf, diagObj) {
  log.debug('Rendering class ', classDef, conf);

  const id = classDef.id;
  const classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0,
  };

  // add class group
  const g = elem.append('g').attr('id', diagObj.db.lookUpDomId(id)).attr('class', 'classGroup');

  let title;
  if (classDef.link) {
    title = g
      .append('svg:a')
      .attr('xlink:href', classDef.link)
      .attr('target', classDef.linkTarget)
      .append('text')
      .attr('y', conf.textHeight + conf.padding)
      .attr('x', 0);
  } else {
    title = g
      .append('text')
      .attr('y', conf.textHeight + conf.padding)
      .attr('x', 0);
  }

  // add annotations
  let isFirst = true;
  classDef.annotations.forEach(function (member) {
    const titleText2 = title.append('tspan').text('«' + member + '»');
    if (!isFirst) {
      titleText2.attr('dy', conf.textHeight);
    }
    isFirst = false;
  });

  let classTitleString = getClassTitleString(classDef);

  const classTitle = title.append('tspan').text(classTitleString).attr('class', 'title');

  // If class has annotations the title needs to have an offset of the text height
  if (!isFirst) {
    classTitle.attr('dy', conf.textHeight);
  }

  const titleHeight = title.node().getBBox().height;
  let membersLine;
  let membersBox;
  let methodsLine;

  // don't draw box if no members
  if (classDef.members.length > 0) {
    membersLine = g
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

    isFirst = true;
    classDef.members.forEach(function (member) {
      addTspan(members, member, isFirst, conf);
      isFirst = false;
    });

    membersBox = members.node().getBBox();
  }

  // don't draw box if no methods
  if (classDef.methods.length > 0) {
    methodsLine = g
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

    classDef.methods.forEach(function (method) {
      addTspan(methods, method, isFirst, conf);
      isFirst = false;
    });
  }

  const classBox = g.node().getBBox();
  var cssClassStr = ' ';

  if (classDef.cssClasses.length > 0) {
    cssClassStr = cssClassStr + classDef.cssClasses.join(' ');
  }

  const rect = g
    .insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', classBox.width + 2 * conf.padding)
    .attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin)
    .attr('class', cssClassStr);

  const rectWidth = rect.node().getBBox().width;

  // Center title
  // We subtract the width of each text element from the class box width and divide it by 2
  title.node().childNodes.forEach(function (x) {
    x.setAttribute('x', (rectWidth - x.getBBox().width) / 2);
  });

  if (classDef.tooltip) {
    title.insert('title').text(classDef.tooltip);
  }

  if (membersLine) {
    membersLine.attr('x2', rectWidth);
  }
  if (methodsLine) {
    methodsLine.attr('x2', rectWidth);
  }

  classInfo.width = rectWidth;
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin;

  return classInfo;
};

export const getClassTitleString = function (classDef) {
  let classTitleString = classDef.id;

  if (classDef.type) {
    classTitleString += '<' + parseGenericTypes(classDef.type) + '>';
  }

  return classTitleString;
};

/**
 * Renders a note diagram
 *
 * @param {SVGSVGElement} elem The element to draw it into
 * @param {{id: string; text: string; class: string;}} note
 * @param conf
 * @param _diagObj
 * @todo Add more information in the JSDOC here
 */
export const drawNote = function (elem, note, conf, _diagObj) {
  log.debug('Rendering note ', note, conf);

  const id = note.id;
  const noteInfo = {
    id: id,
    text: note.text,
    width: 0,
    height: 0,
  };

  // add class group
  const g = elem.append('g').attr('id', id).attr('class', 'classGroup');

  // add text
  let text = g
    .append('text')
    .attr('y', conf.textHeight + conf.padding)
    .attr('x', 0);

  const lines = JSON.parse(`"${note.text}"`).split('\n');

  lines.forEach(function (line) {
    log.debug(`Adding line: ${line}`);
    text.append('tspan').text(line).attr('class', 'title').attr('dy', conf.textHeight);
  });

  const noteBox = g.node().getBBox();

  const rect = g
    .insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', noteBox.width + 2 * conf.padding)
    .attr(
      'height',
      noteBox.height + lines.length * conf.textHeight + conf.padding + 0.5 * conf.dividerMargin
    );

  const rectWidth = rect.node().getBBox().width;

  // Center title
  // We subtract the width of each text element from the class box width and divide it by 2
  text.node().childNodes.forEach(function (x) {
    x.setAttribute('x', (rectWidth - x.getBBox().width) / 2);
  });

  noteInfo.width = rectWidth;
  noteInfo.height =
    noteBox.height + lines.length * conf.textHeight + conf.padding + 0.5 * conf.dividerMargin;

  return noteInfo;
};

/**
 * Adds a <tspan> for a member in a diagram
 *
 * @param {SVGElement} textEl The element to append to
 * @param {string} member The member
 * @param {boolean} isFirst
 * @param {{ padding: string; textHeight: string }} conf The configuration for the member
 */
const addTspan = function (textEl, member, isFirst, conf) {
  const { displayText, cssStyle } = member.getDisplayDetails();
  const tSpan = textEl.append('tspan').attr('x', conf.padding).text(displayText);

  if (cssStyle !== '') {
    tSpan.attr('style', member.cssStyle);
  }

  if (!isFirst) {
    tSpan.attr('dy', conf.textHeight);
  }
};

export default {
  getClassTitleString,
  drawClass,
  drawEdge,
  drawNote,
};
