/** Created by knut on 14-12-11. */
import { select } from 'd3';
import { log, getConfig, setupGraphViewbox } from './mermaidUtils';
import svgDraw from './svgDraw';
import { BoundingBox, Layout } from 'non-layered-tidy-tree-layout';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import clone from 'fast-clone';
import * as db from './mindmapDb';

cytoscape.use(fcose);
cytoscape.use(coseBilkent);

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param {object} mindmap The maindmap data and hierarchy
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
 * @param edgesElem
 * @param mindmap
 * @param parent
 * @param depth
 * @param section
 * @param edgesEl
 * @param cy
 * @param conf
 */
// edgesElem, cy, conf
function drawEdges(edgesEl, cy, conf) {
  cy.edges().map((edge, id) => {
    const data = edge.data();
    if (edge[0]._private.bodyBounds) {
      const bounds = edge[0]._private.rscratch;
      log.info(
        id,
        // 'x:',
        // edge.controlPoints(),
        // 'y:',
        // edge[0]._private.rscratch
        // 'w:',
        // edge.boundingbox().w,
        // 'h:',
        // edge.boundingbox().h,
        // edge.midPoint()
        data
      );
      // data.el.attr('transform', `translate(${node.position().x}, ${node.position().y})`);
      // edgesEl
      //   .insert('line')
      //   .attr('x1', bounds.startX)
      //   .attr('y1', bounds.startY)
      //   .attr('x2', bounds.endX)
      //   .attr('y2', bounds.endY)
      //   .attr('class', 'path');
      edgesEl
        .insert('path')
        // Todo use regular line function
        .attr(
          'd',
          `M ${bounds.startX},${bounds.startY} L ${bounds.midX},${bounds.midY} L${bounds.endX},${bounds.endY} `
        )
        .attr('class', 'edge section-edge-' + data.section + ' edge-depth-' + data.depth);
    }
  });
}

/**
 * @param mindmap
 * @param callback
 */
function eachNode(mindmap, callback) {
  callback(mindmap);
  if (mindmap.children) {
    mindmap.children.forEach((child) => {
      eachNode(child, callback);
    });
  }
}

/**
 * @param {any} svg The svg element to draw the diagram onto
 * @param {object} mindmap The maindmap data and hierarchy
 * @param section
 * @param cy
 * @param {object} conf The configuration object
 * @param level
 */
function addNodes(mindmap, cy, conf, level) {
  const node = cy.add({
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
    mindmap.children.forEach((child, index) => {
      addNodes(child, cy, conf, level + 1);
      const edge = cy.add({
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
    // BoundingBox(gap, bottomPadding)
    // const bb = new BoundingBox(10, 10);
    // const layout = new Layout(bb);
    // // const layout = new HorizontalLayout(bb);
    if (node.children.length === 0) {
      return node;
    }

    const cy = cytoscape({
      // styleEnabled: false,
      // animate: false,
      // ready: function () {
      //   log.info('Ready', this);
      // },
      container: document.getElementById('cy'), // container to render in

      style: [
        // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            label: 'data(labelText)',
          },
        },

        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(id)',
          },
        },
      ],
    });
    addNodes(node, cy, conf, 0);

    // Make cytoscape care about the dimensisions of the nodes
    cy.nodes().forEach(function (n) {
      n.layoutDimensions = () => {
        const data = n.data();
        // console.log(
        //   'id',
        //   data.id,
        //   ' node',
        //   data.nodeId,
        //   ' layoutDimensions',
        //   data.width,
        //   'x',
        //   data.height
        // );
        return { w: data.width, h: data.height };
      };
    });

    // // Merge the trees into a single tree
    // mergeTrees(node, trees);
    cy.layout({
      // name: 'grid',
      // name: 'circle',
      // name: 'cose',
      // name: 'fcose',
      name: 'cose-bilkent',
      quality: 'proof',
      // randomize: false,
      // seed: 2,
      // name: 'breadthfirst',
      // headless: true,
      styleEnabled: false,
      animate: false,
    }).run();
    cy.ready((e) => {
      log.info('Ready', e);

      resolve({ positionedMindmap: node, cy });
    });
  });
}
/**
 * @param node
 * @param cy
 * @param positionedMindmap
 * @param conf
 */
function positionNodes(cy, conf) {
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
  // Handle root and Document for when rendering in sanbox mode
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

  const { positionedMindmap, cy } = await layoutMindmap(mm, conf);

  // // After this we can draw, first the edges and the then nodes with the correct position
  drawEdges(edgesElem, cy, conf);
  positionNodes(cy, conf);

  // Setup the view box and size of the svg element
  setupGraphViewbox(undefined, svg, conf.mindmap.padding, conf.mindmap.useMaxWidth);
};

export default {
  draw,
};
