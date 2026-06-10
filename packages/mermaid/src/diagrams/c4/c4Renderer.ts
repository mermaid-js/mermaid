import svgDraw from './svgDraw.js';
import { log } from '../../logger.js';
// @ts-ignore: JISON doesn't support types
import { parser } from './parser/c4Diagram.jison';
import common from '../common/common.js';
import c4Db from './c4Db.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getRequiredConfig } from '../../diagram-api/requiredConfig.js';
import assignWithDepth from '../../assignWithDepth.js';
import { wrapLabel, calculateTextWidth, calculateTextHeight } from '../../utils.js';
import { getDiagramRoot } from '../../utils/diagramRoot.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import type { Diagram } from '../../Diagram.js';
import type { C4DiagramConfig } from '../../config.type.js';
import type { SVG } from '../../diagram-api/types.js';
import type { TextDimensionConfig } from '../../types.js';
import type { C4Boundary, C4DrawConfig, C4Font, C4Rel, C4Shape, C4Text } from './c4Types.js';

type C4DB = typeof c4Db;

/** The config passed to {@link setConf} may carry the global font settings. */
type C4SetConfigParam = C4DiagramConfig & {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
};

interface BoundsData {
  startx?: number;
  stopx?: number;
  starty?: number;
  stopy?: number;
  widthLimit?: number;
}

interface NextBoundsData {
  startx?: number;
  stopx?: number;
  starty?: number;
  stopy?: number;
  cnt: number;
}

/** A {@link C4Text} after measurement: the layout fields are populated. */
type MeasuredC4Text = C4Text & { width: number; height: number; textLines: number };

let globalBoundaryMaxX = 0,
  globalBoundaryMaxY = 0;

let c4ShapeInRow = 4;
let c4BoundaryInRow = 2;

parser.yy = c4Db;

let conf = {} as C4DrawConfig;

class Bounds {
  name: string;
  data: BoundsData;
  nextData: NextBoundsData;

  constructor(diagObj: Diagram) {
    this.name = '';
    this.data = {};
    this.data.startx = undefined;
    this.data.stopx = undefined;
    this.data.starty = undefined;
    this.data.stopy = undefined;
    this.data.widthLimit = undefined;

    this.nextData = {} as NextBoundsData;
    this.nextData.startx = undefined;
    this.nextData.stopx = undefined;
    this.nextData.starty = undefined;
    this.nextData.stopy = undefined;
    this.nextData.cnt = 0;

    setConf((diagObj.db as C4DB).getConfig());
  }

  setData(startx: number, stopx: number, starty: number, stopy: number) {
    this.nextData.startx = this.data.startx = startx;
    this.nextData.stopx = this.data.stopx = stopx;
    this.nextData.starty = this.data.starty = starty;
    this.nextData.stopy = this.data.stopy = stopy;
  }

  updateVal(
    obj: BoundsData | NextBoundsData,
    key: 'startx' | 'stopx' | 'starty' | 'stopy',
    val: number,
    fun: (a: number, b: number) => number
  ) {
    if (obj[key] === undefined) {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  }

  insert(c4Shape: C4Shape) {
    this.nextData.cnt = this.nextData.cnt + 1;
    // `setData()` seeds the bounds before any `insert()` call.
    const nextStopx = this.nextData.stopx!;
    const widthLimit = this.data.widthLimit!;
    let _startx =
      this.nextData.startx === this.nextData.stopx
        ? nextStopx + c4Shape.margin
        : nextStopx + c4Shape.margin * 2;
    let _stopx = _startx + c4Shape.width;
    let _starty = this.nextData.starty! + c4Shape.margin * 2;
    let _stopy = _starty + c4Shape.height;
    if (_startx >= widthLimit || _stopx >= widthLimit || this.nextData.cnt > c4ShapeInRow) {
      _startx = this.nextData.startx! + c4Shape.margin + conf.nextLinePaddingX;
      _starty = this.nextData.stopy! + c4Shape.margin * 2;

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

  init(diagObj: Diagram) {
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
    setConf((diagObj.db as C4DB).getConfig());
  }

  bumpLastMargin(margin: number) {
    this.data.stopx! += margin;
    this.data.stopy! += margin;
  }
}

export const setConf = function (cnf?: C4SetConfigParam) {
  assignWithDepth(conf, cnf);

  if (cnf?.fontFamily) {
    conf.personFontFamily = conf.systemFontFamily = conf.messageFontFamily = cnf.fontFamily;
  }
  if (cnf?.fontSize) {
    conf.personFontSize = conf.systemFontSize = conf.messageFontSize = cnf.fontSize;
  }
  if (cnf?.fontWeight) {
    conf.personFontWeight = conf.systemFontWeight = conf.messageFontWeight = cnf.fontWeight;
  }
};

const c4ShapeFont = (cnf: C4DrawConfig, typeC4Shape: string): C4Font => {
  return {
    fontFamily: cnf[typeC4Shape + 'FontFamily'] as string,
    fontSize: cnf[typeC4Shape + 'FontSize'] as number,
    fontWeight: cnf[typeC4Shape + 'FontWeight'] as string | number,
  };
};

const boundaryFont = (cnf: C4DrawConfig): C4Font => {
  return {
    fontFamily: cnf.boundaryFontFamily,
    fontSize: cnf.boundaryFontSize as number,
    fontWeight: cnf.boundaryFontWeight,
  };
};

const messageFont = (cnf: C4DrawConfig): C4Font => {
  return {
    fontFamily: cnf.messageFontFamily,
    fontSize: cnf.messageFontSize as number,
    fontWeight: cnf.messageFontWeight,
  };
};

function calcC4ShapeTextWH(
  textType: 'label' | 'type' | 'techn' | 'descr',
  c4Shape: C4Shape | C4Boundary | C4Rel,
  c4ShapeTextWrap: boolean | undefined,
  textConf: C4Font,
  textLimitWidth: number
): MeasuredC4Text {
  // `textType` is always one of the `C4Text` valued fields of `c4Shape`, and
  // the layout fields are populated below (or by an earlier measurement).
  const textElement = c4Shape[textType] as MeasuredC4Text;
  if (!textElement.width) {
    if (c4ShapeTextWrap) {
      textElement.text = wrapLabel(
        textElement.text,
        textLimitWidth,
        textConf as Parameters<typeof wrapLabel>[2]
      );
      textElement.textLines = textElement.text.split(common.lineBreakRegex).length;
      // textElement.width = calculateTextWidth(textElement.text, textConf);
      textElement.width = textLimitWidth;
      // textElement.height = textElement.textLines * textConf.fontSize;
      textElement.height = calculateTextHeight(textElement.text, textConf as TextDimensionConfig);
    } else {
      const lines = textElement.text.split(common.lineBreakRegex);
      textElement.textLines = lines.length;
      let lineHeight = 0;
      textElement.height = 0;
      textElement.width = 0;
      for (const line of lines) {
        textElement.width = Math.max(
          calculateTextWidth(line, textConf as TextDimensionConfig),
          textElement.width
        );
        lineHeight = calculateTextHeight(line, textConf as TextDimensionConfig);
        textElement.height = textElement.height + lineHeight;
      }
      // c4Shapes[textType].height = c4Shapes[textType].textLines * textConf.fontSize;
    }
  }
  return textElement;
}

export const drawBoundary = function (diagram: SVG, boundary: C4Boundary, bounds: Bounds) {
  // The bounds are seeded via `setData()` before a boundary is drawn.
  const startx = bounds.data.startx!;
  const starty = bounds.data.starty!;
  boundary.x = startx;
  boundary.y = starty;
  boundary.width = bounds.data.stopx! - startx;
  boundary.height = bounds.data.stopy! - starty;

  boundary.label.y = conf.c4ShapeMargin - 35;

  const boundaryTextWrap = boundary.wrap && conf.wrap;
  const boundaryLabelConf = boundaryFont(conf);
  boundaryLabelConf.fontSize = boundaryLabelConf.fontSize + 2;
  boundaryLabelConf.fontWeight = 'bold';
  const textLimitWidth = calculateTextWidth(
    boundary.label.text,
    boundaryLabelConf as TextDimensionConfig
  );
  calcC4ShapeTextWH('label', boundary, boundaryTextWrap, boundaryLabelConf, textLimitWidth);

  svgDraw.drawBoundary(diagram, boundary, conf);
};

export const drawC4ShapeArray = function (
  currentBounds: Bounds,
  diagram: SVG,
  c4ShapeArray: C4Shape[],
  c4ShapeKeys: string[]
) {
  // Upper Y is relative point
  let Y = 0;
  // Draw the c4ShapeArray
  for (const c4ShapeKey of c4ShapeKeys) {
    Y = 0;
    // `c4ShapeKeys` are the (numeric string) indices of `c4ShapeArray`.
    const c4Shape = c4ShapeArray[Number(c4ShapeKey)];

    // calc c4 shape type width and height

    const c4ShapeTypeConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
    c4ShapeTypeConf.fontSize = c4ShapeTypeConf.fontSize - 2;
    c4Shape.typeC4Shape.width = calculateTextWidth(
      '«' + c4Shape.typeC4Shape.text + '»',
      c4ShapeTypeConf as TextDimensionConfig
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

    const c4ShapeTextWrap = c4Shape.wrap && conf.wrap;
    const textLimitWidth = conf.width - conf.c4ShapePadding * 2;

    const c4ShapeLabelConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
    c4ShapeLabelConf.fontSize = c4ShapeLabelConf.fontSize + 2;
    c4ShapeLabelConf.fontWeight = 'bold';
    const label = calcC4ShapeTextWH(
      'label',
      c4Shape,
      c4ShapeTextWrap,
      c4ShapeLabelConf,
      textLimitWidth
    );
    label.Y = Y + 8;
    Y = label.Y + label.height;

    if (c4Shape.type && c4Shape.type.text !== '') {
      c4Shape.type.text = '[' + c4Shape.type.text + ']';
      const c4ShapeTypeConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
      const type = calcC4ShapeTextWH(
        'type',
        c4Shape,
        c4ShapeTextWrap,
        c4ShapeTypeConf,
        textLimitWidth
      );
      type.Y = Y + 5;
      Y = type.Y + type.height;
    } else if (c4Shape.techn && c4Shape.techn.text !== '') {
      c4Shape.techn.text = '[' + c4Shape.techn.text + ']';
      const c4ShapeTechnConf = c4ShapeFont(conf, c4Shape.techn.text);
      const techn = calcC4ShapeTextWH(
        'techn',
        c4Shape,
        c4ShapeTextWrap,
        c4ShapeTechnConf,
        textLimitWidth
      );
      techn.Y = Y + 5;
      Y = techn.Y + techn.height;
    }

    let rectHeight = Y;
    let rectWidth = label.width;

    if (c4Shape.descr && c4Shape.descr.text !== '') {
      const c4ShapeDescrConf = c4ShapeFont(conf, c4Shape.typeC4Shape.text);
      const descr = calcC4ShapeTextWH(
        'descr',
        c4Shape,
        c4ShapeTextWrap,
        c4ShapeDescrConf,
        textLimitWidth
      );
      descr.Y = Y + 20;
      Y = descr.Y + descr.height;

      rectWidth = Math.max(label.width, descr.width);
      rectHeight = Y - descr.textLines * 5;
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
  x: number;
  y: number;

  constructor(x: number, y: number) {
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
const getIntersectPoint = function (fromNode: C4Shape, endPoint: Point): Point | null {
  const x1 = fromNode.x;

  const y1 = fromNode.y;

  const x2 = endPoint.x;

  const y2 = endPoint.y;

  const fromCenterX = x1 + fromNode.width / 2;

  const fromCenterY = y1 + fromNode.height / 2;

  const dx = Math.abs(x1 - x2);

  const dy = Math.abs(y1 - y2);

  const tanDYX = dy / dx;

  const fromDYX = fromNode.height / fromNode.width;

  let returnPoint: Point | null = null;

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

const getIntersectPoints = function (fromNode: C4Shape, endNode: C4Shape) {
  const endIntersectPoint = { x: 0, y: 0 };
  endIntersectPoint.x = endNode.x + endNode.width / 2;
  endIntersectPoint.y = endNode.y + endNode.height / 2;
  const startPoint = getIntersectPoint(fromNode, endIntersectPoint);

  endIntersectPoint.x = fromNode.x + fromNode.width / 2;
  endIntersectPoint.y = fromNode.y + fromNode.height / 2;
  const endPoint = getIntersectPoint(endNode, endIntersectPoint);
  return { startPoint: startPoint, endPoint: endPoint };
};

export const drawRels = function (
  diagram: SVG,
  rels: C4Rel[],
  getC4ShapeObj: (alias: string) => C4Shape | undefined,
  diagObj: Diagram,
  diagramId: string
) {
  const diagramType = (diagObj.db as C4DB).getC4Type();
  let i = 0;
  for (const rel of rels) {
    i = i + 1;
    const relTextWrap = rel.wrap && conf.wrap;
    const relConf = messageFont(conf);
    if (diagramType === 'C4Dynamic') {
      rel.label.text = i + ': ' + rel.label.text;
    }
    let textLimitWidth = calculateTextWidth(rel.label.text, relConf as TextDimensionConfig);
    calcC4ShapeTextWH('label', rel, relTextWrap, relConf, textLimitWidth);

    if (rel.techn && rel.techn.text !== '') {
      textLimitWidth = calculateTextWidth(rel.techn.text, relConf as TextDimensionConfig);
      calcC4ShapeTextWH('techn', rel, relTextWrap, relConf, textLimitWidth);
    }

    if (rel.descr && rel.descr.text !== '') {
      textLimitWidth = calculateTextWidth(rel.descr.text, relConf as TextDimensionConfig);
      calcC4ShapeTextWH('descr', rel, relTextWrap, relConf, textLimitWidth);
    }

    const fromNode = getC4ShapeObj(rel.from);
    const endNode = getC4ShapeObj(rel.to);
    if (!fromNode || !endNode) {
      throw new Error(`C4 rel "${rel.from}" -> "${rel.to}" references an unknown shape`);
    }
    const points = getIntersectPoints(fromNode, endNode);
    if (!points.startPoint || !points.endPoint) {
      throw new Error(
        `Could not calculate intersection points for rel "${rel.from}" -> "${rel.to}"`
      );
    }
    rel.startPoint = points.startPoint;
    rel.endPoint = points.endPoint;
  }
  svgDraw.drawRels(diagram, rels, conf, diagramId);
};

function drawInsideBoundary(
  diagram: SVG,
  parentBoundaryAlias: string,
  parentBounds: Bounds,
  currentBoundaries: C4Boundary[],
  diagObj: Diagram
) {
  const db = diagObj.db as C4DB;
  const currentBounds = new Bounds(diagObj);
  // Calculate the width limit of the boundary.  label/type 的长度，
  currentBounds.data.widthLimit =
    parentBounds.data.widthLimit! / Math.min(c4BoundaryInRow, currentBoundaries.length);
  // Math.min(
  //   conf.width * conf.c4ShapeInRow + conf.c4ShapeMargin * conf.c4ShapeInRow * 2,
  //   parentBounds.data.widthLimit / Math.min(conf.c4BoundaryInRow, currentBoundaries.length)
  // );
  for (const [i, currentBoundary] of currentBoundaries.entries()) {
    let Y = 0;
    currentBoundary.image = { width: 0, height: 0, Y: 0 };
    if (currentBoundary.sprite) {
      currentBoundary.image.width = 48;
      currentBoundary.image.height = 48;
      currentBoundary.image.Y = Y;
      Y = currentBoundary.image.Y + currentBoundary.image.height;
    }

    const currentBoundaryTextWrap = currentBoundary.wrap && conf.wrap;

    const currentBoundaryLabelConf = boundaryFont(conf);
    currentBoundaryLabelConf.fontSize = currentBoundaryLabelConf.fontSize + 2;
    currentBoundaryLabelConf.fontWeight = 'bold';
    const label = calcC4ShapeTextWH(
      'label',
      currentBoundary,
      currentBoundaryTextWrap,
      currentBoundaryLabelConf,
      currentBounds.data.widthLimit
    );
    label.Y = Y + 8;
    Y = label.Y + label.height;

    if (currentBoundary.type && currentBoundary.type.text !== '') {
      currentBoundary.type.text = '[' + currentBoundary.type.text + ']';
      const currentBoundaryTypeConf = boundaryFont(conf);
      const type = calcC4ShapeTextWH(
        'type',
        currentBoundary,
        currentBoundaryTextWrap,
        currentBoundaryTypeConf,
        currentBounds.data.widthLimit
      );
      type.Y = Y + 5;
      Y = type.Y + type.height;
    }

    if (currentBoundary.descr && currentBoundary.descr.text !== '') {
      const currentBoundaryDescrConf = boundaryFont(conf);
      currentBoundaryDescrConf.fontSize = currentBoundaryDescrConf.fontSize - 2;
      const descr = calcC4ShapeTextWH(
        'descr',
        currentBoundary,
        currentBoundaryTextWrap,
        currentBoundaryDescrConf,
        currentBounds.data.widthLimit
      );
      descr.Y = Y + 20;
      Y = descr.Y + descr.height;
    }

    if (i == 0 || i % c4BoundaryInRow === 0) {
      // Calculate the drawing start point of the currentBoundaries.
      const _x = parentBounds.data.startx! + conf.diagramMarginX;
      const _y = parentBounds.data.stopy! + conf.diagramMarginY + Y;

      currentBounds.setData(_x, _x, _y, _y);
    } else {
      // Calculate the drawing start point of the currentBoundaries.
      const _x =
        currentBounds.data.stopx !== currentBounds.data.startx
          ? currentBounds.data.stopx! + conf.diagramMarginX
          : currentBounds.data.startx!;
      const _y = currentBounds.data.starty!;

      currentBounds.setData(_x, _x, _y, _y);
    }
    currentBounds.name = currentBoundary.alias;
    const currentPersonOrSystemArray = db.getC4ShapeArray(currentBoundary.alias);
    const currentPersonOrSystemKeys = db.getC4ShapeKeys(currentBoundary.alias);

    if (currentPersonOrSystemKeys.length > 0) {
      drawC4ShapeArray(
        currentBounds,
        diagram,
        currentPersonOrSystemArray,
        currentPersonOrSystemKeys
      );
    }
    parentBoundaryAlias = currentBoundary.alias;
    const nextCurrentBoundaries = db.getBoundaries(parentBoundaryAlias);

    if (nextCurrentBoundaries.length > 0) {
      // draw boundary inside currentBoundary
      drawInsideBoundary(
        diagram,
        parentBoundaryAlias,
        currentBounds,
        nextCurrentBoundaries,
        diagObj
      );
    }
    // draw boundary
    if (currentBoundary.alias !== 'global') {
      drawBoundary(diagram, currentBoundary, currentBounds);
    }
    parentBounds.data.stopy = Math.max(
      currentBounds.data.stopy! + conf.c4ShapeMargin,
      parentBounds.data.stopy!
    );
    parentBounds.data.stopx = Math.max(
      currentBounds.data.stopx! + conf.c4ShapeMargin,
      parentBounds.data.stopx!
    );
    globalBoundaryMaxX = Math.max(globalBoundaryMaxX, parentBounds.data.stopx);
    globalBoundaryMaxY = Math.max(globalBoundaryMaxY, parentBounds.data.stopy);
  }
}

/**
 * Draws a sequenceDiagram in the tag with id: id based on the graph definition in text.
 */
export const draw = function (_text: string, id: string, _version: string, diagObj: Diagram) {
  conf = getRequiredConfig('c4') as C4DrawConfig;
  const securityLevel = getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  const { root } = getDiagramRoot(id, securityLevel);

  const db = diagObj.db as C4DB;

  db.setWrap(conf.wrap);

  c4ShapeInRow = db.getC4ShapeInRow();
  c4BoundaryInRow = db.getC4BoundaryInRow();

  log.debug(`C:${JSON.stringify(conf, null, 2)}`);

  const diagram: SVG = root.select<SVGSVGElement>(`[id="${id}"]`);

  svgDraw.insertComputerIcon(diagram, id);
  svgDraw.insertDatabaseIcon(diagram, id);
  svgDraw.insertClockIcon(diagram, id);

  const screenBounds = new Bounds(diagObj);

  screenBounds.setData(
    conf.diagramMarginX,
    conf.diagramMarginX,
    conf.diagramMarginY,
    conf.diagramMarginY
  );

  screenBounds.data.widthLimit = screen.availWidth;
  globalBoundaryMaxX = conf.diagramMarginX;
  globalBoundaryMaxY = conf.diagramMarginY;

  const title = db.getTitle();
  const currentBoundaries = db.getBoundaries('');
  // switch (c4type) {
  //   case 'C4Context':
  drawInsideBoundary(diagram, '', screenBounds, currentBoundaries, diagObj);
  //     break;
  // }

  // The arrow head definition is attached to the svg once
  svgDraw.insertArrowHead(diagram, id);
  svgDraw.insertArrowEnd(diagram, id);
  svgDraw.insertArrowCrossHead(diagram, id);
  svgDraw.insertArrowFilledHead(diagram, id);

  drawRels(diagram, db.getRels(), db.getC4Shape, diagObj, id);

  screenBounds.data.stopx = globalBoundaryMaxX;
  screenBounds.data.stopy = globalBoundaryMaxY;

  const box = screenBounds.data;
  // `setData()` above seeded the start coordinates.
  const boxStartx = box.startx!;
  const boxStarty = box.starty!;

  // Make sure the height of the diagram supports long menus.
  const boxHeight = globalBoundaryMaxY - boxStarty;

  const height = boxHeight + 2 * conf.diagramMarginY;

  // Make sure the width of the diagram supports wide menus.
  const boxWidth = globalBoundaryMaxX - boxStartx;
  const width = boxWidth + 2 * conf.diagramMarginX;

  if (title) {
    diagram
      .append('text')
      .text(title)
      .attr('x', boxWidth / 2 - 4 * conf.diagramMarginX)
      .attr('y', boxStarty + conf.diagramMarginY);
  }

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  const extraVertForTitle = title ? 60 : 0;
  diagram.attr(
    'viewBox',
    boxStartx -
      conf.diagramMarginX +
      ' -' +
      (conf.diagramMarginY + extraVertForTitle) +
      ' ' +
      width +
      ' ' +
      (height + extraVertForTitle)
  );

  log.debug(`models:`, box);
};

export default {
  drawPersonOrSystemArray: drawC4ShapeArray,
  drawBoundary,
  setConf,
  draw,
};
