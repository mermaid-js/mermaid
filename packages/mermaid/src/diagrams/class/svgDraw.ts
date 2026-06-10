import { line, curveBasis } from 'd3';
import utils from '../../utils.js';
import { log } from '../../logger.js';
import { parseGenericTypes, getUrl } from '../common/common.js';
import { requiredNode } from '../../utils/guards.js';
import type { ClassDiagramConfig } from '../../config.type.js';
import type { D3Selection, Point } from '../../types.js';
import type { ClassMember, ClassNode, ClassNote, ClassRelation } from './classTypes.js';
import type { ClassDB } from './classDb.js';

/** The class diagram config, with all the renderer-relevant values filled in. */
export type SvgDrawConfig = Required<ClassDiagramConfig>;

/** The part of the diagram object that the svgDraw helpers rely on. */
export interface ClassDiagramObj {
  db: ClassDB;
}

/**
 * The relation data attached to an edge in the layout graph. Besides the parsed
 * {@link ClassRelation}s this also covers the synthetic note-to-class relations created by the
 * renderer (which have `'none'` relation types and no titles).
 */
export type RelationEdgeData = Pick<ClassRelation, 'id1' | 'id2'> &
  Partial<Pick<ClassRelation, 'title' | 'relationTitle1' | 'relationTitle2'>> & {
    relation: {
      type1: number | 'none';
      type2: number | 'none';
      lineType: number;
    };
  };

/** The path of an edge, as calculated by the dagre layout. */
export interface EdgePathData {
  points: Point[];
}

/** Bounding box information of a class that was drawn into the diagram. */
export interface ClassDrawInfo {
  id: string;
  label: string;
  width: number;
  height: number;
}

/** Bounding box information of a note that was drawn into the diagram. */
export interface NoteDrawInfo {
  id: string;
  text: string;
  width: number;
  height: number;
}

let edgeCount = 0;

export const drawEdge = function (
  elem: D3Selection<SVGSVGElement>,
  path: EdgePathData,
  relation: RelationEdgeData,
  conf: SvgDrawConfig,
  diagObj: ClassDiagramObj
) {
  const getRelationType = function (type: number | 'none') {
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
  const lineFunction = line<Point>()
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
    url = getUrl(true);
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

  const l = path.points.length;
  // Calculate Label position
  const labelPosition = utils.calcLabelPosition(path.points);
  const x = labelPosition.x;
  const y = labelPosition.y;

  let p1_card_x: number | undefined, p1_card_y: number | undefined;
  let p2_card_x: number | undefined, p2_card_y: number | undefined;

  if (l % 2 !== 0 && l > 1) {
    const cardinality_1_point = utils.calcCardinalityPosition(
      relation.relation.type1 !== 'none',
      path.points,
      path.points[0]
    );
    const cardinality_2_point = utils.calcCardinalityPosition(
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

    (window as Window & { label?: typeof label }).label = label;
    const bounds = requiredNode(label, 'relation label node').getBBox();

    g.insert('rect', ':first-child')
      .attr('class', 'box')
      .attr('x', bounds.x - conf.padding / 2)
      .attr('y', bounds.y - conf.padding / 2)
      .attr('width', bounds.width + conf.padding)
      .attr('height', bounds.height + conf.padding);
  }

  log.info('Rendering relation ' + JSON.stringify(relation));
  // The cardinality positions are only calculated for odd point counts; like
  // the original code (which passed `undefined`), `null` makes d3 skip the
  // attribute when they are missing.
  if (relation.relationTitle1 !== undefined && relation.relationTitle1 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    g.append('text')
      .attr('class', 'type1')
      .attr('x', p1_card_x ?? null)
      .attr('y', p1_card_y ?? null)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle1);
  }
  if (relation.relationTitle2 !== undefined && relation.relationTitle2 !== 'none') {
    const g = elem.append('g').attr('class', 'cardinality');
    g.append('text')
      .attr('class', 'type2')
      .attr('x', p2_card_x ?? null)
      .attr('y', p2_card_y ?? null)
      .attr('fill', 'black')
      .attr('font-size', '6')
      .text(relation.relationTitle2);
  }

  edgeCount++;
};

/**
 * Renders a class diagram
 *
 * @param elem - The element to draw it into
 * @param classDef - The class being rendered
 * @param conf - The class diagram configuration
 * @param diagObj - The diagram object
 * TODO: Add more information in the JSDOC here
 */
export const drawClass = function (
  elem: D3Selection<SVGSVGElement>,
  classDef: ClassNode,
  conf: SvgDrawConfig,
  diagObj: ClassDiagramObj
): ClassDrawInfo {
  log.debug('Rendering class ', classDef, conf);

  const id = classDef.id;
  const classInfo: ClassDrawInfo = {
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
      // Like the original code (which passed `undefined`), `null` makes d3
      // skip the attribute when there is no link target.
      .attr('target', classDef.linkTarget ?? null)
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

  const classTitleString = getClassTitleString(classDef);

  const classTitle = title.append('tspan').text(classTitleString).attr('class', 'title');

  // If class has annotations the title needs to have an offset of the text height
  if (!isFirst) {
    classTitle.attr('dy', conf.textHeight);
  }

  const titleHeight = requiredNode(title, 'class title text node').getBBox().height;
  let membersLine;
  let membersBox: DOMRect | undefined;
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

    membersBox = requiredNode(members, 'class members text node').getBBox();
  }

  // don't draw box if no methods
  if (classDef.methods.length > 0) {
    if (membersBox === undefined) {
      // The members box is only drawn when there are members; like the
      // original code (which crashed with a TypeError here), methods cannot be
      // drawn without it.
      throw new Error(`Cannot draw methods of class "${classDef.id}" without a members box`);
    }
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

  const classBox = requiredNode(g, 'class group node').getBBox();
  let cssClassStr = ' ';

  if (classDef.cssClasses.length > 0) {
    // Note: in the current ClassDB `cssClasses` is a space-separated string, while this legacy
    // renderer was written against the old array shape. The cast keeps the code as-is.
    cssClassStr = cssClassStr + (classDef.cssClasses as unknown as string[]).join(' ');
  }

  const rect = g
    .insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', classBox.width + 2 * conf.padding)
    .attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin)
    .attr('class', cssClassStr);

  const rectWidth = requiredNode(rect, 'class rect node').getBBox().width;

  // Center title
  // We subtract the width of each text element from the class box width and divide it by 2
  requiredNode(title, 'class title text node').childNodes.forEach(function (x: ChildNode) {
    const textElement = x as SVGTSpanElement;
    textElement.setAttribute('x', `${(rectWidth - textElement.getBBox().width) / 2}`);
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

export const getClassTitleString = function (classDef: Pick<ClassNode, 'id' | 'type'>) {
  let classTitleString = classDef.id;

  if (classDef.type) {
    classTitleString += '<' + parseGenericTypes(classDef.type) + '>';
  }

  return classTitleString;
};

/**
 * Renders a note diagram
 *
 * @param elem - The element to draw it into
 * @param note - The note to draw
 * @param conf - The class diagram configuration
 * @param _diagObj - The diagram object
 * TODO: Add more information in the JSDOC here
 */
export const drawNote = function (
  elem: D3Selection<SVGSVGElement>,
  note: ClassNote,
  conf: SvgDrawConfig,
  _diagObj?: ClassDiagramObj
): NoteDrawInfo {
  log.debug('Rendering note ', note, conf);

  const id = note.id;
  const noteInfo: NoteDrawInfo = {
    id: id,
    text: note.text,
    width: 0,
    height: 0,
  };

  // add class group
  const g = elem.append('g').attr('id', id).attr('class', 'classGroup');

  // add text
  const text = g
    .append('text')
    .attr('y', conf.textHeight + conf.padding)
    .attr('x', 0);

  const lines = (JSON.parse(`"${note.text}"`) as string).split('\n');

  lines.forEach(function (line) {
    log.debug(`Adding line: ${line}`);
    text.append('tspan').text(line).attr('class', 'title').attr('dy', conf.textHeight);
  });

  const noteBox = requiredNode(g, 'note group node').getBBox();

  const rect = g
    .insert('rect', ':first-child')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', noteBox.width + 2 * conf.padding)
    .attr(
      'height',
      noteBox.height + lines.length * conf.textHeight + conf.padding + 0.5 * conf.dividerMargin
    );

  const rectWidth = requiredNode(rect, 'note rect node').getBBox().width;

  // Center title
  // We subtract the width of each text element from the class box width and divide it by 2
  requiredNode(text, 'note text node').childNodes.forEach(function (x: ChildNode) {
    const textElement = x as SVGTSpanElement;
    textElement.setAttribute('x', `${(rectWidth - textElement.getBBox().width) / 2}`);
  });

  noteInfo.width = rectWidth;
  noteInfo.height =
    noteBox.height + lines.length * conf.textHeight + conf.padding + 0.5 * conf.dividerMargin;

  return noteInfo;
};

/**
 * Adds a tspan for a member in a diagram
 *
 * @param textEl - The text element to append to
 * @param member - The member
 * @param isFirst - Whether the member is the first one in its section
 * @param conf - The configuration for the member
 */
const addTspan = function (
  textEl: D3Selection<SVGTextElement>,
  member: ClassMember,
  isFirst: boolean,
  conf: SvgDrawConfig
) {
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
