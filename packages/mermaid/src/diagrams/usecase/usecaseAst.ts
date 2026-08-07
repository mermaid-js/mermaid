import type {
  Actor,
  GraphAST,
  GraphGroup,
  GraphNode,
  GraphStatement,
  Span,
  UseCase,
  UsecaseDB,
} from './usecaseTypes.js';

const findGroupStatement = (
  statements: GraphStatement[],
  groupId: string
): GraphStatement | undefined => {
  for (const statement of statements) {
    if (statement.kind === 'group' && statement.group === groupId) {
      return statement;
    }
    if (statement.children) {
      const match = findGroupStatement(statement.children, groupId);
      if (match) {
        return match;
      }
    }
  }
  return undefined;
};

const actorGraphNode = (actor: Actor): GraphNode => {
  const attrs: Record<string, unknown> = { kind: 'actor' };
  if (actor.metadata) {
    attrs.metadata = { ...actor.metadata };
  }
  const node: GraphNode = {
    shape: actor.metadata?.icon ? 'actor-icon' : 'actor',
    attrs,
  };
  if (actor.name !== actor.id) {
    node.label = actor.name;
  }
  if (actor.styles) {
    node.styles = [...actor.styles];
  }
  return node;
};

const useCaseGraphNode = (useCase: UseCase): GraphNode => {
  const node: GraphNode = {
    shape: 'ellipse',
    attrs: { kind: 'usecase' },
  };
  if (useCase.name !== useCase.id) {
    node.label = useCase.name;
  }
  if (useCase.classes) {
    node.classes = [...useCase.classes];
  }
  if (useCase.styles) {
    node.styles = [...useCase.styles];
  }
  return node;
};

const buildGraphNodes = (db: UsecaseDB): Record<string, GraphNode> => {
  const nodes: Record<string, GraphNode> = {};
  for (const actor of db.getActors().values()) {
    nodes[actor.id] = actorGraphNode(actor);
  }
  for (const useCase of db.getUseCases().values()) {
    nodes[useCase.id] = useCaseGraphNode(useCase);
  }
  return nodes;
};

const buildGraphGroups = (
  db: UsecaseDB,
  source: string,
  statements: GraphStatement[]
): Record<string, GraphGroup> => {
  const groups: Record<string, GraphGroup> = {};
  for (const boundary of db.getSystemBoundaries().values()) {
    const statement = findGroupStatement(statements, boundary.id);
    const title = statement?.titleSpan
      ? source.slice(statement.titleSpan[0], statement.titleSpan[1])
      : boundary.name;
    groups[boundary.id] = {
      ...(title === boundary.id ? {} : { title }),
      nodes: [...boundary.useCases],
      attrs: { type: boundary.type ?? 'rect' },
    };
  }
  return groups;
};

const buildClassDefs = (db: UsecaseDB): GraphAST['classDefs'] => {
  const classDefs: GraphAST['classDefs'] = {};
  for (const classDef of db.getClassDefs().values()) {
    classDefs[classDef.id] = { styles: [...classDef.styles] };
  }
  return classDefs;
};

export const buildUsecaseGraphAST = (
  db: UsecaseDB,
  source: string,
  headerSpan: Span,
  statements: GraphStatement[]
): GraphAST => {
  const nodes = buildGraphNodes(db);

  const edges = db.getRelationships().map((relationship) => ({
    id: relationship.id,
    source: relationship.from,
    target: relationship.to,
    ...(relationship.label ? { label: relationship.label } : {}),
    attrs: {
      relationshipType: relationship.type,
      arrowType: relationship.arrowType,
    },
  }));

  const groups = buildGraphGroups(db, source, statements);
  const classDefs = buildClassDefs(db);
  const direction = db.getDirection();

  return {
    version: 1,
    diagramType: 'usecase',
    source,
    header: {
      keyword: 'usecase',
      direction: direction === 'TD' ? 'TB' : direction,
      span: headerSpan,
    },
    nodes,
    edges,
    groups,
    classDefs,
    statements,
  };
};
