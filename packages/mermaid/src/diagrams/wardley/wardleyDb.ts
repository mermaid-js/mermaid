import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { WardleyAxesConfig } from './wardleyBuilder.js';
import { WardleyBuilder } from './wardleyBuilder.js';

const builder = new WardleyBuilder();

function getConfig() {
  return getGlobalConfig()['wardley-beta'];
}

function addNode(
  id: string,
  label: string,
  x: number,
  y: number,
  className?: string,
  labelOffsetX?: number,
  labelOffsetY?: number,
  inertia?: boolean,
  sourceStrategy?: 'build' | 'buy' | 'outsource' | 'market'
) {
  builder.addNode({
    id,
    label,
    x,
    y,
    className,
    labelOffsetX,
    labelOffsetY,
    inertia,
    sourceStrategy,
  });
}

function addLink(
  sourceId: string,
  targetId: string,
  dashed = false,
  label?: string,
  flow?: 'forward' | 'backward' | 'bidirectional'
) {
  builder.addLink({
    source: sourceId,
    target: targetId,
    dashed,
    label,
    flow,
  });
}

function addTrend(nodeId: string, targetX: number, targetY: number) {
  builder.addTrend({ nodeId, targetX, targetY });
}

function addAnnotation(number: number, coordinates: { x: number; y: number }[], text?: string) {
  builder.addAnnotation({
    number,
    coordinates,
    text,
  });
}

function addNote(text: string, x: number, y: number) {
  builder.addNote({
    text,
    x,
    y,
  });
}

function addAccelerator(name: string, x: number, y: number) {
  builder.addAccelerator({
    name,
    x,
    y,
  });
}

function addDeaccelerator(name: string, x: number, y: number) {
  builder.addDeaccelerator({
    name,
    x,
    y,
  });
}

function setAnnotationsBox(x: number, y: number) {
  builder.setAnnotationsBox(x, y);
}

function setSize(width: number, height: number) {
  builder.setSize(width, height);
}

function startPipeline(nodeId: string) {
  builder.startPipeline(nodeId);
}

function addPipelineComponent(pipelineNodeId: string, componentId: string) {
  builder.addPipelineComponent(pipelineNodeId, componentId);
}

function updateAxes(partial: WardleyAxesConfig) {
  builder.setAxes(partial);
}

function getNode(id: string) {
  return builder.getNode(id);
}

function resolveNodeId(name: string) {
  return builder.resolveNodeId(name);
}

function getWardleyData() {
  return builder.build();
}

function clear() {
  builder.clear();
  commonClear();
}

export default {
  getConfig,
  addNode,
  addLink,
  addTrend,
  addAnnotation,
  addNote,
  addAccelerator,
  addDeaccelerator,
  setAnnotationsBox,
  setSize,
  startPipeline,
  addPipelineComponent,
  updateAxes,
  getNode,
  resolveNodeId,
  getWardleyData,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
