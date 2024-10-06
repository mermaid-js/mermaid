import cytoscape from 'cytoscape';
// @ts-expect-error No types available
import coseBilkent from 'cytoscape-cose-bilkent';
import { select } from 'd3';
import type { MermaidConfig } from '../../config.type.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import type { D3Element } from '../../types.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { FilledKanbanNode, KanbanDB, KanbanNode } from './kanbanTypes.js';
import { drawNode, positionNode } from './svgDraw.js';
import defaultConfig from '../../defaultConfig.js';

// Inject the layout algorithm into cytoscape

async function drawSection(section: FilledKanbanNode, svg: D3Element, conf: MermaidConfig) {}

declare module 'cytoscape' {
  interface EdgeSingular {
    _private: {
      bodyBounds: unknown;
      rscratch: {
        startX: number;
        startY: number;
        midX: number;
        midY: number;
        endX: number;
        endY: number;
      };
    };
  }
}

function drawEdges(edgesEl: D3Element, cy: cytoscape.Core) {
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

function addNodes(mindmap: KanbanNode, cy: cytoscape.Core, conf: MermaidConfig, level: number) {
  cy.add({
    group: 'nodes',
    data: {
      id: mindmap.id.toString(),
      labelText: mindmap.descr,
      height: mindmap.height,
      width: mindmap.width,
      level: level,
      nodeId: mindmap.id,
      padding: mindmap.padding,
      type: mindmap.type,
    },
    position: {
      x: mindmap.x!,
      y: mindmap.y!,
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

function layoutMindmap(node: KanbanNode, conf: MermaidConfig): Promise<cytoscape.Core> {
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
      // @ts-ignore Types for cose-bilkent are not correct?
      quality: 'proof',
      styleEnabled: false,
      animate: false,
    }).run();
    cy.ready((e) => {
      log.info('Ready', e);
      resolve(cy);
    });
  });
}

function positionNodes(db: KanbanDB, cy: cytoscape.Core) {
  cy.nodes().map((node, id) => {
    const data = node.data();
    data.x = node.position().x;
    data.y = node.position().y;
    positionNode(db, data);
    const el = db.getElementById(data.nodeId);
    log.info('Id:', id, 'Position: (', node.position().x, ', ', node.position().y, ')', data);
    el.attr(
      'transform',
      `translate(${node.position().x - data.width / 2}, ${node.position().y - data.height / 2})`
    );
    el.attr('attr', `apa-${id})`);
  });
}

export const draw: DrawDefinition = async (text, id, _version, diagObj) => {
  log.debug('Rendering mindmap diagram\n' + text);

  const db = diagObj.db as KanbanDB;
  const sections = db.getSections();
  // const sections = db.getData();
  if (!sections) {
    return;
  }

  const conf = getConfig();
  conf.htmlLabels = false;

  const svg = selectSvgElement(id);

  // Draw the graph and start with drawing the nodes without proper position
  // this gives us the size of the nodes and we can set the positions later

  const edgesElem = svg.append('g');
  edgesElem.attr('class', 'sections');
  const nodesElem = svg.append('g');
  nodesElem.attr('class', 'items');
  await drawSections(db, nodesElem, sections as FilledKanbanNode, -1, conf);

  // Next step is to layout the mindmap, giving each node a position

  const cy = await layoutMindmap(sections, conf);

  // After this we can draw, first the edges and the then nodes with the correct position
  drawEdges(edgesElem, cy);
  positionNodes(db, cy);

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    svg,
    conf.mindmap?.padding ?? defaultConfig.mindmap.padding,
    conf.mindmap?.useMaxWidth ?? defaultConfig.mindmap.useMaxWidth
  );
};

export default {
  draw,
};
