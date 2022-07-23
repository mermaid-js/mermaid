/** Created by knut on 14-12-11. */
import { select } from 'd3';
import { log, getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI';
import svgDraw from './svgDraw';

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param {object} mindmap The maindmap data and hierarchy
 * @param {object} conf The configuration object
 */
function drawNodes(svg, mindmap, conf) {
  svgDraw.drawNode(svg, mindmap, conf);
  if (mindmap.children) {
    mindmap.children.forEach((child) => {
      drawNodes(svg, child, conf);
    });
  }
}

function drawEdges() {}
/**
 * @param node
 * @param isRoot
 */
function layoutMindmap(node, isRoot) {}
/**
 * @param node
 * @param isRoot
 */
function positionNodes(node, isRoot) {}

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param {any} version
 * @param diagObj
 */
export const draw = (text, id, version, diagObj) => {
  const conf = getConfig();
  try {
    // const parser = infoParser.parser;
    // parser.yy = db;
    log.debug('Renering info diagram\n' + text);

    const securityLevel = getConfig().securityLevel;
    // Handle root and Document for when rendering in sanbox mode
    let sandboxElement;
    if (securityLevel === 'sandbox') {
      sandboxElement = select('#i' + id);
    }
    const root =
      securityLevel === 'sandbox'
        ? select(sandboxElement.nodes()[0].contentDocument.body)
        : select('body');
    const doc = securityLevel === 'sandbox' ? sandboxElement.nodes()[0].contentDocument : document;

    // Parse the graph definition

    const svg = root.select('#' + id);

    const g = svg.append('g');
    const mm = diagObj.db.getMindmap();

    // mm.x = 0;
    // mm.y = 0;
    // svgDraw.drawNode(g, mm, getConfig());
    // mm.children.forEach((child) => {
    //   child.x = 200;
    //   child.y = 200;
    //   child.width = 200;
    //   svgDraw.drawNode(g, child, getConfig());
    // });

    // Draw the graph and start with drawing the nodes without proper position
    // this gives us the size of the nodes and we can set the positions later

    const nodesElem = svg.append('g');
    nodesElem.attr('class', 'mindmap-nodes');
    drawNodes(nodesElem, mm, conf);

    // Next step is to layout the mindmap, giving each node a position

    // layoutMindmap(mm, conf);

    // After this we can draw, first the edges and the then nodes with the correct position
    // drawEdges(svg, mm, conf);

    // positionNodes(svg, mm, conf);

    // Setup the view box and size of the svg element
    setupGraphViewbox(undefined, svg, conf.mindmap.diagramPadding, conf.mindmap.useMaxWidth);
  } catch (e) {
    log.error('Error while rendering info diagram');
    log.error(e.message);
  }
};

export default {
  draw,
};
