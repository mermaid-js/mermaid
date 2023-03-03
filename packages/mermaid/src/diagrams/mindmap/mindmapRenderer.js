/** Created by knut on 14-12-11. */
import { select } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../config.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import svgDraw from './svgDraw.js';
import cytoscape from 'cytoscape/dist/cytoscape.umd.js';
import coseBilkent from 'cytoscape-cose-bilkent';
import * as db from './mindmapDb.js';

// Inject the layout algorithm into cytoscape
cytoscape.use(coseBilkent);

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param {object} mindmap The mindmap data and hierarchy
 * @param section
 * @param {object} conf The configuration object
 */
function drawNodes(svg, mindmap, section, conf) {
  svgDraw.drawNode(svg, mindmap, section, conf);
  if (mindmap.children) {
    mindmap.children.forEach((child, index) => {
      drawNodes(svg, child, section < 0 ? index : section, conf);
    });
  }
}

/**
 * @param edgesEl
 * @param cy
 */
function drawEdges(edgesEl, cy) {
  cy.edges().map((edge, id) => {
    const data = edge.data();
    if (edge[0]._private.bodyBounds) {
      const bounds = edge[0]._private.rscratch;
      log.trace('Edge: ', id, data);
      edgesEl
        .insert('path')
        .attr(
          'd',
          `M ${bounds.startX},${bounds.startY} L ${bounds.midX},${bounds.midY} L${bounds.endX},${bounds.endY} `
        )
        .attr('class', 'edge section-edge-' + data.section + ' edge-depth-' + data.depth);
    }
  });
}

/**
 * @param mindmap The mindmap data and hierarchy
 * @param cy
 * @param conf The configuration object
 * @param level
 */
function addNodes(mindmap, cy, conf, level) {
  cy.add({
    group: 'nodes',
    data: {
      id: mindmap.id,
      labelText: mindmap.descr,
      height: mindmap.height,
      width: mindmap.width,
      level: level,
      nodeId: mindmap.id,
      padding: mindmap.padding,
      type: mindmap.type,
    },
    position: {
      x: mindmap.x,
      y: mindmap.y,
    },
  });
  if (mindmap.children) {
    mindmap.children.forEach((child) => {
      addNodes(child, cy, conf, level + 1);
      cy.add({
        group: 'edges',
        data: {
          id: `${mindmap.id}_${child.id}`,
          source: mindmap.id,
          target: child.id,
          depth: level,
          section: child.section,
        },
      });
    });
  }
}

/**
 * @param node
 * @param conf
 * @param cy
 */
function layoutMindmap(node, conf) {
  return new Promise((resolve) => {
    // Add temporary render element
    const renderEl = select('body').append('div').attr('id', 'cy').attr('style', 'display:none');
    const cy = cytoscape({
      container: document.getElementById('cy'), // container to render in
      style: [
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
          },
        },
      ],
    });
    // Remove element after layout
    renderEl.remove();
    addNodes(node, cy, conf, 0);

    // Make cytoscape care about the dimensions of the nodes
    cy.nodes().forEach(function (n) {
      n.layoutDimensions = () => {
        const data = n.data();
        return { w: data.width, h: data.height };
      };
    });

    cy.layout({
      name: 'cose-bilkent',
      quality: 'proof',
      // headless: true,
      styleEnabled: false,
      animate: false,
    }).run();
    cy.ready((e) => {
      log.info('Ready', e);
      resolve(cy);
    });
  });
}
/**
 * @param node
 * @param cy
 * @param positionedMindmap
 * @param conf
 */
function positionNodes(cy) {
  cy.nodes().map((node, id) => {
    const data = node.data();
    data.x = node.position().x;
    data.y = node.position().y;
    svgDraw.positionNode(data);
    const el = db.getElementById(data.nodeId);
    log.info('Id:', id, 'Position: (', node.position().x, ', ', node.position().y, ')', data);
    el.attr(
      'transform',
      `translate(${node.position().x - data.width / 2}, ${node.position().y - data.height / 2})`
    );
    el.attr('attr', `apa-${id})`);
  });
}

/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 *
 * @param {any} text
 * @param {any} id
 * @param {any} version
 * @param diagObj
 */

export const draw = async (text, id, version, diagObj) => {
  const conf = getConfig();

  // This is done only for throwing the error if the text is not valid.
  diagObj.db.clear();
  // Parse the graph definition
  diagObj.parser.parse(text);

  log.debug('Renering info diagram\n' + text);

  const securityLevel = getConfig().securityLevel;
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');
  // Parse the graph definition

  const svg = root.select('#' + id);

  svg.append('g');
  const mm = diagObj.db.getMindmap();

  // Draw the graph and start with drawing the nodes without proper position
  // this gives us the size of the nodes and we can set the positions later

  const edgesElem = svg.append('g');
  edgesElem.attr('class', 'mindmap-edges');
  const nodesElem = svg.append('g');
  nodesElem.attr('class', 'mindmap-nodes');
  drawNodes(nodesElem, mm, -1, conf);

  // Next step is to layout the mindmap, giving each node a position

  const cy = await layoutMindmap(mm, conf);

  // // After this we can draw, first the edges and the then nodes with the correct position
  drawEdges(edgesElem, cy, conf);
  positionNodes(cy, conf);

  // Setup the view box and size of the svg element
  setupGraphViewbox(undefined, svg, conf.mindmap.padding, conf.mindmap.useMaxWidth);
};

export default {
  draw,
};
