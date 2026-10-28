import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';
import type { OrgChartDB, OrgNode, OrgNodeDeclaration } from './orgchartTypes.js';

interface OrgChartState {
  nodes: Map<string, OrgNode>;
  root?: OrgNode;
  /** Open ancestors of the next node, with the indentation of each. */
  stack: { indent: number; node: OrgNode }[];
  counter: number;
  accTitle: string;
  accDescription: string;
  diagramTitle: string;
  frontmatterLineOffset: number;
}

const createState = (): OrgChartState => ({
  nodes: new Map(),
  stack: [],
  counter: 0,
  accTitle: '',
  accDescription: '',
  diagramTitle: '',
  frontmatterLineOffset: 0,
});

const fail = (line: number, column: number, message: string): never => {
  throw new Error(`Invalid orgchart at line ${line}, column ${column}: ${message}`);
};

export const createOrgChartDb = (): OrgChartDB => {
  let state = createState();
  const clear = (): void => {
    state = createState();
  };

  const addNode = (declaration: OrgNodeDeclaration): void => {
    const { indent, line, column, kind } = declaration;
    const config = getGlobalConfig();
    const label = sanitizeText(declaration.label, config).trim();
    if (!label) {
      fail(line, column, 'a node needs a non-empty label');
    }
    const secondaryLabel = declaration.secondaryLabel
      ? sanitizeText(declaration.secondaryLabel, config).trim() || undefined
      : undefined;

    const id = declaration.id ?? `orgchart-node-${state.counter}`;
    if (state.nodes.has(id)) {
      fail(line, column, `duplicate node id "${id}"`);
    }

    const node: OrgNode = { id, label, secondaryLabel, kind, children: [], staff: [] };

    if (!state.root) {
      if (kind === 'staff') {
        fail(line, column, 'the root node cannot be a staff node');
      }
      state.root = node;
      state.stack = [{ indent, node }];
    } else {
      while (state.stack.length > 0 && state.stack[state.stack.length - 1].indent >= indent) {
        state.stack.pop();
      }
      if (state.stack.length === 0) {
        fail(
          line,
          column,
          'an orgchart must have exactly one root; indent this node below the root'
        );
      }
      const parent = state.stack[state.stack.length - 1].node;
      if (parent.kind === 'staff') {
        fail(line, column, `staff node "${parent.label}" cannot have reports or staff of its own`);
      }
      node.parentId = parent.id;
      (kind === 'staff' ? parent.staff : parent.children).push(node);
      state.stack.push({ indent, node });
    }

    state.counter++;
    state.nodes.set(id, node);
  };

  const setAccTitle = (title: string): void => {
    state.accTitle = sanitizeText(title, getGlobalConfig()).replace(/^\s+/g, '');
  };
  const setAccDescription = (description: string): void => {
    state.accDescription = sanitizeText(description, getGlobalConfig()).replace(/\n\s+/g, '\n');
  };
  const setDiagramTitle = (title: string): void => {
    state.diagramTitle = sanitizeText(title, getGlobalConfig());
  };
  const setFrontmatterLineOffset = (offset: number): void => {
    state.frontmatterLineOffset = offset;
  };

  return {
    preserveCommentsWhenParsing: true,
    clear,
    addNode,
    getRoot: () => state.root,
    getNode: (id) => state.nodes.get(id),
    getNodes: () => [...state.nodes.values()],
    getAccTitle: () => state.accTitle,
    getAccDescription: () => state.accDescription,
    getDiagramTitle: () => state.diagramTitle,
    setAccDescription,
    setAccTitle,
    setDiagramTitle,
    setFrontmatterLineOffset,
    getFrontmatterLineOffset: () => state.frontmatterLineOffset,
  };
};

export const db = createOrgChartDb();
