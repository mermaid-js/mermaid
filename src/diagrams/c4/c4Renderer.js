import { select } from 'd3';
import svgDraw, { drawText, fixLifeLineHeights } from './svgDraw';
import { log } from '../../logger';
import { parser } from './parser/c4Diagram';
import common from '../common/common';
import c4Db from './c4Db';
import * as configApi from '../../config';
import utils, {
  wrapLabel,
  calculateTextWidth,
  calculateTextHeight,
  assignWithDepth,
  configureSvgSize,
} from '../../utils';
import addSVGAccessibilityFields from '../../accessibility';

let globalBoundaryMaxX = 0,
  globalBoundaryMaxY = 0;

parser.yy = c4Db;

let conf = {};

class Bounds {
  constructor() {
    this.name = '';
    this.data = {};
    this.data.startx = undefined;
    this.data.stopx = undefined;
    this.data.starty = undefined;
    this.data.stopy = undefined;
    this.data.widthLimit = undefined;

    this.nextData = {};
    this.nextData.startx = undefined;
    this.nextData.stopx = undefined;
    this.nextData.starty = undefined;
    this.nextData.stopy = undefined;

    setConf(parser.yy.getConfig());
  }

  setData(startx, stopx, starty, stopy) {
    this.nextData.startx = this.data.startx = startx;
    this.nextData.stopx = this.data.stopx = stopx;
    this.nextData.starty = this.data.starty = starty;
    this.nextData.stopy = this.data.stopy = stopy;
  }

  updateVal(obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  }

  insert(c4Shape) {
    let _startx = this.nextData.stopx + c4Shape.margin * 2;
    let _stopx = _startx + c4Shape.width;
    let _starty = this.nextData.starty + c4Shape.margin * 2;
    let _stopy = _starty + c4Shape.height;
    if (_startx >= this.data.widthLimit || _stopx >= this.data.widthLimit) {
      _startx = this.nextData.startx + c4Shape.margin * 2 + conf.nextLinePaddingX;
      _starty = this.nextData.stopy + c4Shape.margin * 2;

      this.nextData.stopx = _stopx = _startx + c4Shape.width;
      this.nextData.starty = this.nextData.stopy;
      this.nextData.stopy = _stopy = _starty + c4Shape.height;
    }

    c4Shape.x = _startx;
    c4Shape.y = _starty;

    this.updateVal(this.data, 'startx', _startx, Math.min);
    this.updateVal(this.data, 'starty', _starty, Math.min);
    this.updateVal(this.data, 'stopx', _stopx, Math.max);
    this.updateVal(this.data, 'stopy', _stopy, Math.max);

    this.updateVal(this.nextData, 'startx', _startx, Math.min);
    this.updateVal(this.nextData, 'starty', _starty, Math.min);
    this.updateVal(this.nextData, 'stopx', _stopx, Math.max);
    this.updateVal(this.nextData, 'stopy', _stopy, Math.max);
  }

  init() {
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined,
      widthLimit: undefined,
    };
    setConf(parser.yy.getConfig());
  }

  bumpLastMargin(margin) {
    this.data.stopx += margin;
    this.data.stopy += margin;
  }
}

const personFont = (cnf) => {
  return {
    fontFamily: cnf.personFontFamily,
    fontSize: cnf.personFontSize,
    fontWeight: cnf.personFontWeight,
  };
};

const systemFont = (cnf) => {
  return {
    fontFamily: cnf.systemFontFamily,
    fontSize: cnf.systemFontSize,
    fontWeight: cnf.systemFontWeight,
  };
};

const boundaryFont = (cnf) => {
  return {
    fontFamily: cnf.boundaryFontFamily,
    fontSize: cnf.boundaryFontSize,
    fontWeight: cnf.boundaryFontWeight,
  };
};

const messageFont = (cnf) => {
  return {
    fontFamily: cnf.messageFontFamily,
    fontSize: cnf.messageFontSize,
    fontWeight: cnf.messageFontWeight,
  };
};

/**
 * @param textType
 * @param c4Shape
 * @param c4ShapeTextWrap
 * @param textConf
 * @param textLimitWidth
 */
function setC4ShapeText(textType, c4Shape, c4ShapeTextWrap, textConf, textLimitWidth) {
  if (!c4Shape[textType].width) {
    if (c4ShapeTextWrap) {
      c4Shape[textType].text = wrapLabel(c4Shape[textType].text, textLimitWidth, textConf);
      c4Shape[textType].labelLines = c4Shape[textType].text.split(common.lineBreakRegex).length;
      c4Shape[textType].width = textLimitWidth;
      c4Shape[textType].height = c4Shape[textType].labelLines * (textConf.fontSize + 2);
    } else {
      let lines = c4Shape[textType].text.split(common.lineBreakRegex);
      c4Shape[textType].labelLines = lines.length;
      let lineHeight = 0;
      c4Shape[textType].height = 0;
      c4Shape[textType].width = 0;
      for (let i = 0; i < lines.length; i++) {
        c4Shape[textType].width = Math.max(
          calculateTextWidth(lines[i], textConf),
          c4Shape[textType].width
        );
        lineHeight = calculateTextHeight(lines[i], textConf);
        c4Shape[textType].height = c4Shape[textType].height + lineHeight;
      }
      // c4Shapes[textType].height = c4Shapes[textType].labelLines * textConf.fontSize;
    }
  }
}

export const drawBoundary = function (diagram, boundary, bounds) {
  boundary.x = bounds.data.startx;
  boundary.y = bounds.data.starty;
  boundary.width = bounds.data.stopx - bounds.data.startx;
  boundary.height = bounds.data.stopy - bounds.data.starty;

  boundary.label.y = conf.c4ShapeMargin - 35;

  let boundaryTextWrap = boundary.wrap && conf.wrap;
  let boundaryLabelConf = boundaryFont(conf);
  boundaryLabelConf.fontSize = boundaryLabelConf.fontSize + 2;
  boundaryLabelConf.fontWeight = 'bold';
  let textLimitWidth = calculateTextWidth(boundary.label.text, boundaryLabelConf);
  setC4ShapeText('label', boundary, boundaryTextWrap, boundaryLabelConf, textLimitWidth);

  svgDraw.drawBoundary(diagram, boundary, conf);
};

export const drawPersonOrSystemArray = function (
  currentBounds,
  diagram,
  personOrSystemArray,
  personOrSystemKeys
) {
  // Draw the personOrSystemArray

  // let prevWidth = currentBounds.data.stopx;
  // let prevMarginX = conf.c4ShapeMargin;
  // let prevMarginY = conf.c4ShapeMargin;
  // let maxHeight = currentBounds.data.starty;

  for (let i = 0; i < personOrSystemKeys.length; i++) {
    const personOrSystem = personOrSystemArray[personOrSystemKeys[i]];

    let imageWidth = 0,
      imageHeight = 0;
    switch (personOrSystem.type) {
      case 'person':
      case 'external_person':
        imageWidth = 48;
        imageHeight = 48;
        break;
    }

    if (!personOrSystem.typeLabelWidth) {
      let personOrSystemTypeConf = personFont(conf);
      personOrSystemTypeConf.fontSize = personOrSystemTypeConf.fontSize - 2;
      personOrSystem.typeLabelWidth = calculateTextWidth(
        '<<' + personOrSystem.type + '>>',
        personOrSystemTypeConf
      );
      personOrSystem.typeLabelHeight = personOrSystemTypeConf.fontSize + 2;

      switch (personOrSystem.type) {
        case 'system_db':
        case 'external_system_db':
          personOrSystem.typeLabelY = conf.c4ShapePadding;
          break;
        default:
          personOrSystem.typeLabelY = conf.c4ShapePadding - 5;
          break;
      }
    }

    let personOrSystemTextWrap = personOrSystem.wrap && conf.wrap;
    let textLimitWidth = conf.width - conf.c4ShapePadding * 2;

    let personOrSystemLabelConf = personFont(conf);
    personOrSystemLabelConf.fontSize = personOrSystemLabelConf.fontSize + 2;
    personOrSystemLabelConf.fontWeight = 'bold';

    setC4ShapeText(
      'label',
      personOrSystem,
      personOrSystemTextWrap,
      personOrSystemLabelConf,
      textLimitWidth
    );
    personOrSystem['label'].Y =
      conf.c4ShapePadding + personOrSystem.typeLabelHeight + imageHeight + 10;

    let personOrSystemDescrConf = personFont(conf);
    setC4ShapeText(
      'descr',
      personOrSystem,
      personOrSystemTextWrap,
      personOrSystemDescrConf,
      textLimitWidth
    );
    personOrSystem['descr'].Y =
      conf.c4ShapePadding +
      personOrSystem.typeLabelHeight +
      imageHeight +
      5 +
      personOrSystem.label.height +
      conf.personFontSize +
      2;

    // Add some rendering data to the object
    let rectWidth =
      Math.max(personOrSystem.label.width, personOrSystem.descr.width) + conf.c4ShapePadding * 2;
    let rectHeight =
      conf.c4ShapePadding +
      personOrSystem.typeLabelHeight +
      imageHeight +
      personOrSystem.label.height +
      conf.personFontSize +
      2 +
      personOrSystem.descr.height;

    personOrSystem.width = Math.max(personOrSystem.width || conf.width, rectWidth, conf.width);
    personOrSystem.height = Math.max(personOrSystem.height || conf.height, rectHeight, conf.height);
    personOrSystem.margin = personOrSystem.margin || conf.c4ShapeMargin;

    currentBounds.insert(personOrSystem);

    const height = svgDraw.drawPersonOrSystem(diagram, personOrSystem, conf);
  }

  currentBounds.bumpLastMargin(conf.c4ShapeMargin);
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

/* * *
 * Get the intersection of the line between the center point of a rectangle and a point outside the rectangle.
 * Algorithm idea.
 * Using a point outside the rectangle as the coordinate origin, the graph is divided into four quadrants, and each quadrant is divided into two cases, with separate treatment on the coordinate axes
 * 1. The case of coordinate axes.
 * 1. The case of the negative x-axis
 * 2. The case of the positive x-axis
 * 3. The case of the positive y-axis
 * 4. The negative y-axis case
 * 2. Quadrant cases.
 * 2.1. first quadrant: the case where the line intersects the left side of the rectangle; the case where it intersects the lower side of the rectangle
 * 2.2. second quadrant: the case where the line intersects the right side of the rectangle; the case where it intersects the lower edge of the rectangle
 * 2.3. third quadrant: the case where the line intersects the right side of the rectangle; the case where it intersects the upper edge of the rectangle
 * 2.4. fourth quadrant: the case where the line intersects the left side of the rectangle; the case where it intersects the upper side of the rectangle
 *
 */
let getIntersectPoint = function (fromNode, endPoint) {
  let x1 = fromNode.x;

  let y1 = fromNode.y;

  let x2 = endPoint.x;

  let y2 = endPoint.y;

  let fromCenterX = x1 + fromNode.width / 2;

  let fromCenterY = y1 + fromNode.height / 2;

  let dx = Math.abs(x1 - x2);

  let dy = Math.abs(y1 - y2);

  let tanDYX = dy / dx;

  let fromDYX = fromNode.height / fromNode.width;

  let returnPoint = null;

  if (y1 == y2 && x1 < x2) {
    returnPoint = new Point(x1 + fromNode.width, fromCenterY);
  } else if (y1 == y2 && x1 > x2) {
    returnPoint = new Point(x1, fromCenterY);
  } else if (x1 == x2 && y1 < y2) {
    returnPoint = new Point(fromCenterX, y1 + fromNode.height);
  } else if (x1 == x2 && y1 > y2) {
    returnPoint = new Point(fromCenterX, y1);
  }

  if (x1 > x2 && y1 < y2) {
    if (fromDYX >= tanDYX) {
      returnPoint = new Point(x1, fromCenterY + (tanDYX * fromNode.width) / 2);
    } else {
      returnPoint = new Point(
        fromCenterX - ((dx / dy) * fromNode.height) / 2,
        y1 + fromNode.height
      );
    }
  } else if (x1 < x2 && y1 < y2) {
    //
    if (fromDYX >= tanDYX) {
      returnPoint = new Point(x1 + fromNode.width, fromCenterY + (tanDYX * fromNode.width) / 2);
    } else {
      returnPoint = new Point(
        fromCenterX + ((dx / dy) * fromNode.height) / 2,
        y1 + fromNode.height
      );
    }
  } else if (x1 < x2 && y1 > y2) {
    if (fromDYX >= tanDYX) {
      returnPoint = new Point(x1 + fromNode.width, fromCenterY - (tanDYX * fromNode.width) / 2);
    } else {
      returnPoint = new Point(fromCenterX + ((fromNode.height / 2) * dx) / dy, y1);
    }
  } else if (x1 > x2 && y1 > y2) {
    if (fromDYX >= tanDYX) {
      returnPoint = new Point(x1, fromCenterY - (fromNode.width / 2) * tanDYX);
    } else {
      returnPoint = new Point(fromCenterX - ((fromNode.height / 2) * dx) / dy, y1);
    }
  }
  return returnPoint;
};

let getIntersectPoints = function (fromNode, endNode) {
  let endIntersectPoint = { x: 0, y: 0 };
  endIntersectPoint.x = endNode.x + endNode.width / 2;
  endIntersectPoint.y = endNode.y + endNode.height / 2;
  let startPoint = getIntersectPoint(fromNode, endIntersectPoint);

  endIntersectPoint.x = fromNode.x + fromNode.width / 2;
  endIntersectPoint.y = fromNode.y + fromNode.height / 2;
  let endPoint = getIntersectPoint(endNode, endIntersectPoint);
  return { startPoint: startPoint, endPoint: endPoint };
};

export const drawRels = function (diagram, rels, getC4ShapeObj) {
  for (let rel of rels) {
    let relTextWrap = rel.wrap && conf.wrap;
    let relConf = messageFont(conf);
    let textLimitWidth = calculateTextWidth(rel.label.text, relConf);
    setC4ShapeText('label', rel, relTextWrap, relConf, textLimitWidth);

    if (rel.techn && rel.techn.text !== '') {
      textLimitWidth = calculateTextWidth(rel.techn.text, relConf);
      setC4ShapeText('techn', rel, relTextWrap, relConf, textLimitWidth);
    }

    if (rel.descr && rel.descr.text !== '') {
      textLimitWidth = calculateTextWidth(rel.descr.text, relConf);
      setC4ShapeText('descr', rel, relTextWrap, relConf, textLimitWidth);
    }

    let fromNode = getC4ShapeObj(rel.from);
    let endNode = getC4ShapeObj(rel.to);
    let points = getIntersectPoints(fromNode, endNode);
    rel.startPoint = points.startPoint;
    rel.endPoint = points.endPoint;
  }
  svgDraw.drawRels(diagram, rels, conf);
};

export const setConf = function (cnf) {
  assignWithDepth(conf, cnf);

  if (cnf.fontFamily) {
    conf.personFontFamily = conf.systemFontFamily = conf.messageFontFamily = cnf.fontFamily;
  }
  if (cnf.fontSize) {
    conf.personFontSize = conf.systemFontSize = conf.messageFontSize = cnf.fontSize;
  }
  if (cnf.fontWeight) {
    conf.personFontWeight = conf.systemFontWeight = conf.messageFontWeight = cnf.fontWeight;
  }
};

/**
 * @param diagram
 * @param parentBoundaryAlias
 * @param parentBounds
 * @param currentBoundarys
 */
function drawInsideBoundary(diagram, parentBoundaryAlias, parentBounds, currentBoundarys) {
  let currentBounds = new Bounds();
  // Calculate the width limit of the boundar.  label/type 的长度，
  currentBounds.data.widthLimit = Math.min(
    conf.width * conf.c4ShapeInRow + conf.c4ShapeMargin * (conf.c4ShapeInRow + 1),
    parentBounds.data.widthLimit / Math.min(conf.c4BoundaryInRow, currentBoundarys.length)
  );
  for (let i = 0; i < currentBoundarys.length; i++) {
    let currentBoundary = currentBoundarys[i];
    if (i == 0) {
      // Calculate the drawing start point of the currentBoundarys.
      let _x = parentBounds.data.startx + conf.diagramMarginX;
      let _y = parentBounds.data.stopy + conf.diagramMarginY;

      currentBounds.setData(_x, _x, _y, _y);
    } else {
      // Calculate the drawing start point of the currentBoundarys.
      let _x =
        currentBounds.data.stopx !== currentBounds.data.startx
          ? currentBounds.data.stopx + conf.diagramMarginX
          : currentBounds.data.startx;
      let _y = currentBounds.data.starty;

      currentBounds.setData(_x, _x, _y, _y);
    }
    currentBounds.name = currentBoundary.alias;
    let currentPersonOrSystemArray = parser.yy.getPersonOrSystemArray(currentBoundary.alias);
    let currentPersonOrSystemKeys = parser.yy.getPersonOrSystemKeys(currentBoundary.alias);

    if (currentPersonOrSystemKeys.length > 0) {
      drawPersonOrSystemArray(
        currentBounds,
        diagram,
        currentPersonOrSystemArray,
        currentPersonOrSystemKeys
      );
    }
    parentBoundaryAlias = currentBoundary.alias;
    let nextCurrentBoundarys = parser.yy.getBoundarys(parentBoundaryAlias);

    if (nextCurrentBoundarys.length > 0) {
      // draw boundary inside currentBoundary
      // bounds.init();
      // parentBoundaryWidthLimit = bounds.data.stopx - bounds.startx;
      drawInsideBoundary(diagram, parentBoundaryAlias, currentBounds, nextCurrentBoundarys);
    }
    // draw boundary
    if (currentBoundary.alias !== 'global') drawBoundary(diagram, currentBoundary, currentBounds);
    parentBounds.data.stopy = Math.max(
      currentBounds.data.stopy + conf.c4ShapeMargin,
      parentBounds.data.stopy
    );
    parentBounds.data.stopx = Math.max(
      currentBounds.data.stopx + conf.c4ShapeMargin,
      parentBounds.data.stopx
    );
    globalBoundaryMaxX = Math.max(globalBoundaryMaxX, parentBounds.data.stopx);
    globalBoundaryMaxY = Math.max(globalBoundaryMaxY, parentBounds.data.stopy);
  }
}

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 */
export const draw = function (text, id) {
  conf = configApi.getConfig().c4;
  const securityLevel = configApi.getConfig().securityLevel;
  // Handle root and ocument for when rendering in sanbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

  parser.yy.clear();
  parser.yy.setWrap(conf.wrap);
  parser.parse(text + '\n');

  log.debug(`C:${JSON.stringify(conf, null, 2)}`);

  const diagram =
    securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : select(`[id="${id}"]`);

  svgDraw.insertComputerIcon(diagram);
  svgDraw.insertDatabaseIcon(diagram);
  svgDraw.insertClockIcon(diagram);

  let screenBounds = new Bounds();
  screenBounds.setData(
    conf.diagramMarginX,
    conf.diagramMarginX,
    conf.diagramMarginY,
    conf.diagramMarginY
  );

  screenBounds.data.widthLimit = screen.availWidth;
  globalBoundaryMaxX = conf.diagramMarginX;
  globalBoundaryMaxY = conf.diagramMarginY;

  const title = parser.yy.getTitle();
  const c4type = parser.yy.getC4Type();
  let currentBoundarys = parser.yy.getBoundarys('');
  switch (c4type) {
    case 'C4Context':
      drawInsideBoundary(diagram, '', screenBounds, currentBoundarys);
      break;
  }

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram);
  svgDraw.insertArrowEnd(diagram);
  svgDraw.insertArrowCrossHead(diagram);
  svgDraw.insertArrowFilledHead(diagram);

  drawRels(diagram, parser.yy.getRels(), parser.yy.getPersonOrSystem);

  screenBounds.data.stopx = globalBoundaryMaxX;
  screenBounds.data.stopy = globalBoundaryMaxY;

  const box = screenBounds.data;

  // Make sure the height of the diagram supports long menus.
  let boxHeight = box.stopy - box.starty;

  let height = boxHeight + 2 * conf.diagramMarginY;

  // Make sure the width of the diagram supports wide menus.
  let boxWidth = box.stopx - box.startx;
  const width = boxWidth + 2 * conf.diagramMarginX;

  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', (box.stopx - box.startx) / 2 - 4 * conf.diagramMarginX)
      .attr('y', -25);
  }

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  const extraVertForTitle = title ? 60 : 0;
  diagram.attr(
    'viewBox',
    box.startx -
      conf.diagramMarginX +
      ' -' +
      (conf.diagramMarginY + extraVertForTitle) +
      ' ' +
      width +
      ' ' +
      (height + extraVertForTitle)
  );

  addSVGAccessibilityFields(parser.yy, diagram, id);
  log.debug(`models:`, box);
};

export default {
  drawPersonOrSystemArray,
  drawBoundary,
  setConf,
  draw,
};
