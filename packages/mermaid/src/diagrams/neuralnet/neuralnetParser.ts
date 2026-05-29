import type { Neuralnet } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './neuralnetDb.js';
import type { NeuralnetDB, LayerType, NetworkMode } from './neuralnetTypes.js';

const populateDb = (ast: Neuralnet, db: NeuralnetDB): void => {
  populateCommonDb(ast, db);

  if (ast.mode === 'sequential') {
    db.setMode('sequential');
  } else {
    db.setMode('graph');
  }

  // Register all layer nodes
  for (const node of ast.nodes) {
    db.addNode({
      id: node.id ?? '',
      layerType: node.type as LayerType,
      params: node.params.map((p) => p.value),
    });
  }

  if (ast.mode === 'sequential') {
    // Auto-wire: connect each layer to the next in declaration order
    const order = db.getNodeOrder();
    for (let i = 0; i < order.length - 1; i++) {
      db.addEdge({ from: order[i], to: order[i + 1] });
    }
  } else {
    for (const edge of ast.edges) {
      db.addEdge({ from: edge.from, to: edge.to });
    }
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Neuralnet = await parse('neuralnet', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
