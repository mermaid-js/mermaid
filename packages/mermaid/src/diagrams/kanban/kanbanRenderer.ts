import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { selectSvgElement } from '../../rendering-util/selectSvgElement.js';
import { setupGraphViewbox } from '../../setupGraphViewbox.js';
import type { KanbanDB } from './kanbanTypes.js';
import defaultConfig from '../../defaultConfig.js';
import { insertCluster } from '../../rendering-util/rendering-elements/clusters.js';
import { insertNode, positionNode } from '../../rendering-util/rendering-elements/nodes.js';
import type { ClusterNode } from '../../rendering-util/types.js';

export const draw: DrawDefinition = async (text, id, _version, diagObj) => {
  log.debug('Rendering kanban diagram\n' + text);

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
  const sections = data4Layout.nodes.filter(
    // TODO: TypeScript 5.5 will infer this predicate automatically
    (node): node is typeof node & ClusterNode => node.isGroup
  );
  let cnt = 0;
  // TODO set padding
  const padding = 10;

  const sectionObjects = [];
  let maxLabelHeight = 25;
  for (const section of sections) {
    const WIDTH = conf?.kanban?.sectionWidth || 200;
    // const top = (-WIDTH * 3) / 2 + 25;
    // let y = top;
    cnt = cnt + 1;
    section.x = WIDTH * cnt + ((cnt - 1) * padding) / 2;
    section.width = WIDTH;
    section.y = 0;
    section.height = WIDTH * 3;
    section.rx = 5;
    section.ry = 5;

    // Todo, use theme variable THEME_COLOR_LIMIT instead of 10
    section.cssClasses = section.cssClasses + ' section-' + cnt;
    const sectionObj = await insertCluster(sectionsElem, section);
    maxLabelHeight = Math.max(maxLabelHeight, sectionObj?.labelBBox?.height);
    sectionObjects.push(sectionObj);
  }
  let i = 0;
  for (const section of sections) {
    const sectionObj = sectionObjects[i];
    i = i + 1;
    const WIDTH = conf?.kanban?.sectionWidth || 200;
    const top = (-WIDTH * 3) / 2 + maxLabelHeight;
    let y = top;
    const sectionItems = data4Layout.nodes.filter((node) => node.parentId === section.id);
    for (const item of sectionItems) {
      if (item.isGroup) {
        // Kanban diagrams should not have groups within groups
        // this should never happen
        throw new Error('Groups within groups are not allowed in Kanban diagrams');
      }
      item.x = section.x;
      item.width = WIDTH - 1.5 * padding;
      const nodeEl = await insertNode(nodesElem, item, { config: conf });
      const bbox = nodeEl.node()!.getBBox();
      item.y = y + bbox.height / 2;
      await positionNode(item);
      y = item.y + bbox.height / 2 + padding / 2;
    }
    const rect = sectionObj.cluster.select('rect');
    const height = Math.max(y - top + 3 * padding, 50) + (maxLabelHeight - 25);
    rect.attr('height', height);
  }

  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    svg,
    conf.mindmap?.padding ?? defaultConfig.kanban.padding,
    conf.mindmap?.useMaxWidth ?? defaultConfig.kanban.useMaxWidth
  );
};

export default {
  draw,
};
