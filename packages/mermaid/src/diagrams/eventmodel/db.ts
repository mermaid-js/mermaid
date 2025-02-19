import { block } from 'marked';
import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { ImperativeState } from '../../utils/imperativeState.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import { eventModel } from './detector.js';
import type { EventModelData, EventModelDB } from './types.js';
import type { EdgeSet, System, Pattern } from '@mermaid-js/parser';


type Edge = EventModelData['edges'][number];
type Node = EventModelData['nodes'][string];

const data = new ImperativeState((): EventModelData => ({
  nodes: {},
  edges: [],
}));

const getEdges = (block: EdgeSet): Edge[] => {
  const sources = block.from.flatMap(({ targets }) => targets);
  const destinations = block.to.flatMap(({ targets }) => targets);
  return sources.flatMap(from => destinations.map(to => ({ from, to })));
}

const getSystemNodes = (block: System): Record<string, Node> => {
  
}


export const db: EventModelDB = {
  clear() {
    data.reset();
    commonClear();
  },
  getConfig() {
    return { ...DEFAULT_CONFIG.eventModel, ...commonGetConfig() }
  },
  addBlock(block) {
    switch (block.$type) {
      case 'Query':
      case 'Command':
      case 'Trigger':
        data.records.nodes[block.name.name] = {
          type: block.$type === 'Trigger' ? 'AutomatedTrigger' : block.$type,
          name: block.name.name,
          displayName: block.name.displayName,
        }
        return true;
      case 'Pattern':
        data.records.nodes = { ...data.records.nodes, ...getPatternNodes(block) };
        return true;
      case 'System':
        data.records.nodes = { ...data.records.nodes, ...getSystemNodes(block) };
        return true;
      case 'EdgeSet':
        data.records.edges = [...data.records.edges, ...getEdges(block)];
        return true;
    }
  },
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
