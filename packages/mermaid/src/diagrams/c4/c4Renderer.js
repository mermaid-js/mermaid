import { select } from 'd3';
import svgDraw from './svgDraw';
import { log } from '../../logger';
import { parser } from './parser/c4Diagram';
import common from '../common/common';
import c4Db from './c4Db';
import * as configApi from '../../config';
import assignWithDepth from '../../assignWithDepth';
import { wrapLabel, calculateTextWidth, calculateTextHeight } from '../../utils';
import { configureSvgSize } from '../../setupGraphViewbox';
import addSVGAccessibilityFields from '../../accessibility';

let globalBoundaryMaxX = 0,
  globalBoundaryMaxY = 0;

let c4ShapeInRow = 4;
let c4BoundaryInRow = 2;

parser.yy = c4Db;

let conf = {};

class Bounds {
  constructor(diagObj) {
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
    this.nextData.cnt = 0;

    setConf(diagObj.db.getConfig());
  }

  setData(startx, stopx, starty, stopy) {
    this.nextData.startx = this.data.startx = startx;
    this.nextData.stopx = this.data.stopx = stopx;
    this.nextData.starty = this.data.starty = starty;
    this.nextData.stopy = this.data.stopy = stopy;
  }

  updateVal(obj, key, val, fun) {
    if (obj[key] === undefined) {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  }

  insert(c4Shape) {
    this.nextData.cnt = this.nextData.cnt + 1;
    let _startx =
      this.nextData.startx === this.nextData.stopx
        ? this.nextData.stopx + c4Shape.margin
        : this.nextData.stopx + c4Shape.margin * 2;
    let _stopx = _startx + c4Shape.width;
    let _starty = this.nextData.starty + c4Shape.margin * 2;
    let _stopy = _starty + c4Shape.height;
    if (
      _startx >= this.data.widthLimit ||
      _stopx >= this.data.widthLimit ||
      this.nextData.cnt > c4ShapeInRow
    ) {
      _startx = this.nextData.startx + c4Shape.margin + conf.nextLinePaddingX;
      _starty = this.nextData.stopy + c4Shape.margin * 2;

      this.nextData.stopx = _stopx = _startx + c4Shape.width;
      this.nextData.starty = this.nextData.stopy;
      this.nextData.stopy = _stopy = _starty + c4Shape.height;
      this.nextData.cnt = 1;
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

  init(diagObj) {
    this.name = '';
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined,
      widthLimit: undefined,
    };
    this.nextData = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined,
      cnt: 0,
    };
    setConf(diagObj.db.getConfig());
  }

  bumpLastMargin(margin) {
    this.data.stopx += margin;
    this.data.stopy += margin;
  }
}

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

const c4ShapeFont = (cnf, typeC4Shape) => {
  return {
    fontFamily: cnf[typeC4Shape + 'FontFamily'],
    fontSize: cnf[typeC4Shape + 'FontSize'],
    fontWeight: cnf[typeC4Shape + 'FontWeight'],
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
function calcC4ShapeTextWH(textType, c4Shape, c4ShapeTextWrap, textConf, textLimitWidth) {
  if (!c4Shape[textType].width) {
    if (c4ShapeTextWrap) {
      c4Shape[textType].text = wrapLabel(c4Shape[textType].text, textLimitWidth, textConf);
      c4Shape[textType].textLines = c4Shape[textType].text.split(common.lineBreakRegex).length;
      // c4Shape[textType].width = calculateTextWidth(c4Shape[textType].text, textConf);
      c4Shape[textType].width = textLimitWidth;
      // c4Shape[textType].height = c4Shape[textType].textLines * textConf.fontSize;
      c4Shape[textType].height = calculateTextHeight(c4Shape[textType].text, textConf);
    } else {
      let lines = c4Shape[textType].text.split(common.lineBreakRegex);
      c4Shape[textType].textLines = lines.length;
      let lineHeight = 0;
      c4Shape[textType].height = 0;
      c4Shape[textType].width = 0;
      for (const line of lines) {
        c4Shape[textType].width = Math.max(
          calculateTextWidth(line, textConf),
          c4Shape[textType].width
        );
        lineHeight = calculateTextHeight(line, textConf);
        c4Shape[textType].height = c4Shape[textType].height + lineHeight;
      }
      // c4Shapes[textType].height = c4Shapes[textType].textLines * textConf.fontSize;
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
  calcC4ShapeTextWH('label', boundary, boundaryTextWrap, boundaryLabelConf, textLimitWidth);

  svgDraw.drawBoundary(diagram, boundary, conf);
};

export const drawC4ShapeArray = function (currentBounds, diagram, c4ShapeArray, c4ShapeKeys) {
  // Upper Y is relative point
  let Y = 0;
  // Draw the c4ShapeArray
  for (const c4ShapeKey of c4ShapeKeys) {
    Y = 0;
    const c4Shape = c4ShapeArray[c4ShapeKey];

    // calc c4 shape type width and height

    let c4ShapeTypeConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
    c4ShapeTypeConf.fontSize = c4ShapeTypeConf.fontSize - 2;
    c4Shape.typeC4Shape.width = calculateTextWidth(
      '<<' + c4Shape.typeC4Shape.text + '>>',
      c4ShapeTypeConf
    );
    c4Shape.typeC4Shape.height = c4ShapeTypeConf.fontSize + 2;
    c4Shape.typeC4Shape.Y = conf.c4ShapePadding;
    Y = c4Shape.typeC4Shape.Y + c4Shape.typeC4Shape.height - 4;

    // set image width and height c4Shape.x + c4Shape.width / 2 - 24, c4Shape.y + 28
    // let imageWidth = 0,
    //   imageHeight = 0,
    //   imageY = 0;
    //
    c4Shape.image = { width: 0, height: 0, Y: 0 };
    switch (c4Shape.typeC4Shape.text) {
      case 'person':
      case 'external_person':
        c4Shape.image.width = 48;
        c4Shape.image.height = 48;
        c4Shape.image.Y = Y;
        Y = c4Shape.image.Y + c4Shape.image.height;
        break;
    }
    if (c4Shape.sprite) {
      c4Shape.image.width = 48;
      c4Shape.image.height = 48;
      c4Shape.image.Y = Y;
      Y = c4Shape.image.Y + c4Shape.image.height;
    }

    // Y = conf.c4ShapePadding + c4Shape.image.height;

    let c4ShapeTextWrap = c4Shape.wrap && conf.wrap;
    let textLimitWidth = conf.width - conf.c4ShapePadding * 2;

    let c4ShapeLabelConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
    c4ShapeLabelConf.fontSize = c4ShapeLabelConf.fontSize + 2;
    c4ShapeLabelConf.fontWeight = 'bold';
    calcC4ShapeTextWH('label', c4Shape, c4ShapeTextWrap, c4ShapeLabelConf, textLimitWidth);
    c4Shape['label'].Y = Y + 8;
    Y = c4Shape['label'].Y + c4Shape['label'].height;

    if (c4Shape.type && c4Shape.type.text !== '') {
      c4Shape.type.text = '[' + c4Shape.type.text + ']';
      let c4ShapeTypeConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
      calcC4ShapeTextWH('type', c4Shape, c4ShapeTextWrap, c4ShapeTypeConf, textLimitWidth);
      c4Shape['type'].Y = Y + 5;
      Y = c4Shape['type'].Y + c4Shape['type'].height;
    } else if (c4Shape.techn && c4Shape.techn.text !== '') {
      c4Shape.techn.text = '[' + c4Shape.techn.text + ']';
      let c4ShapeTechnConf = c4ShapeFont(conf, c4Shape.techn.text);
      calcC4ShapeTextWH('techn', c4Shape, c4ShapeTextWrap, c4ShapeTechnConf, textLimitWidth);
      c4Shape['techn'].Y = Y + 5;
      Y = c4Shape['techn'].Y + c4Shape['techn'].height;
    }

    let rectHeight = Y;
    let rectWidth = c4Shape.label.width;

    if (c4Shape.descr && c4Shape.descr.text !== '') {
      let c4ShapeDescrConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
      calcC4ShapeTextWH('descr', c4Shape, c4ShapeTextWrap, c4ShapeDescrConf, textLimitWidth);
      c4Shape['descr'].Y = Y + 20;
      Y = c4Shape['descr'].Y + c4Shape['descr'].height;

      rectWidth = Math.max(c4Shape.label.width, c4Shape.descr.width);
      rectHeight = Y - c4Shape['descr'].textLines * 5;
    }

    rectWidth = rectWidth + conf.c4ShapePadding;
    // let rectHeight =

    c4Shape.width = Math.max(c4Shape.width || conf.width, rectWidth, conf.width);
    c4Shape.height = Math.max(c4Shape.height || conf.height, rectHeight, conf.height);
    c4Shape.margin = c4Shape.margin || conf.c4ShapeMargin;

    currentBounds.insert(c4Shape);

    svgDraw.drawC4Shape(diagram, c4Shape, conf);
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

export const drawRels = function (diagram, rels, getC4ShapeObj, diagObj) {
  let i = 0;
  for (let rel of rels) {
    i = i + 1;
    let relTextWrap = rel.wrap && conf.wrap;
    let relConf = messageFont(conf);
    let diagramType = diagObj.db.getC4Type();
    if (diagramType === 'C4Dynamic') {
      rel.label.text = i + ': ' + rel.label.text;
    }
    let textLimitWidth = calculateTextWidth(rel.label.text, relConf);
    calcC4ShapeTextWH('label', rel, relTextWrap, relConf, textLimitWidth);

    if (rel.techn && rel.techn.text !== '') {
      textLimitWidth = calculateTextWidth(rel.techn.text, relConf);
      calcC4ShapeTextWH('techn', rel, relTextWrap, relConf, textLimitWidth);
    }

    if (rel.descr && rel.descr.text !== '') {
      textLimitWidth = calculateTextWidth(rel.descr.text, relConf);
      calcC4ShapeTextWH('descr', rel, relTextWrap, relConf, textLimitWidth);
    }

    let fromNode = getC4ShapeObj(rel.from);
    let endNode = getC4ShapeObj(rel.to);
    let points = getIntersectPoints(fromNode, endNode);
    rel.startPoint = points.startPoint;
    rel.endPoint = points.endPoint;
  }
  svgDraw.drawRels(diagram, rels, conf);
};

/**
 * @param diagram
 * @param parentBoundaryAlias
 * @param parentBounds
 * @param currentBoundaries
 * @param diagObj
 */
function drawInsideBoundary(
  diagram,
  parentBoundaryAlias,
  parentBounds,
  currentBoundaries,
  diagObj
) {
  let currentBounds = new Bounds(diagObj);
  // Calculate the width limit of the boundary.  label/type 的长度，
  currentBounds.data.widthLimit =
    parentBounds.data.widthLimit / Math.min(c4BoundaryInRow, currentBoundaries.length);
  // Math.min(
  //   conf.width * conf.c4ShapeInRow + conf.c4ShapeMargin * conf.c4ShapeInRow * 2,
  //   parentBounds.data.widthLimit / Math.min(conf.c4BoundaryInRow, currentBoundaries.length)
  // );
  for (let [i, currentBoundary] of currentBoundaries.entries()) {
    let Y = 0;
    currentBoundary.image = { width: 0, height: 0, Y: 0 };
    if (currentBoundary.sprite) {
      currentBoundary.image.width = 48;
      currentBoundary.image.height = 48;
      currentBoundary.image.Y = Y;
      Y = currentBoundary.image.Y + currentBoundary.image.height;
    }

    let currentBoundaryTextWrap = currentBoundary.wrap && conf.wrap;

    let currentBoundaryLabelConf = boundaryFont(conf);
    currentBoundaryLabelConf.fontSize = currentBoundaryLabelConf.fontSize + 2;
    currentBoundaryLabelConf.fontWeight = 'bold';
    calcC4ShapeTextWH(
      'label',
      currentBoundary,
      currentBoundaryTextWrap,
      currentBoundaryLabelConf,
      currentBounds.data.widthLimit
    );
    currentBoundary['label'].Y = Y + 8;
    Y = currentBoundary['label'].Y + currentBoundary['label'].height;

    if (currentBoundary.type && currentBoundary.type.text !== '') {
      currentBoundary.type.text = '[' + currentBoundary.type.text + ']';
      let currentBoundaryTypeConf = boundaryFont(conf);
      calcC4ShapeTextWH(
        'type',
        currentBoundary,
        currentBoundaryTextWrap,
        currentBoundaryTypeConf,
        currentBounds.data.widthLimit
      );
      currentBoundary['type'].Y = Y + 5;
      Y = currentBoundary['type'].Y + currentBoundary['type'].height;
    }

    if (currentBoundary.descr && currentBoundary.descr.text !== '') {
      let currentBoundaryDescrConf = boundaryFont(conf);
      currentBoundaryDescrConf.fontSize = currentBoundaryDescrConf.fontSize - 2;
      calcC4ShapeTextWH(
        'descr',
        currentBoundary,
        currentBoundaryTextWrap,
        currentBoundaryDescrConf,
        currentBounds.data.widthLimit
      );
      currentBoundary['descr'].Y = Y + 20;
      Y = currentBoundary['descr'].Y + currentBoundary['descr'].height;
    }

    if (i == 0 || i % c4BoundaryInRow === 0) {
      // Calculate the drawing start point of the currentBoundaries.
      let _x = parentBounds.data.startx + conf.diagramMarginX;
      let _y = parentBounds.data.stopy + conf.diagramMarginY + Y;

      currentBounds.setData(_x, _x, _y, _y);
    } else {
      // Calculate the drawing start point of the currentBoundaries.
      let _x =
        currentBounds.data.stopx !== currentBounds.data.startx
          ? currentBounds.data.stopx + conf.diagramMarginX
          : currentBounds.data.startx;
      let _y = currentBounds.data.starty;

      currentBounds.setData(_x, _x, _y, _y);
    }
    currentBounds.name = currentBoundary.alias;
    let currentPersonOrSystemArray = diagObj.db.getC4ShapeArray(currentBoundary.alias);
    let currentPersonOrSystemKeys = diagObj.db.getC4ShapeKeys(currentBoundary.alias);

    if (currentPersonOrSystemKeys.length > 0) {
      drawC4ShapeArray(
        currentBounds,
        diagram,
        currentPersonOrSystemArray,
        currentPersonOrSystemKeys
      );
    }
    parentBoundaryAlias = currentBoundary.alias;
    let nextCurrentBoundarys = diagObj.db.getBoundarys(parentBoundaryAlias);

    if (nextCurrentBoundarys.length > 0) {
      // draw boundary inside currentBoundary
      drawInsideBoundary(
        diagram,
        parentBoundaryAlias,
        currentBounds,
        nextCurrentBoundarys,
        diagObj
      );
    }
    // draw boundary
    if (currentBoundary.alias !== 'global') {
      drawBoundary(diagram, currentBoundary, currentBounds);
    }
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
 * @param {any} _text
 * @param {any} id
 * @param {any} _version
 * @param diagObj
 */
export const draw = function (_text, id, _version, diagObj) {
  conf = configApi.getConfig().c4;
  const securityLevel = configApi.getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  let db = diagObj.db;

  diagObj.db.setWrap(conf.wrap);

  c4ShapeInRow = db.getC4ShapeInRow();
  c4BoundaryInRow = db.getC4BoundaryInRow();

  log.debug(`C:${JSON.stringify(conf, null, 2)}`);

  const diagram =
    securityLevel === 'sandbox' ? root.select(`[id="${id}"]`) : select(`[id="${id}"]`);

  svgDraw.insertComputerIcon(diagram);
  svgDraw.insertDatabaseIcon(diagram);
  svgDraw.insertClockIcon(diagram);

  let screenBounds = new Bounds(diagObj);

  screenBounds.setData(
    conf.diagramMarginX,
    conf.diagramMarginX,
    conf.diagramMarginY,
    conf.diagramMarginY
  );

  screenBounds.data.widthLimit = screen.availWidth;
  globalBoundaryMaxX = conf.diagramMarginX;
  globalBoundaryMaxY = conf.diagramMarginY;

  const title = diagObj.db.getTitle();
  let currentBoundaries = diagObj.db.getBoundarys('');
  // switch (c4type) {
  //   case 'C4Context':
  drawInsideBoundary(diagram, '', screenBounds, currentBoundaries, diagObj);
  //     break;
  // }

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram);
  svgDraw.insertArrowEnd(diagram);
  svgDraw.insertArrowCrossHead(diagram);
  svgDraw.insertArrowFilledHead(diagram);

  drawRels(diagram, diagObj.db.getRels(), diagObj.db.getC4Shape, diagObj);

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
      .attr('y', box.starty + conf.diagramMarginY);
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
  drawPersonOrSystemArray: drawC4ShapeArray,
  drawBoundary,
  setConf,
  draw,
};
