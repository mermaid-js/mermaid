import type cytoscape from 'cytoscape';
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
import type { KanbanDB, KanbanNode } from './kanbanTypes.js';
import defaultConfig from '../../defaultConfig.js';
import { insertCluster, positionCluster } from '../../rendering-util/rendering-elements/clusters';
import { insertNode, positionNode } from '../../rendering-util/rendering-elements/nodes';

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

export const draw: DrawDefinition = async (text, id, _version, diagObj) => {
  log.debug('Rendering mindmap diagram\n' + text);

  const db = diagObj.db as KanbanDB;
  const data4Layout = db.getData();

  const conf = getConfig();
  conf.htmlLabels = false;

  const svg = selectSvgElement(id);

  // Draw the graph and start with drawing the nodes without proper position
  // this gives us the size of the nodes and we can set the positions later

  const sectionsElem = svg.append('g');
  sectionsElem.attr('class', 'sections');
  const nodesElem = svg.append('g');
  nodesElem.attr('class', 'items');
  const sections = data4Layout.nodes.filter((node) => node.isGroup);
  let cnt = 0;
  // TODO set padding
  const padding = 10;

  for (const section of sections) {
    let y = 0;
    cnt = cnt + 1;
    const WIDTH = 300;
    section.x = WIDTH * cnt + ((cnt - 1) * padding) / 2;
    section.width = WIDTH;
    section.y = 0;
    section.height = WIDTH;
    section.rx = 5;
    section.ry = 5;

    // Todo, use theme variable THEME_COLOR_LIMIT instead of 10
    section.cssClasses = section.cssClasses + ' section-' + cnt;
    const cluster = await insertCluster(sectionsElem, section);
    const sectionItems = data4Layout.nodes.filter((node) => node.parentId === section.id);
    // positionCluster(section);
    for (const item of sectionItems) {
      item.x = section.x;
      item.width = WIDTH - padding * 2;
      // item.height = 100;
      const nodeEl = await insertNode(nodesElem, item);
      console.log('ITEM', item, 'bbox=', nodeEl.node().getBBox());
      item.y = y;
      item.height = 150;
      await positionNode(item);
      y = y + 1.5 * nodeEl.node().getBBox().height + padding / 2;
    }
  }

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
