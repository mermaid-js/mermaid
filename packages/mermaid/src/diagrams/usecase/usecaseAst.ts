import { ARROW_TYPE } from './usecaseTypes.js';
import type {
  Actor,
  ClassDef,
  Direction,
  GraphAST,
  GraphEdge,
  GraphGroup,
  GraphNode,
  GraphStatement,
  Relationship,
  Span,
  SystemBoundary,
  UseCase,
  UsecaseJsonNode,
  UsecaseNote,
} from './usecaseTypes.js';

export interface UsecaseModelReader {
  getActors(): ReadonlyMap<string, Actor>;
  getUseCases(): ReadonlyMap<string, UseCase>;
  getSystemBoundaries(): ReadonlyMap<string, SystemBoundary>;
  getRelationships(): readonly Relationship[];
  getNotes(): ReadonlyMap<string, UsecaseNote>;
  getJsonNodes(): ReadonlyMap<string, UsecaseJsonNode>;
  getClassDefs(): ReadonlyMap<string, ClassDef>;
  getDirection(): Direction;
  getAccTitle(): string;
  getAccDescription(): string;
}

const actorNode = (actor: Actor): GraphNode => ({
  shape:
    actor.type === 'normal'
      ? 'actor'
      : actor.type === 'hollow'
        ? 'actor-hollow'
        : actor.type === 'awesome'
          ? 'actor-awesome'
          : 'actor-icon',
  ...(actor.label === actor.id ? {} : { label: actor.label }),
  ...(actor.classes.length ? { classes: [...actor.classes] } : {}),
  ...(actor.styles.length ? { styles: [...actor.styles] } : {}),
  attrs: {
    kind: 'actor',
    actorType: actor.type,
    business: actor.business,
    labelType: actor.labelType,
    ...(actor.icon ? { icon: actor.icon } : {}),
    ...(actor.stereotype ? { stereotype: actor.stereotype } : {}),
    ...(actor.parentId ? { parentId: actor.parentId } : {}),
  },
});

const useCaseNode = (useCase: UseCase): GraphNode => ({
  shape: useCase.shape,
  ...(useCase.label === useCase.id ? {} : { label: useCase.label }),
  ...(useCase.classes.length ? { classes: [...useCase.classes] } : {}),
  ...(useCase.styles.length ? { styles: [...useCase.styles] } : {}),
  attrs: {
    kind: 'usecase',
    useCaseShape: useCase.shape,
    business: useCase.business,
    labelType: useCase.labelType,
    ...(useCase.stereotype ? { stereotype: useCase.stereotype } : {}),
    ...(useCase.parentId ? { parentId: useCase.parentId } : {}),
  },
});

const noteNode = (note: UsecaseNote): GraphNode => ({
  label: note.label,
  shape: 'note',
  attrs: { kind: 'note', target: note.target, labelType: note.labelType },
});

const jsonNode = (json: UsecaseJsonNode): GraphNode => ({
  label: json.id,
  shape: 'json-table',
  ...(json.classes.length ? { classes: [...json.classes] } : {}),
  ...(json.styles.length ? { styles: [...json.styles] } : {}),
  attrs: { kind: 'json', value: json.value, propertyOrder: json.propertyOrder, labelType: 'text' },
});

const relationshipEdge = (relationship: Relationship): GraphEdge => ({
  id: relationship.id,
  source: relationship.source,
  target: relationship.target,
  ...(relationship.label ? { label: relationship.label } : {}),
  ...(relationship.classes.length ? { classes: [...relationship.classes] } : {}),
  ...(relationship.styles.length ? { styles: [...relationship.styles] } : {}),
  attrs: {
    relationshipType: relationship.type,
    arrowType: relationship.arrowType,
    minlen: relationship.minlen,
    explicitId: relationship.explicitId,
    animate: relationship.animate,
    ...(relationship.animation ? { animation: relationship.animation } : {}),
    ...(relationship.labelType ? { labelType: relationship.labelType } : {}),
  },
});

const noteEdge = (note: UsecaseNote): GraphEdge => ({
  id: `${note.id}-edge`,
  source: note.id,
  target: note.target,
  attrs: {
    relationshipType: 'note',
    arrowType: ARROW_TYPE.LINE_SOLID,
    pattern: 'dotted',
    minlen: 1,
    explicitId: false,
    animate: false,
    internal: true,
  },
});

export const buildUsecaseGraphAST = (
  model: UsecaseModelReader,
  source: string,
  headerSpan: Span,
  statements: GraphStatement[]
): GraphAST => {
  const nodes: Record<string, GraphNode> = {};
  for (const actor of model.getActors().values()) {
    nodes[actor.id] = actorNode(actor);
  }
  for (const useCase of model.getUseCases().values()) {
    nodes[useCase.id] = useCaseNode(useCase);
  }
  for (const note of model.getNotes().values()) {
    nodes[note.id] = noteNode(note);
  }
  for (const json of model.getJsonNodes().values()) {
    nodes[json.id] = jsonNode(json);
  }

  const groups: Record<string, GraphGroup> = {};
  for (const boundary of model.getSystemBoundaries().values()) {
    groups[boundary.id] = {
      ...(boundary.label === boundary.id ? {} : { title: boundary.label }),
      nodes: [...boundary.members],
      ...(boundary.classes.length ? { classes: [...boundary.classes] } : {}),
      ...(boundary.styles.length ? { styles: [...boundary.styles] } : {}),
      attrs: {
        kind: 'systemBoundary',
        boundaryType: boundary.type,
        labelType: boundary.labelType,
      },
    };
  }

  const classDefs: GraphAST['classDefs'] = {};
  for (const definition of model.getClassDefs().values()) {
    classDefs[definition.id] = { styles: [...definition.styles] };
  }
  const direction = model.getDirection();
  return {
    version: 1,
    diagramType: 'usecase',
    source,
    header: {
      keyword: 'usecase',
      direction: direction === 'TD' ? 'TB' : direction,
      span: headerSpan,
    },
    ...(model.getAccTitle() ? { accTitle: model.getAccTitle() } : {}),
    ...(model.getAccDescription() ? { accDescr: model.getAccDescription() } : {}),
    nodes,
    edges: [
      ...model.getRelationships().map(relationshipEdge),
      ...[...model.getNotes().values()].map(noteEdge),
    ],
    groups,
    classDefs,
    statements,
  };
};
