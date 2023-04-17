// @ts-ignore d3 types are not available
import { select, curveLinear } from 'd3';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { log } from '../../logger.js';
import { getConfig } from '../../config.js';
import { render } from '../../dagre-wrapper/index.js';
import utils from '../../utils.js';
import { interpolateToCurve, getStylesFromArray } from '../../utils.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import common from '../common/common.js';
import { ClassRelation, ClassNote, ClassMap, EdgeData, NamespaceMap } from './classTypes.js';

const sanitizeText = (txt: string) => common.sanitizeText(txt, getConfig());

let conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10,
  curve: undefined,
};

interface RectParameters {
  id: string;
  shape: 'rect';
  labelStyle: string;
  domId: string;
  labelText: string;
  padding: number | undefined;
  style?: string;
}

/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 *
 * @param namespaces - Object containing the vertices.
 * @param g - The graph that is to be drawn.
 * @param _id - id of the graph
 * @param diagObj - The diagram object
 */
export const addNamespaces = function (
  namespaces: NamespaceMap,
  g: graphlib.Graph,
  _id: string,
  diagObj: any
) {
  const keys = Object.keys(namespaces);
  log.info('keys:', keys);
  log.info(namespaces);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertex = namespaces[id];

    // parent node must be one of [rect, roundedWithTitle, noteGroup, divider]
    const shape = 'rect';

    const node: RectParameters = {
      shape: shape,
      id: vertex.id,
      domId: vertex.domId,
      labelText: sanitizeText(vertex.id),
      labelStyle: '',
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: getConfig().flowchart?.padding ?? getConfig().class?.padding,
    };

    g.setNode(vertex.id, node);
    addClasses(vertex.classes, g, _id, diagObj, vertex.id);

    log.info('setNode', node);
  });
};

/**
 * Function that adds the vertices found during parsing to the graph to be rendered.
 *
 * @param classes - Object containing the vertices.
 * @param g - The graph that is to be drawn.
 * @param _id - id of the graph
 * @param diagObj - The diagram object
 */
export const addClasses = function (
  classes: ClassMap,
  g: graphlib.Graph,
  _id: string,
  diagObj: any,
  parent?: string
) {
  const keys = Object.keys(classes);
  log.info('keys:', keys);
  log.info(classes);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  keys.forEach(function (id) {
    const vertex = classes[id];

    /**
     * Variable for storing the classes for the vertex
     */
    let cssClassStr = '';
    if (vertex.cssClasses.length > 0) {
      cssClassStr = cssClassStr + ' ' + vertex.cssClasses.join(' ');
    }

    const styles = { labelStyle: '', style: '' }; //getStylesFromArray(vertex.styles);

    // Use vertex id as text in the box if no text is provided by the graph definition
    const vertexText = vertex.label ?? vertex.id;
    const radius = 0;
    const shape = 'class_box';

    // Add the node
    const node = {
      labelStyle: styles.labelStyle,
      shape: shape,
      labelText: sanitizeText(vertexText),
      classData: vertex,
      rx: radius,
      ry: radius,
      class: cssClassStr,
      style: styles.style,
      id: vertex.id,
      domId: vertex.domId,
      tooltip: diagObj.db.getTooltip(vertex.id, parent) || '',
      haveCallback: vertex.haveCallback,
      link: vertex.link,
      width: vertex.type === 'group' ? 500 : undefined,
      type: vertex.type,
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: getConfig().flowchart?.padding ?? getConfig().class?.padding,
    };
    g.setNode(vertex.id, node);

    if (parent) {
      g.setParent(vertex.id, parent);
    }

    log.info('setNode', node);
  });
};

/**
 * Function that adds the additional vertices (notes) found during parsing to the graph to be rendered.
 *
 * @param notes - Object containing the additional vertices (notes).
 * @param g - The graph that is to be drawn.
 * @param startEdgeId - starting index for note edge
 * @param classes - Classes
 */
export const addNotes = function (
  notes: ClassNote[],
  g: graphlib.Graph,
  startEdgeId: number,
  classes: ClassMap
) {
  log.info(notes);

  // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition
  notes.forEach(function (note, i) {
    const vertex = note;

    /**
     * Variable for storing the classes for the vertex
     *
     */
    const cssNoteStr = '';

    const styles = { labelStyle: '', style: '' };

    // Use vertex id as text in the box if no text is provided by the graph definition
    const vertexText = vertex.text;

    const radius = 0;
    const shape = 'note';
    // Add the node
    const node = {
      labelStyle: styles.labelStyle,
      shape: shape,
      labelText: sanitizeText(vertexText),
      noteData: vertex,
      rx: radius,
      ry: radius,
      class: cssNoteStr,
      style: styles.style,
      id: vertex.id,
      domId: vertex.id,
      tooltip: '',
      type: 'note',
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: getConfig().flowchart?.padding ?? getConfig().class?.padding,
    };
    g.setNode(vertex.id, node);
    log.info('setNode', node);

    if (!vertex.class || !(vertex.class in classes)) {
      return;
    }
    const edgeId = startEdgeId + i;

    const edgeData: EdgeData = {
      id: `edgeNote${edgeId}`,
      //Set relationship style and line type
      classes: 'relation',
      pattern: 'dotted',
      // Set link type for rendering
      arrowhead: 'none',
      //Set edge extra labels
      startLabelRight: '',
      endLabelLeft: '',
      //Set relation arrow types
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
      style: 'fill:none',
      labelStyle: '',
      curve: interpolateToCurve(conf.curve, curveLinear),
    };

    // Add the edge to the graph
    g.setEdge(vertex.id, vertex.class, edgeData, edgeId);
  });
};

/**
 * Add edges to graph based on parsed graph definition
 *
 * @param relations -
 * @param g - The graph object
 */
export const addRelations = function (relations: ClassRelation[], g: graphlib.Graph) {
  const conf = getConfig().flowchart;
  let cnt = 0;

  relations.forEach(function (edge) {
    cnt++;
    const edgeData: EdgeData = {
      //Set relationship style and line type
      classes: 'relation',
      pattern: edge.relation.lineType == 1 ? 'dashed' : 'solid',
      id: 'id' + cnt,
      // Set link type for rendering
      arrowhead: edge.type === 'arrow_open' ? 'none' : 'normal',
      //Set edge extra labels
      startLabelRight: edge.relationTitle1 === 'none' ? '' : edge.relationTitle1,
      endLabelLeft: edge.relationTitle2 === 'none' ? '' : edge.relationTitle2,
      //Set relation arrow types
      arrowTypeStart: getArrowMarker(edge.relation.type1),
      arrowTypeEnd: getArrowMarker(edge.relation.type2),
      style: 'fill:none',
      labelStyle: '',
      curve: interpolateToCurve(conf?.curve, curveLinear),
    };

    log.info(edgeData, edge);

    if (edge.style !== undefined) {
      const styles = getStylesFromArray(edge.style);
      edgeData.style = styles.style;
      edgeData.labelStyle = styles.labelStyle;
    }

    edge.text = edge.title;
    if (edge.text === undefined) {
      if (edge.style !== undefined) {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';
      edgeData.labelpos = 'c';

      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      if (getConfig().flowchart?.htmlLabels ?? getConfig().htmlLabels) {
        edgeData.labelType = 'html';
        edgeData.label = '<span class="edgeLabel">' + edge.text + '</span>';
      } else {
        edgeData.labelType = 'text';
        edgeData.label = edge.text.replace(common.lineBreakRegex, '\n');

        if (edge.style === undefined) {
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
        }

        edgeData.labelStyle = edgeData.labelStyle.replace('color:', 'fill:');
      }
    }
    // Add the edge to the graph
    g.setEdge(edge.id1, edge.id2, edgeData, cnt);
  });
};

/**
 * Merges the value of `conf` with the passed `cnf`
 *
 * @param cnf - Config to merge
 */
export const setConf = function (cnf: any) {
  conf = {
    ...conf,
    ...cnf,
  };
};

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text -
 * @param id -
 * @param _version -
 * @param diagObj -
 */
export const draw = async function (text: string, id: string, _version: string, diagObj: any) {
  log.info('Drawing class - ', id);

  // TODO V10: Why flowchart? Might be a mistake when copying.
  const conf = getConfig().flowchart ?? getConfig().class;
  const securityLevel = getConfig().securityLevel;
  log.info('config:', conf);
  const nodeSpacing = conf?.nodeSpacing ?? 50;
  const rankSpacing = conf?.rankSpacing ?? 50;

  // Create the input mermaid.graph
  const g: graphlib.Graph = new graphlib.Graph({
    multigraph: true,
    compound: true,
  })
    .setGraph({
      rankdir: diagObj.db.getDirection(),
      nodesep: nodeSpacing,
      ranksep: rankSpacing,
      marginx: 8,
      marginy: 8,
    })
    .setDefaultEdgeLabel(function () {
      return {};
    });

  // Fetch the vertices/nodes and edges/links from the parsed graph definition
  const namespaces: NamespaceMap = diagObj.db.getNamespaces();
  const classes: ClassMap = diagObj.db.getClasses();
  const relations: ClassRelation[] = diagObj.db.getRelations();
  const notes: ClassNote[] = diagObj.db.getNotes();
  log.info(relations);
  addNamespaces(namespaces, g, id, diagObj);
  addClasses(classes, g, id, diagObj);
  addRelations(relations, g);
  addNotes(notes, g, relations.length + 1, classes);

  // Set up an SVG group so that we can translate the final graph.
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? // @ts-ignore Ignore type error for now

        select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  // @ts-ignore Ignore type error for now
  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.
  // @ts-ignore Ignore type error for now
  const element = root.select('#' + id + ' g');
  await render(
    element,
    g,
    ['aggregation', 'extension', 'composition', 'dependency', 'lollipop'],
    'classDiagram',
    id
  );

  utils.insertTitle(svg, 'classTitleText', conf?.titleTopMargin ?? 5, diagObj.db.getDiagramTitle());

  setupGraphViewbox(g, svg, conf?.diagramPadding, conf?.useMaxWidth);

  // Add label rects for non html labels
  if (!conf?.htmlLabels) {
    // @ts-ignore Ignore type error for now
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;
    const labels = doc.querySelectorAll('[id="' + id + '"] .edgeLabel .label');
    for (const label of labels) {
      // Get dimensions of label
      const dim = label.getBBox();

      const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);

      label.insertBefore(rect, label.firstChild);
    }
  }
};

/**
 * Gets the arrow marker for a type index
 *
 * @param type - The type to look for
 * @returns The arrow marker
 */
function getArrowMarker(type: number) {
  let marker;
  switch (type) {
    case 0:
      marker = 'aggregation';
      break;
    case 1:
      marker = 'extension';
      break;
    case 2:
      marker = 'composition';
      break;
    case 3:
      marker = 'dependency';
      break;
    case 4:
      marker = 'lollipop';
      break;
    default:
      marker = 'none';
  }
  return marker;
}

export default {
  setConf,
  draw,
};
