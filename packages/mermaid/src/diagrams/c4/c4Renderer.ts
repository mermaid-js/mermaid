import svgDraw from './svgDraw.js';
import { log } from '../../logger.js';
// @ts-ignore: JISON doesn't support types
import { parser } from './parser/c4Diagram.jison';
import common from '../common/common.js';
import c4Db from './c4Db.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getEffectiveHtmlLabels } from '../../config.js';
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
import { shapes } from '../../rendering-util/rendering-elements/shapes.js';
import { buildC4Node, buildEdgeLabel } from './c4ShapeAdapter.js';
import { insertEdgeLabel, insertEdge } from '../../rendering-util/rendering-elements/edges.js';
import insertMarkers from '../../rendering-util/rendering-elements/markers.js';

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

const boundaryFont = (cnf: C4DrawConfig): C4Font => {
  return {
    fontFamily: cnf.boundaryFontFamily,
    fontSize: cnf.boundaryFontSize as number,
    fontWeight: cnf.boundaryFontWeight,
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

export const drawC4ShapeArray = async function (
  currentBounds: Bounds,
  diagram: SVG,
  c4ShapeArray: C4Shape[],
  c4ShapeKeys: string[]
) {
  const mermaidConfig = getConfig();
  const look = mermaidConfig.look ?? 'classic';
  const renderOptions = { config: mermaidConfig };
  // Namespace the shape DOM ids with the diagram id so two diagrams on one page don't
  // collide (the unified shapes use node.domId for the element id).
  const diagramId = diagram.attr('id') ?? '';

  // `c4ShapeKeys` are the (numeric string) indices of `c4ShapeArray`.
  const c4Shapes = c4ShapeKeys.map((key) => c4ShapeArray[Number(key)]);

  const shapeHandlerFor = (node: ReturnType<typeof buildC4Node>) => {
    const handler = node.shape ? shapes[node.shape] : undefined;
    if (!handler) {
      throw new Error(`C4: no shape handler for "${node.shape}"`);
    }
    return handler;
  };

  // Pass 1 (measure): render each shape, read its self-sized dimensions onto the legacy
  // c4Shape, then discard the rendering. The shape is drawn again in pass 2 directly at its
  // final position, so its label (and any composited sub-element) lays out under the final
  // transform - drawing at the origin and translating afterwards leaves composited layers
  // (e.g. anything with opacity) painting at the stale origin.
  await Promise.all(
    c4Shapes.map(async (c4Shape) => {
      const node = buildC4Node(c4Shape, conf, conf.c4ShapePadding, look, conf.width);
      node.domId = `${diagramId}-${node.id}`;
      const measured = await shapeHandlerFor(node)(diagram, node, renderOptions);
      c4Shape.width = node.width ?? conf.width;
      c4Shape.height = node.height ?? conf.height;
      c4Shape.margin = conf.c4ShapeMargin;
      measured.remove();
    })
  );

  // Position with the legacy grid.
  for (const c4Shape of c4Shapes) {
    currentBounds.insert(c4Shape);
  }

  // Pass 2 (draw): render each shape into a group already translated to its grid position
  // (unified shapes are centred at the origin; legacy x/y is the top-left corner).
  await Promise.all(
    c4Shapes.map(async (c4Shape) => {
      const node = buildC4Node(c4Shape, conf, conf.c4ShapePadding, look, conf.width);
      node.domId = `${diagramId}-${node.id}`;
      // Needed to properly calculate the intersection points.
      node.x = c4Shape.x + c4Shape.width / 2;
      node.y = c4Shape.y + c4Shape.height / 2;
      // Appending before the await keeps the shapes' stacking order deterministic.
      const positioned = diagram
        .append('g')
        .attr(
          'transform',
          `translate(${c4Shape.x + c4Shape.width / 2}, ${c4Shape.y + c4Shape.height / 2})`
        );
      await shapeHandlerFor(node)(positioned, node, renderOptions);
      c4Shape.intersect = node.intersect;
    })
  );

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

/*
 * Get the intersection of the line between the center point of a rectangle and a point outside the rectangle.
 */
const getIntersectPoint = function (fromNode: C4Shape, endPoint: Point): Point | null {
  if (!fromNode.intersect) {
    throw new Error(
      `C4 shape "${fromNode.alias}" has no intersect function. Please report this to https://github.com/mermaid-js/mermaid/issues`
    );
  }
  const { x, y } = fromNode.intersect(endPoint);
  return new Point(x, y);
};

/**
 * An `UpdateRelStyle` colour, accepted only if it is a colour on its own. The value is
 * interpolated into a CSS declaration, so one carrying `;` or a `url(...)` could append
 * further declarations; `CSS.supports` rejects those, and anything it cannot judge (no
 * CSS API, as in jsdom) falls back to a conservative pattern match.
 */
const asColor = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  const accepted =
    typeof globalThis.CSS?.supports === 'function'
      ? globalThis.CSS.supports('color', value)
      : /^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d\s%,./]+\)|hsla?\([\d\s%,./deg]+\))$/i.test(value);
  return accepted ? value : undefined;
};

// Where the line between two shapes meets each one's boundary. Each endpoint comes
// from that shape's own `intersect`, captured from the unified shape that drew it,
// so an arrow stops at the person or cylinder silhouette rather than at its bounding
// box. Aiming each endpoint at the other shape's centre keeps the segment on the line
// joining the two centres.
const getIntersectPoints = function (fromNode: C4Shape, endNode: C4Shape) {
  const fromCenter = new Point(fromNode.x + fromNode.width / 2, fromNode.y + fromNode.height / 2);
  const endCenter = new Point(endNode.x + endNode.width / 2, endNode.y + endNode.height / 2);
  const startPoint = getIntersectPoint(fromNode, endCenter);
  const endPoint = getIntersectPoint(endNode, fromCenter);
  return { startPoint: startPoint, endPoint: endPoint };
};

export const drawRels = async function (
  diagram: SVG,
  rels: C4Rel[],
  getC4ShapeObj: (alias: string) => C4Shape | undefined,
  diagObj: Diagram,
  diagramId: string
) {
  const diagramType = (diagObj.db as C4DB).getC4Type();
  const config = getConfig();
  const look = config.look ?? 'classic';
  // Emphasis tags only render as emphasis in an HTML label; the plain form drops them.
  const useHtmlLabels = getEffectiveHtmlLabels(config);

  // Relationships are drawn through the unified edge renderer: a dashed line with an
  // arrowhead and an HTML label, matching c4model.com. Edges (and their labels) are drawn
  // ON TOP of the shapes - as the legacy C4 renderer did - so the connection line is never
  // hidden behind a box. The legacy grid still supplies the geometry (a straight line
  // between the two shapes' boundary intersection points), which keeps the line in the gaps.
  const edgePaths = diagram.append('g').attr('class', 'edgePaths');
  const edgeLabels = diagram.append('g').attr('class', 'edgeLabels');
  insertMarkers(diagram, ['point'], 'c4', diagramId);
  // The intersection points are already clipped to the shape boundaries, so insertEdge does
  // not need to clip again (skipIntersect); the node stubs are therefore unused.
  const nodeStub = { intersect: (point: Point) => point };

  let i = 0;
  for (const rel of rels) {
    i = i + 1;
    if (diagramType === 'C4Dynamic') {
      rel.label.text = i + ': ' + rel.label.text;
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

    // Honour UpdateRelStyle: $offsetX/$offsetY nudge the label, $textColor/$lineColor recolour it.
    // The db may store the offsets as strings (named attributes land in the textColor/lineColor
    // slots, which aren't parseInt'd) or as numbers (positional), so coerce defensively.
    const toOffset = (value: unknown) => {
      const n = Number(value);
      return Number.isNaN(n) ? 0 : n;
    };
    const offsetX = toOffset(rel.offsetX);
    const offsetY = toOffset(rel.offsetY);
    const lineColor = asColor(rel.lineColor);
    const textColor = asColor(rel.textColor);
    const labelX = (points.startPoint.x + points.endPoint.x) / 2 + offsetX;
    const labelY = (points.startPoint.y + points.endPoint.y) / 2 + offsetY;

    const edge = {
      id: `${diagramId}_rel${i}`,
      label: buildEdgeLabel(rel, useHtmlLabels),
      labelType: 'string',
      classes: 'c4-rel',
      arrowTypeEnd: 'arrow_point',
      arrowTypeStart: rel.type === 'birel' ? 'arrow_point' : undefined,
      thickness: 'normal',
      pattern: 'dashed',
      curve: 'linear',
      look,
      points: [points.startPoint, points.endPoint],
      style: lineColor ? [`stroke:${lineColor}`] : undefined,
      cssStyles: textColor ? [`color:${textColor}`] : undefined,
    };

    if (edge.label) {
      await insertEdgeLabel(edgeLabels, edge);
      // Position the label at the line midpoint + the UpdateRelStyle offset. We set the
      // transform directly rather than via positionEdgeLabel, which discards edge.x/y (and
      // so the offset) whenever insertEdge happens to report an updated path.
      const labelGroup = edgeLabels.node()?.lastElementChild;
      if (labelGroup) {
        labelGroup.setAttribute('transform', `translate(${labelX}, ${labelY})`);
      }
    }
    insertEdge(edgePaths, edge, new Map(), 'c4', nodeStub, nodeStub, diagramId, true);
  }
};

async function drawInsideBoundary(
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
      await drawC4ShapeArray(
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
      await drawInsideBoundary(
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
export const draw = async function (_text: string, id: string, _version: string, diagObj: Diagram) {
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
  await drawInsideBoundary(diagram, '', screenBounds, currentBoundaries, diagObj);
  //     break;
  // }

  await drawRels(diagram, db.getRels(), db.getC4Shape, diagObj, id);

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
