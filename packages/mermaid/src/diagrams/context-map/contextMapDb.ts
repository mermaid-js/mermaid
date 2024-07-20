import { type RawLink } from './contextMap.js';

let contextMap: string | undefined = undefined;
let nodes: { id: string }[] = [];
let edges: RawLink[] = [];

export function setContextMapName(name: string) {
  contextMap = name;
}

export function addNode(name: string) {
  nodes.push({ id: name });
}

export function addEdge(obj: RawLink) {
  edges.push(obj);
}

interface ContextMap {
  contextMap: string | undefined;
  nodes: typeof nodes;
  edges: typeof edges;
}
export function getGraph(): ContextMap {
  return { contextMap, nodes, edges };
}

export function clear() {
  nodes = [];
  edges = [];
  contextMap = undefined;
}

const contextMapDb = {
  setContextMapName,
  addNode,
  addEdge,
  getGraph,
  clear,
};

export type ContextMapDb = typeof contextMapDb;

export default contextMapDb;
