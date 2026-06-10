import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/index.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import { log } from '../../logger.js';
import svgDraw from './svgDraw.js';
import { configureSvgSize } from '../../setupGraphViewbox.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getRequiredConfig } from '../../diagram-api/requiredConfig.js';
import { getDiagramRoot } from '../../utils/diagramRoot.js';
import { requiredGet, requiredNode } from '../../utils/guards.js';
import type { D3Selection } from '../../types.js';
import type { ClassDiagramObj, ClassDrawInfo, NoteDrawInfo } from './svgDraw.js';

/** A class or note that has been drawn into the diagram (notes have no `label`). */
type DrawnNodeInfo = (ClassDrawInfo | NoteDrawInfo) & { label?: string };

let idCache: Record<string, DrawnNodeInfo> = {};
const padding = 20;

/**
 * Gets the ID with the same label as in the cache
 *
 * @param label - The label to look for
 * @returns The resulting ID
 */
const getGraphId = function (label: string) {
  const foundEntry = Object.entries(idCache).find((entry) => entry[1].label === label);

  if (foundEntry) {
    return foundEntry[0];
  }
};

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 *
 * @param elem - The SVG element to append to
 */
const insertMarkers = function (elem: D3Selection<SVGSVGElement>) {
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

/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram
 * @param id - The unique id of the DOM node that contains the diagram
 * @param _version - Mermaid version
 * @param diagObj - The diagram object
 */
export const draw = function (
  text: string,
  id: string,
  _version: string,
  diagObj: ClassDiagramObj
) {
  const conf = getRequiredConfig('class');
  idCache = {};

  log.info('Rendering diagram ' + text);

  const securityLevel = getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  const { root } = getDiagramRoot(id, securityLevel);

  // Fetch the default direction, use TD if none was found
  const diagram = root.select<SVGSVGElement>(`[id='${id}']`);
  insertMarkers(diagram);

  // Layout graph, Create a new directed graph
  const g = new graphlib.Graph({
    multigraph: true,
  });

  // Set an object for the graph label
  g.setGraph({
    isMultiGraph: true,
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  const classes = diagObj.db.getClasses();
  const keys = [...classes.keys()];

  for (const key of keys) {
    const classDef = requiredGet(classes, key, 'class definition');
    const node = svgDraw.drawClass(diagram, classDef, conf, diagObj);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);

    log.info('Org height: ' + node.height);
  }

  const relations = diagObj.db.getRelations();
  relations.forEach(function (relation) {
    const graphId1 = getGraphId(relation.id1);
    const graphId2 = getGraphId(relation.id2);
    log.info(
      // cspell:ignore tjoho
      'tjoho' + graphId1 + graphId2 + JSON.stringify(relation)
    );
    if (graphId1 === undefined || graphId2 === undefined) {
      // Previously the undefined ids were passed to graphlib, breaking the layout.
      throw new Error(
        `Cannot add relation between classes "${relation.id1}" and "${relation.id2}": one of them has not been drawn`
      );
    }
    g.setEdge(
      graphId1,
      graphId2,
      {
        relation: relation,
      },
      relation.title || 'DEFAULT'
    );
  });

  for (const note of diagObj.db.getNotes().values()) {
    log.debug(`Adding note: ${JSON.stringify(note)}`);
    const node = svgDraw.drawNote(diagram, note, conf, diagObj);
    idCache[node.id] = node;

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    g.setNode(node.id, node);
    if (note.class && classes.has(note.class)) {
      const classGraphId = getGraphId(note.class);
      if (classGraphId === undefined) {
        // Previously the undefined id was passed to graphlib, breaking the layout.
        throw new Error(`Cannot attach note "${note.id}": class "${note.class}" was not drawn`);
      }
      g.setEdge(
        note.id,
        classGraphId,
        {
          relation: {
            id1: note.id,
            id2: note.class,
            relation: {
              type1: 'none',
              type2: 'none',
              lineType: 10,
            },
          },
        },
        'DEFAULT'
      );
    }
  }

  // @ts-expect-error -- dagre-d3-es types declare `opts` as required, but the implementation treats it as optional.
  dagreLayout(g);
  g.nodes().forEach(function (v) {
    if (v !== undefined && g.node(v) !== undefined) {
      log.debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      root
        .select('#' + (diagObj.db.lookUpDomId(v) || v))
        .attr(
          'transform',
          'translate(' +
            (g.node(v).x - g.node(v).width / 2) +
            ',' +
            (g.node(v).y - g.node(v).height / 2) +
            ' )'
        );
    }
  });

  g.edges().forEach(function (e) {
    if (e !== undefined && g.edge(e) !== undefined) {
      log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      svgDraw.drawEdge(diagram, g.edge(e), g.edge(e).relation, conf, diagObj);
    }
  });

  const svgBounds = requiredNode(diagram, 'class diagram svg node').getBBox();
  const width = svgBounds.width + padding * 2;
  const height = svgBounds.height + padding * 2;

  configureSvgSize(diagram, height, width, conf.useMaxWidth);

  // Ensure the viewBox includes the whole svgBounds area with extra space for padding
  const vBox = `${svgBounds.x - padding} ${svgBounds.y - padding} ${width} ${height}`;
  log.debug(`viewBox ${vBox}`);
  diagram.attr('viewBox', vBox);
};

export default {
  draw,
};
