import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type {
  Actor,
  ClassDef,
  Direction,
  GraphAST,
  Relationship,
  SystemBoundary,
  UseCase,
  UsecaseDB,
  UsecaseFields,
  UsecaseJsonNode,
  UsecaseJsonRow,
  UsecaseLayoutData,
  UsecaseLayoutEdge,
  UsecaseLayoutNode,
  UsecaseNote,
} from './usecaseTypes.js';
import { DEFAULT_DIRECTION, ARROW_TYPE } from './usecaseTypes.js';
import type { UsecaseDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';

export const DEFAULT_USECASE_CONFIG: Required<UsecaseDiagramConfig> = DEFAULT_CONFIG.usecase;

const createModel = (): UsecaseFields => ({
  actors: new Map(),
  useCases: new Map(),
  systemBoundaries: new Map(),
  relationships: [],
  notes: new Map(),
  jsonNodes: new Map(),
  classDefs: new Map(),
  symbols: new Map(),
  direction: DEFAULT_DIRECTION,
  relationshipCounter: 0,
  noteCounter: 0,
  accTitle: '',
  accDescription: '',
  ast: undefined,
  config: structuredClone(DEFAULT_USECASE_CONFIG),
});

const assertCompleteModel = (model: UsecaseFields): void => {
  if (
    !(model.actors instanceof Map) ||
    !(model.useCases instanceof Map) ||
    !(model.systemBoundaries instanceof Map) ||
    !Array.isArray(model.relationships) ||
    !(model.notes instanceof Map) ||
    !(model.jsonNodes instanceof Map) ||
    !(model.classDefs instanceof Map) ||
    !(model.symbols instanceof Map) ||
    !['TB', 'TD', 'BT', 'RL', 'LR'].includes(model.direction) ||
    !Number.isSafeInteger(model.relationshipCounter) ||
    model.relationshipCounter < 0 ||
    !Number.isSafeInteger(model.noteCounter) ||
    model.noteCounter < 0 ||
    typeof model.accTitle !== 'string' ||
    typeof model.accDescription !== 'string' ||
    !model.config
  ) {
    throw new Error('Cannot commit an incomplete usecase model');
  }
};

let state = createModel();

const getConfig = (): Required<UsecaseDiagramConfig> => structuredClone(state.config);
const getAST = (): GraphAST | undefined => state.ast;

const commit = (model: UsecaseFields): void => {
  const nextState = structuredClone(model);
  assertCompleteModel(nextState);
  const previousAccTitle = getAccTitle();
  const previousAccDescription = getAccDescription();
  try {
    setAccTitle(nextState.accTitle);
    setAccDescription(nextState.accDescription);
    state = nextState;
  } catch (error) {
    setAccTitle(previousAccTitle);
    setAccDescription(previousAccDescription);
    throw error;
  }
};

const clear = (): void => {
  state = createModel();
  commonClear();
};

const getActors = (): ReadonlyMap<string, Actor> => state.actors;
const getActor = (id: string): Actor | undefined => state.actors.get(id);
const getUseCases = (): ReadonlyMap<string, UseCase> => state.useCases;
const getUseCase = (id: string): UseCase | undefined => state.useCases.get(id);
const getSystemBoundaries = (): ReadonlyMap<string, SystemBoundary> => state.systemBoundaries;
const getSystemBoundary = (id: string): SystemBoundary | undefined =>
  state.systemBoundaries.get(id);
const getRelationships = (): readonly Relationship[] => state.relationships;
const getNotes = (): ReadonlyMap<string, UsecaseNote> => state.notes;
const getNote = (id: string): UsecaseNote | undefined => state.notes.get(id);
const getJsonNodes = (): ReadonlyMap<string, UsecaseJsonNode> => state.jsonNodes;
const getJsonNode = (id: string): UsecaseJsonNode | undefined => state.jsonNodes.get(id);
const getClassDefs = (): ReadonlyMap<string, ClassDef> => state.classDefs;
const getClassDef = (id: string): ClassDef | undefined => state.classDefs.get(id);
const getDirection = (): Direction => state.direction;

const getCompiledStyles = (classNames: readonly string[]): string[] => {
  const compiled = new Map<string, string>();
  for (const className of ['default', ...classNames]) {
    const definition = state.classDefs.get(className);
    if (!definition) {
      continue;
    }
    for (const rawStyle of definition.styles) {
      const style = rawStyle.trim();
      const separator = style.indexOf(':');
      const property = (separator === -1 ? style : style.slice(0, separator)).trim();
      if (property) {
        compiled.set(property, style);
      }
    }
  }
  return [...compiled.values()];
};

const escapeJsonPointerPart = (part: string): string =>
  part.replaceAll('~', '~0').replaceAll('/', '~1');

const displayJsonScalar = (value: string | number | boolean | null): string =>
  typeof value === 'string' ? value : value === null ? 'null' : String(value);

type JsonCellSanitizer = (value: string) => string;

/**
 * Flattens a JSON object once into renderer-ready rows. The supplied sanitizer keeps this helper
 * deterministic and makes the security policy an explicit conversion input.
 */
const flattenJsonRows = (
  value: Record<string, unknown>,
  propertyOrder: Readonly<Record<string, readonly string[]>>,
  sanitize: JsonCellSanitizer = (cell) => cell
): UsecaseJsonRow[] => {
  const rows: UsecaseJsonRow[] = [];

  const append = (key: string, accessibleKey: string, cellValue: string): void => {
    rows.push({
      key: sanitize(key),
      accessibleKey: sanitize(accessibleKey),
      value: sanitize(cellValue),
    });
  };

  const visit = (current: unknown, path: string, pointer: string): void => {
    if (Array.isArray(current)) {
      if (current.length === 0) {
        append(path, path, '[]');
        return;
      }

      const scalarArray = current.every(
        (item) => item === null || ['string', 'number', 'boolean'].includes(typeof item)
      );
      if (scalarArray) {
        for (const [index, element] of current.entries()) {
          append(
            index === 0 ? path : '',
            path,
            displayJsonScalar(element as string | number | boolean | null)
          );
        }
        return;
      }

      for (const [index, element] of current.entries()) {
        visit(element, `${path}[${index}]`, `${pointer}/${index}`);
      }
      return;
    }

    if (current !== null && typeof current === 'object') {
      const object = current as Record<string, unknown>;
      const keys = propertyOrder[pointer] ?? Object.keys(object);
      if (keys.length === 0) {
        append(path, path, '{}');
        return;
      }

      for (const key of keys) {
        const childPath = path ? `${path}.${key}` : key;
        visit(object[key], childPath, `${pointer}/${escapeJsonPointerPart(key)}`);
      }
      return;
    }

    append(path, path, displayJsonScalar(current as string | number | boolean | null));
  };

  visit(value, '', '');
  return rows;
};

const actorShape = (actor: Actor): UsecaseLayoutNode['shape'] => {
  switch (actor.type) {
    case 'hollow':
      return 'usecaseActorHollow';
    case 'awesome':
      return 'usecaseActorAwesome';
    case 'icon':
      return 'usecaseActorIcon';
    case 'normal':
      return 'usecaseActor';
  }
};

const useCaseShape = (useCase: UseCase): UsecaseLayoutNode['shape'] =>
  useCase.business && useCase.shape === 'ellipse' ? 'usecaseBusiness' : useCase.shape;

const associationMarkers = (
  arrowType: Relationship['arrowType']
): Pick<UsecaseLayoutEdge, 'arrowTypeStart' | 'arrowTypeEnd'> => {
  switch (arrowType) {
    case ARROW_TYPE.SOLID_ARROW:
      return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_point' };
    case ARROW_TYPE.BACK_ARROW:
      return { arrowTypeStart: 'arrow_point', arrowTypeEnd: 'none' };
    case ARROW_TYPE.CIRCLE_ARROW:
      return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_circle' };
    case ARROW_TYPE.CROSS_ARROW:
      return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_cross' };
    case ARROW_TYPE.CIRCLE_ARROW_REVERSED:
      return { arrowTypeStart: 'arrow_circle', arrowTypeEnd: 'none' };
    case ARROW_TYPE.CROSS_ARROW_REVERSED:
      return { arrowTypeStart: 'arrow_cross', arrowTypeEnd: 'none' };
    case ARROW_TYPE.LINE_SOLID:
      return { arrowTypeStart: 'none', arrowTypeEnd: 'none' };
  }
};

const relationshipVisuals = (
  relationship: Relationship
): Pick<
  UsecaseLayoutEdge,
  'arrowTypeStart' | 'arrowTypeEnd' | 'pattern' | 'label' | 'labelType'
> => {
  switch (relationship.type) {
    case 'include':
    case 'extend':
      return {
        arrowTypeStart: 'none',
        arrowTypeEnd: 'arrow_point',
        pattern: 'dotted',
        label: relationship.type,
        labelType: 'text',
      };
    case 'generalization':
      return {
        arrowTypeStart: 'none',
        arrowTypeEnd: 'extension',
        pattern: 'solid',
      };
    case 'association':
      return {
        ...associationMarkers(relationship.arrowType),
        pattern: 'solid',
        ...(relationship.label ? { label: relationship.label } : {}),
        ...(relationship.labelType ? { labelType: relationship.labelType } : {}),
      };
  }
};

const animationClasses = (relationship: Relationship): string[] =>
  relationship.animate || relationship.animation
    ? [`edge-animation-${relationship.animation ?? 'fast'}`]
    : [];

const classNames = (...names: (string | false | undefined)[]): string =>
  names.filter((name): name is string => Boolean(name)).join(' ');

// Convert the committed use-case model to the unified renderer contract without semantic re-parsing.
const getData = (): UsecaseLayoutData => {
  const globalConfig = getGlobalConfig();
  const config: Required<UsecaseDiagramConfig> = {
    ...state.config,
    ...globalConfig.usecase,
  };
  const sanitize = (value: string): string => sanitizeText(value, globalConfig);
  const endpointLabel = (id: string): string =>
    sanitize(
      state.actors.get(id)?.label ??
        state.useCases.get(id)?.label ??
        state.jsonNodes.get(id)?.id ??
        state.notes.get(id)?.label ??
        id
    );
  const nodes: UsecaseLayoutData['nodes'] = [];
  const edges: UsecaseLayoutEdge[] = [];

  for (const actor of state.actors.values()) {
    nodes.push({
      id: actor.id,
      label: sanitize(actor.label),
      labelType: actor.labelType,
      shape: actorShape(actor),
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: classNames(
        'default',
        'usecase-actor',
        `usecase-actor-${actor.type}`,
        actor.business && 'usecase-business',
        ...actor.classes
      ),
      cssStyles: [...actor.styles],
      cssCompiledStyles: getCompiledStyles(actor.classes),
      actorType: actor.type,
      business: actor.business,
      ...(actor.icon ? { icon: actor.icon } : {}),
      ...(actor.stereotype ? { stereotype: sanitize(actor.stereotype) } : {}),
      ...(actor.parentId ? { parentId: actor.parentId } : {}),
    });
  }

  for (const useCase of state.useCases.values()) {
    nodes.push({
      id: useCase.id,
      label: sanitize(useCase.label),
      labelType: useCase.labelType,
      shape: useCaseShape(useCase),
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: classNames(
        'default',
        'usecase-element',
        `usecase-${useCase.shape}`,
        useCase.business && 'usecase-business',
        ...useCase.classes
      ),
      cssStyles: [...useCase.styles],
      cssCompiledStyles: getCompiledStyles(useCase.classes),
      business: useCase.business,
      ...(useCase.stereotype ? { stereotype: sanitize(useCase.stereotype) } : {}),
      ...(useCase.parentId ? { parentId: useCase.parentId } : {}),
    });
  }

  for (const note of state.notes.values()) {
    nodes.push({
      id: note.id,
      label: sanitize(note.label),
      labelType: note.labelType,
      shape: 'note',
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: 'default usecase-note',
      cssStyles: [],
      cssCompiledStyles: getCompiledStyles([]),
      noteTarget: note.target,
      noteTargetLabel: sanitize(
        state.actors.get(note.target)?.label ??
          state.useCases.get(note.target)?.label ??
          state.jsonNodes.get(note.target)?.id ??
          note.target
      ),
    });
  }

  for (const json of state.jsonNodes.values()) {
    nodes.push({
      id: json.id,
      label: sanitize(json.id),
      labelType: 'text',
      shape: 'usecaseJsonTable',
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: classNames('default', 'usecase-json-table', ...json.classes),
      cssStyles: [...json.styles],
      cssCompiledStyles: getCompiledStyles(json.classes),
      jsonRows: flattenJsonRows(json.value, json.propertyOrder, sanitize),
    });
  }

  for (const boundary of state.systemBoundaries.values()) {
    nodes.push({
      id: boundary.id,
      label: sanitize(boundary.label),
      labelType: boundary.labelType,
      shape: 'usecaseSystemBoundary',
      isGroup: true,
      padding: 20,
      look: globalConfig.look,
      cssClasses: classNames(
        'default',
        'system-boundary',
        `system-boundary-${boundary.type}`,
        ...boundary.classes
      ),
      cssStyles: [...boundary.styles],
      cssCompiledStyles: getCompiledStyles(boundary.classes),
      boundaryType: boundary.type,
    });
  }

  for (const relationship of state.relationships) {
    const { label: rawLabel, ...visual } = relationshipVisuals(relationship);
    edges.push({
      id: relationship.id,
      start: relationship.source,
      end: relationship.target,
      source: relationship.source,
      target: relationship.target,
      sourceLabel: endpointLabel(relationship.source),
      targetLabel: endpointLabel(relationship.target),
      type: 'edge',
      relationshipType: relationship.type,
      internal: false,
      ...visual,
      ...(rawLabel !== undefined ? { label: sanitize(rawLabel) } : {}),
      labelpos: 'c',
      classes: classNames(
        'default',
        'relationship',
        `relationship-${relationship.type}`,
        ...relationship.classes,
        ...animationClasses(relationship)
      ),
      style: [...relationship.styles],
      cssCompiledStyles: getCompiledStyles(relationship.classes),
      animate: relationship.animate,
      ...(relationship.animation ? { animation: relationship.animation } : {}),
      look: globalConfig.look,
      thickness: 'normal',
      minlen: relationship.minlen,
      isUserDefinedId: relationship.explicitId,
    });
  }

  for (const note of state.notes.values()) {
    edges.push({
      id: `${note.id}-edge`,
      start: note.id,
      end: note.target,
      source: note.id,
      target: note.target,
      type: 'edge',
      relationshipType: 'note',
      sourceLabel: endpointLabel(note.id),
      targetLabel: endpointLabel(note.target),
      internal: true,
      pattern: 'dotted',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
      labelpos: 'c',
      classes: 'default relationship relationship-note',
      style: [],
      cssCompiledStyles: getCompiledStyles([]),
      animate: false,
      look: globalConfig.look,
      thickness: 'normal',
      minlen: 1,
      isUserDefinedId: false,
    });
  }

  return {
    nodes,
    edges,
    config: globalConfig,
    type: 'usecase',
    layoutAlgorithm: 'dagre',
    direction: getDirection(),
    nodeSpacing: config.nodeSpacing,
    rankSpacing: config.rankSpacing,
    actorFontSize: config.actorFontSize,
    actorFontFamily: config.actorFontFamily,
    actorFontWeight: config.actorFontWeight,
    usecaseFontSize: config.usecaseFontSize,
    usecaseFontFamily: config.usecaseFontFamily,
    usecaseFontWeight: config.usecaseFontWeight,
    diagramPadding: config.diagramPadding,
    useMaxWidth: config.useMaxWidth,
    markers: ['point', 'circle', 'cross', 'extension'],
  };
};

export const db: UsecaseDB = {
  getConfig,
  createModel,
  commit,
  getAST,

  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  getActors,
  getActor,
  getUseCases,
  getUseCase,
  getSystemBoundaries,
  getSystemBoundary,
  getRelationships,
  getNotes,
  getNote,
  getJsonNodes,
  getJsonNode,
  getClassDefs,
  getClassDef,
  getDirection,
  getData,
};
