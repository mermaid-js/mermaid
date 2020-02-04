import * as d3 from 'd3';
import classDb, { lookUpDomId } from './classDb';
import utils from '../../utils';
import { logger } from '../../logger';

let edgeCount = 0;
export const drawEdge = function(elem, path, relation, conf) {
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

  if (relation.relation.lineType == 1) {
    svgPath.attr('class', 'relation dashed-line');
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
    g.append('text')
      .attr('class', 'type1')
      .attr('x', p1_card_x)
      .attr('y', p1_card_y)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle1);
  }
  if (typeof relation.relationTitle2 !== 'undefined' && relation.relationTitle2 !== 'none') {
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

export const drawClass = function(elem, classDef, conf) {
  logger.info('Rendering class ' + classDef);

  let cssClassStr = 'classGroup ';
  if (classDef.cssClasses.length > 0) {
    cssClassStr = cssClassStr + classDef.cssClasses.join(' ');
  }

  const id = classDef.id;
  const classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  };

  // add class group
  const g = elem
    .append('g')
    .attr('id', lookUpDomId(id))
    .attr('class', cssClassStr);

  // add title
  let title;
  if (classDef.link) {
    title = g
      .append('svg:a')
      .attr('xlink:href', classDef.link)
      .attr('target', '_blank')
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
  classDef.annotations.forEach(function(member) {
    const titleText2 = title.append('tspan').text('«' + member + '»');
    if (!isFirst) titleText2.attr('dy', conf.textHeight);
    isFirst = false;
  });

  let classTitleString = classDef.id;

  if (classDef.type !== undefined && classDef.type !== '') {
    classTitleString += '<' + classDef.type + '>';
  }

  const classTitle = title
    .append('tspan')
    .text(classTitleString)
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

  isFirst = true;
  classDef.members.forEach(function(member) {
    addTspan(members, member, isFirst, conf);
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
    addTspan(methods, method, isFirst, conf);
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

  if (classDef.tooltip) {
    title.insert('title').text(classDef.tooltip);
  }

  membersLine.attr('x2', rectWidth);
  methodsLine.attr('x2', rectWidth);

  classInfo.width = rectWidth;
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin;

  return classInfo;
};

export const parseMember = function(text) {
  const fieldRegEx = /^(\+|-|~|#)?(\w+)(~\w+~|\[\])?\s+(\w+)$/;
  const methodRegEx = /^(\+|-|~|#)?(\w+)\s?\(\s*(\w+(~\w+~|\[\])?\s*(\w+)?)?\s*\)\s?([*|$])?\s?(\w+(~\w+~|\[\])?)?\s*$/;

  let fieldMatch = text.match(fieldRegEx);
  let methodMatch = text.match(methodRegEx);

  if (fieldMatch) {
    return buildFieldDisplay(fieldMatch);
  } else if (methodMatch) {
    return buildMethodDisplay(methodMatch);
  } else {
    return buildLegacyDisplay(text);
  }
};

const buildFieldDisplay = function(parsedText) {
  let visibility = parsedText[1] ? parsedText[1].trim() : '';
  let fieldType = parsedText[2] ? parsedText[2].trim() : '';
  let genericType = parsedText[3] ? parseGenericTypes(parsedText[3]) : '';
  let fieldName = parsedText[4] ? parsedText[4].trim() : '';

  return {
    displayText: visibility + fieldType + genericType + ' ' + fieldName,
    cssStyle: ''
  };
};

const buildMethodDisplay = function(parsedText) {
  let cssStyle = '';
  let displayText = parsedText;

  let visibility = parsedText[1] ? parsedText[1].trim() : '';
  let methodName = parsedText[2] ? parsedText[2].trim() : '';
  let parameters = parsedText[3] ? parseGenericTypes(parsedText[3]) : '';
  let classifier = parsedText[6] ? parsedText[6].trim() : '';
  let returnType = parsedText[7] ? ' : ' + parseGenericTypes(parsedText[7]).trim() : '';

  displayText = visibility + methodName + '(' + parameters + ')' + returnType;

  cssStyle = parseClassifier(classifier);

  let member = {
    displayText: displayText,
    cssStyle: cssStyle
  };

  return member;
};

const buildLegacyDisplay = function(text) {
  // if for some reason we dont have any match, use old format to parse text
  let memberText = '';
  let cssStyle = '';
  let returnType = '';
  let methodStart = text.indexOf('(');
  let methodEnd = text.indexOf(')');

  if (methodStart > 1 && methodEnd > methodStart && methodEnd <= text.length) {
    let parsedText = text.match(/(\+|-|~|#)?(\w+)/);
    let visibility = parsedText[1] ? parsedText[1].trim() : '';
    let methodName = parsedText[2];
    let parameters = text.substring(methodStart + 1, methodEnd);
    let classifier = text.substring(methodEnd, methodEnd + 1);
    cssStyle = parseClassifier(classifier);

    memberText = visibility + methodName + '(' + parseGenericTypes(parameters.trim()) + ')';

    if (methodEnd < memberText.length) {
      returnType = text.substring(methodEnd + 2).trim();
      if (returnType !== '') {
        returnType = ' : ' + parseGenericTypes(returnType);
      }
    }
  } else {
    // finally - if all else fails, just send the text back as written (other than parsing for generic types)
    memberText = parseGenericTypes(text);
  }

  let member = {
    displayText: memberText + returnType,
    cssStyle: cssStyle
  };

  return member;
};

const addTspan = function(textEl, txt, isFirst, conf) {
  let member = parseMember(txt);

  const tSpan = textEl
    .append('tspan')
    .attr('x', conf.padding)
    .text(member.displayText);

  if (member.cssStyle !== '') {
    tSpan.attr('style', member.cssStyle);
  }

  if (!isFirst) {
    tSpan.attr('dy', conf.textHeight);
  }
};

const parseGenericTypes = function(text) {
  let cleanedText = text;

  if (text.indexOf('~') != -1) {
    cleanedText = cleanedText.replace('~', '<');
    cleanedText = cleanedText.replace('~', '>');

    return parseGenericTypes(cleanedText);
  } else {
    return cleanedText;
  }
};

const parseClassifier = function(classifier) {
  switch (classifier) {
    case '*':
      return 'font-style:italic;';
    case '$':
      return 'text-decoration:underline;';
    default:
      return '';
  }
};

export default {
  drawClass,
  drawEdge,
  parseMember
};
