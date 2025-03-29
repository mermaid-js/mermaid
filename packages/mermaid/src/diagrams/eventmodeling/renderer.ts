import type { BaseType, Selection } from 'd3';
import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
// import type d3 from 'd3';

import type { EventModelingDB, Box, Relation, Swimlane, DiagramProps } from './types.js';

const DEFAULT_CONFIG = getConfig();
const DEFAULT_EVENTMODELING_CONFIG = DEFAULT_CONFIG?.eventmodeling;

function renderD3Box(
  diagram: Selection<BaseType, unknown, HTMLElement, any>,
  diagramProps: DiagramProps
) {
  return (box: Box) => {
    const y = box.swimlane.y + diagramProps.swimlanePadding;

    const g = diagram.append('g').attr('class', 'em-box');

    g.append('rect')
      .attr('x', box.x)
      .attr('y', y)
      .attr('rx', '3')
      .attr('width', box.dimension.width)
      .attr('height', box.dimension.height)
      .attr('stroke', box.visual.stroke)
      .attr('fill', box.visual.fill);
    // .attr('stroke', '#000');

    // g.append('text')
    //   .attr('font-weight', diagramProps.boxTextFontWeight)
    //   .attr('x', box.x + 10)
    //   .attr('y', box.y + 20)
    //   .text(box.text);

    const f = g
      .append('foreignObject')
      .attr('x', box.x + diagramProps.boxPadding)
      .attr('y', y + 10)
      .attr('width', box.dimension.width - 2 * diagramProps.boxPadding)
      .attr('height', box.dimension.height - 2 * diagramProps.boxPadding);

    const text = f
      .append('xhtml:div')
      .style('display', 'table')
      .style('height', '100%')
      .style('width', '100%');

    text
      .append('span')
      .style('display', 'table-cell')
      .style('text-align', 'left')
      .style('vertical-align', 'middle')
      .html(box.text);
  };
}

function dirUpwards(sourceY: number, targetY: number): boolean {
  return sourceY > targetY;
}

function renderD3Relation(
  diagram: Selection<BaseType, unknown, HTMLElement, any>,
  diagramProps: DiagramProps
) {
  return (relation: Relation) => {
    const sourceBoxY = relation.sourceBox.swimlane.y + diagramProps.swimlanePadding;
    const targetBoxY = relation.targetBox.swimlane.y + diagramProps.swimlanePadding;

    const upwards = dirUpwards(sourceBoxY, targetBoxY);

    const sourceX = relation.sourceBox.x + (relation.sourceBox.dimension.width * 2) / 3;
    const targetX = relation.targetBox.x + relation.targetBox.dimension.width / 3;

    let sourceY;
    let targetY;

    log.debug(`rendering relation up=${upwards} for `, {
      sourceBox: relation.sourceBox,
      targetBox: relation.targetBox,
    });
    if (upwards) {
      sourceY = sourceBoxY;
      targetY = targetBoxY + relation.targetBox.dimension.height;
    } else {
      sourceY = sourceBoxY + relation.sourceBox.dimension.height;
      targetY = targetBoxY;
    }

    diagram
      .append('path')
      .attr('class', 'em-relation')
      .attr('fill', relation.visual.fill)
      .attr('stroke', relation.visual.stroke)
      .attr('stroke-width', '1')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('d', `M${sourceX} ${sourceY} L${targetX} ${targetY}`);
  };
}

function renderD3Swimlane(
  diagram: Selection<BaseType, unknown, HTMLElement, any>,
  maxR: number,
  diagramProps: DiagramProps
) {
  return (swimlane: Swimlane) => {
    const g = diagram.append('g').attr('class', 'em-swimlane');

    g.append('rect')
      .attr('x', 0)
      .attr('y', swimlane.y)
      .attr('rx', '3')
      .attr('width', maxR + diagramProps.swimlanePadding)
      .attr('height', swimlane.height)
      // .attr('stroke', box.visual.stroke)
      .attr('fill', 'rgb(250,250,250)')
      .attr('stroke', 'rgb(240,240,240)');

    g.append('text')
      .attr('font-weight', diagramProps.swimlaneTextFontWeight)
      .attr('x', 30)
      .attr('y', swimlane.y + 30)
      .text(swimlane.label);
  };
}

export const draw: DrawDefinition = function (txt, id, ver, diagObj) {
  log.debug('in eventmodeling renderer', txt + '\n', 'id:', id, ver);
  if (!DEFAULT_EVENTMODELING_CONFIG) {
    throw new Error('EventModeling config not found');
  }
  // const rotateCommitLabel = DEFAULT_GITGRAPH_CONFIG.rotateCommitLabel ?? false;
  const db = diagObj.db as EventModelingDB;

  const diagram: Selection<BaseType, unknown, HTMLElement, any> = select(`[id="${id}"]`);

  const diagramProps = db.getDiagramProps();
  const state = db.getState();

  state.sortedSwimlanesArray.forEach(renderD3Swimlane(diagram, state.maxR, diagramProps));
  state.boxes.forEach(renderD3Box(diagram, diagramProps));
  state.relations.forEach(renderD3Relation(diagram, diagramProps));

  const marker = diagram
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', '10')
    .attr('markerHeight', '7')
    .attr('refX', '10')
    .attr('refY', '3.5')
    .attr('orient', 'auto');

  marker.append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', '#000');

  // utils.insertTitle(
  //   diagram,
  //   'gitTitleText',
  //   DEFAULT_GITGRAPH_CONFIG.titleTopMargin ?? 0,
  //   db.getDiagramTitle()
  // );
  //
  // Setup the view box and size of the svg element
  setupGraphViewbox(undefined, diagram, 30, undefined);
};

export default {
  draw,
};
