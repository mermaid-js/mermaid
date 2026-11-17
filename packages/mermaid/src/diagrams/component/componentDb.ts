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
  ActorEntity,
  ClassDef,
  ComponentDB,
  ComponentEntity,
  ComponentFields,
  ComponentLayoutData,
  ComponentLayoutEdge,
  Direction,
  InterfaceEntity,
  NoteEntity,
  PackageEntity,
  PortEntity,
  Relation,
  RelationKind,
} from './componentTypes.js';
import { DEFAULT_DIRECTION } from './componentTypes.js';
import type { ComponentDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';

export const DEFAULT_COMPONENT_CONFIG: Required<ComponentDiagramConfig> = DEFAULT_CONFIG.component;

const createModel = (): ComponentFields => ({
  components: new Map(),
  interfaces: new Map(),
  actors: new Map(),
  ports: new Map(),
  packages: new Map(),
  notes: new Map(),
  relations: [],
  classDefs: new Map(),
  symbols: new Map(),
  direction: DEFAULT_DIRECTION,
  relationCounter: 0,
  noteCounter: 0,
  accTitle: '',
  accDescription: '',
  config: structuredClone(DEFAULT_COMPONENT_CONFIG),
});

let state = createModel();

const getConfig = (): Required<ComponentDiagramConfig> => structuredClone(state.config);

const clear = (): void => {
  state = createModel();
  commonClear();
};

const getComponents = (): ReadonlyMap<string, ComponentEntity> => state.components;
const getComponent = (id: string): ComponentEntity | undefined => state.components.get(id);
const getInterfaces = (): ReadonlyMap<string, InterfaceEntity> => state.interfaces;
const getInterface = (id: string): InterfaceEntity | undefined => state.interfaces.get(id);
const getActors = (): ReadonlyMap<string, ActorEntity> => state.actors;
const getPorts = (): ReadonlyMap<string, PortEntity> => state.ports;
const getPort = (id: string): PortEntity | undefined => state.ports.get(id);
const getPackages = (): ReadonlyMap<string, PackageEntity> => state.packages;
const getPackage = (id: string): PackageEntity | undefined => state.packages.get(id);
const getNotes = (): ReadonlyMap<string, NoteEntity> => state.notes;
const getRelations = (): readonly Relation[] => state.relations;
const getClassDefs = (): ReadonlyMap<string, ClassDef> => state.classDefs;
const getDirection = (): Direction => state.direction;
const setDirection = (direction: Direction): void => {
  state.direction = direction;
};

const assertUnused = (id: string): void => {
  if (state.symbols.has(id)) {
    throw new Error(`Cannot declare "${id}": the id is already in use`);
  }
};

const addComponent = (id: string, label?: string, stereotype?: string, parentId?: string): void => {
  if (parentId && !state.components.has(parentId) && !state.packages.has(parentId)) {
    throw new Error(`Cannot nest component "${id}" inside unknown container "${parentId}"`);
  }
  assertUnused(id);
  state.symbols.set(id, 'component');
  state.components.set(id, {
    id,
    label: label ?? id,
    stereotype,
    parentId,
    classes: [],
    styles: [],
    ports: [],
    children: [],
  });
  if (parentId) {
    state.components.get(parentId)?.children.push(id);
    state.packages.get(parentId)?.children.push(id);
  }
};

const addInterface = (id: string, label?: string): void => {
  assertUnused(id);
  state.symbols.set(id, 'interface');
  state.interfaces.set(id, { id, label: label ?? id, classes: [], styles: [] });
};

const addActor = (id: string, label?: string, stereotype?: string): void => {
  assertUnused(id);
  state.symbols.set(id, 'actor');
  state.actors.set(id, { id, label: label ?? id, stereotype, classes: [], styles: [] });
};

const addPort = (parentId: string, id: string): void => {
  const component = state.components.get(parentId);
  if (!component) {
    throw new Error(`Cannot declare port "${id}": unknown component "${parentId}"`);
  }
  const qualifiedId = `${parentId}.${id}`;
  assertUnused(qualifiedId);
  state.symbols.set(qualifiedId, 'port');
  state.ports.set(qualifiedId, {
    id: qualifiedId,
    label: id,
    parentId,
    classes: [],
    styles: [],
  });
  component.ports.push(qualifiedId);
};

const addPackage = (id: string, parentId?: string): void => {
  if (parentId && !state.packages.has(parentId)) {
    throw new Error(`Cannot nest package "${id}" inside unknown package "${parentId}"`);
  }
  assertUnused(id);
  state.symbols.set(id, 'package');
  state.packages.set(id, { id, label: id, parentId, classes: [], styles: [], children: [] });
  if (parentId) {
    state.packages.get(parentId)?.children.push(id);
  }
};

const resolveEndpointId = (ref: string): string => {
  if (state.symbols.has(ref)) {
    return ref;
  }
  throw new Error(`Unknown identifier "${ref}"`);
};

const addNote = (target: string, label: string): void => {
  resolveEndpointId(target);
  const id = `note${state.noteCounter++}`;
  state.notes.set(id, { id, target, label });
};

const addRelation = (source: string, target: string, kind: RelationKind, label?: string): void => {
  resolveEndpointId(source);
  resolveEndpointId(target);
  state.relations.push({
    id: `rel${state.relationCounter++}`,
    source,
    target,
    kind,
    label,
    classes: [],
    styles: [],
  });
};

const addClassDef = (id: string, styles: string[]): void => {
  state.classDefs.set(id, { id, styles });
};

const entityOf = (
  id: string
): ComponentEntity | InterfaceEntity | ActorEntity | PortEntity | PackageEntity | undefined =>
  state.components.get(id) ??
  state.interfaces.get(id) ??
  state.actors.get(id) ??
  state.ports.get(id) ??
  state.packages.get(id);

const setClasses = (ids: string[], className: string): void => {
  for (const id of ids) {
    const entity = entityOf(id);
    if (entity) {
      entity.classes.push(className);
      continue;
    }
    const relation = state.relations.find((rel) => rel.id === id);
    relation?.classes.push(className);
  }
};

const setStyles = (id: string, styles: string[]): void => {
  const entity = entityOf(id);
  if (entity) {
    entity.styles.push(...styles);
    return;
  }
  const relation = state.relations.find((rel) => rel.id === id);
  relation?.styles.push(...styles);
};

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

const classNames = (...names: (string | false | undefined)[]): string =>
  names.filter((name): name is string => Boolean(name)).join(' ');

const relationVisuals = (
  kind: RelationKind
): Pick<ComponentLayoutEdge, 'arrowTypeStart' | 'arrowTypeEnd' | 'pattern'> => {
  switch (kind) {
    case 'provides':
      // The `umlInterface` node itself is the ball, so the line needs no marker.
      return { arrowTypeStart: 'none', arrowTypeEnd: 'none', pattern: 'solid' };
    case 'requires':
      // Laid out interface -> requirer (see getData), so the socket sits on the start.
      return { arrowTypeStart: 'socket', arrowTypeEnd: 'none', pattern: 'solid' };
    case 'dependency':
      return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_point', pattern: 'dotted' };
    case 'association':
      return { arrowTypeStart: 'none', arrowTypeEnd: 'arrow_point', pattern: 'solid' };
    case 'link':
      return { arrowTypeStart: 'none', arrowTypeEnd: 'none', pattern: 'solid' };
  }
};

// Converts the committed component model to the unified renderer contract.
const getData = (): ComponentLayoutData => {
  const globalConfig = getGlobalConfig();
  const config: Required<ComponentDiagramConfig> = {
    ...state.config,
    ...globalConfig.component,
  };
  const sanitize = (value: string): string => sanitizeText(value, globalConfig);
  const endpointLabel = (id: string): string =>
    sanitize(
      state.components.get(id)?.label ??
        state.interfaces.get(id)?.label ??
        state.actors.get(id)?.label ??
        state.ports.get(id)?.label ??
        state.packages.get(id)?.label ??
        id
    );

  const nodes: ComponentLayoutData['nodes'] = [];
  const edges: ComponentLayoutEdge[] = [];

  for (const pkg of state.packages.values()) {
    nodes.push({
      id: pkg.id,
      label: sanitize(pkg.label),
      labelType: 'text',
      shape: 'umlComponentGroup',
      isGroup: true,
      padding: 20,
      look: globalConfig.look,
      cssClasses: classNames('default', 'component-package', ...pkg.classes),
      cssStyles: [...pkg.styles],
      cssCompiledStyles: getCompiledStyles(pkg.classes),
      boundaryType: 'package',
      ...(pkg.parentId ? { parentId: pkg.parentId } : {}),
    });
  }

  for (const component of state.components.values()) {
    const isGroup = component.children.length > 0 || component.ports.length > 0;
    if (isGroup) {
      nodes.push({
        id: component.id,
        label: sanitize(component.label),
        labelType: 'text',
        shape: 'umlComponentGroup',
        isGroup: true,
        padding: 20,
        look: globalConfig.look,
        cssClasses: classNames('default', 'component-group', ...component.classes),
        cssStyles: [...component.styles],
        cssCompiledStyles: getCompiledStyles(component.classes),
        boundaryType: 'rect',
        ...(component.stereotype ? { stereotype: sanitize(component.stereotype) } : {}),
        ...(component.parentId ? { parentId: component.parentId } : {}),
      });
    } else {
      nodes.push({
        id: component.id,
        label: sanitize(component.label),
        labelType: 'text',
        shape: 'umlComponent',
        isGroup: false,
        padding: 10,
        look: globalConfig.look,
        cssClasses: classNames('default', 'component-box', ...component.classes),
        cssStyles: [...component.styles],
        cssCompiledStyles: getCompiledStyles(component.classes),
        ...(component.stereotype ? { stereotype: sanitize(component.stereotype) } : {}),
        ...(component.parentId ? { parentId: component.parentId } : {}),
      });
    }

    for (const portId of component.ports) {
      const port = state.ports.get(portId);
      if (!port) {
        continue;
      }
      nodes.push({
        id: port.id,
        label: sanitize(port.label),
        labelType: 'text',
        shape: 'umlPort',
        isGroup: false,
        padding: 2,
        look: globalConfig.look,
        cssClasses: classNames('default', 'component-port', ...port.classes),
        cssStyles: [...port.styles],
        cssCompiledStyles: getCompiledStyles(port.classes),
        parentId: component.id,
      });
    }
  }

  for (const iface of state.interfaces.values()) {
    nodes.push({
      id: iface.id,
      label: sanitize(iface.label),
      labelType: 'text',
      shape: 'umlInterface',
      isGroup: false,
      padding: 4,
      look: globalConfig.look,
      cssClasses: classNames('default', 'component-interface', ...iface.classes),
      cssStyles: [...iface.styles],
      cssCompiledStyles: getCompiledStyles(iface.classes),
    });
  }

  for (const actor of state.actors.values()) {
    nodes.push({
      id: actor.id,
      label: sanitize(actor.label),
      labelType: 'text',
      shape: 'usecaseActor',
      isGroup: false,
      look: globalConfig.look,
      cssClasses: classNames('default', 'component-actor', ...actor.classes),
      cssStyles: [...actor.styles],
      cssCompiledStyles: getCompiledStyles(actor.classes),
      ...(actor.stereotype ? { stereotype: sanitize(actor.stereotype) } : {}),
    });
  }

  for (const note of state.notes.values()) {
    nodes.push({
      id: note.id,
      label: sanitize(note.label),
      labelType: 'text',
      shape: 'note',
      isGroup: false,
      padding: 10,
      look: globalConfig.look,
      cssClasses: 'default component-note',
      cssStyles: [],
      cssCompiledStyles: getCompiledStyles([]),
      noteTarget: note.target,
      noteTargetLabel: endpointLabel(note.target),
    });
  }

  for (const relation of state.relations) {
    const visuals = relationVisuals(relation.kind);
    // A required interface is drawn from the interface to the requirer, so layout ranks
    // the interface between its provider and requirer, as a UML assembly reads.
    const reversed = relation.kind === 'requires';
    const [start, end] = reversed
      ? [relation.target, relation.source]
      : [relation.source, relation.target];
    edges.push({
      id: relation.id,
      start,
      end,
      source: start,
      target: end,
      sourceLabel: endpointLabel(relation.source),
      targetLabel: endpointLabel(relation.target),
      type: 'edge',
      relationKind: relation.kind,
      internal: false,
      ...visuals,
      ...(relation.label ? { label: sanitize(relation.label) } : {}),
      labelpos: 'c',
      classes: classNames(
        'default',
        'component-relation',
        `relation-${relation.kind}`,
        ...relation.classes
      ),
      style: [...relation.styles],
      cssCompiledStyles: getCompiledStyles(relation.classes),
      look: globalConfig.look,
      thickness: 'normal',
      minlen: 1,
    });
  }

  for (const note of state.notes.values()) {
    edges.push({
      id: `${note.id}-edge`,
      start: note.id,
      end: note.target,
      source: note.id,
      target: note.target,
      sourceLabel: endpointLabel(note.id),
      targetLabel: endpointLabel(note.target),
      type: 'edge',
      relationKind: 'note',
      internal: true,
      pattern: 'dotted',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
      labelpos: 'c',
      classes: 'default component-relation relation-note',
      style: [],
      cssCompiledStyles: getCompiledStyles([]),
      look: globalConfig.look,
      thickness: 'normal',
      minlen: 1,
    });
  }

  for (const node of nodes) {
    node.wrappingWidth ??= config.wrappingWidth;
    if (!node.isGroup && node.shape === 'umlComponent') {
      node.minWidth ??= config.minNodeWidth;
    }
    // In a vertical layout edges run through the glyph top to bottom; caption it on the side.
    if (!node.isGroup && (node.shape === 'umlInterface' || node.shape === 'umlPort')) {
      node.captionSide = getDirection() === 'LR' || getDirection() === 'RL' ? 'bottom' : 'right';
    }
  }

  return {
    nodes,
    edges,
    config: globalConfig,
    type: 'component',
    layoutAlgorithm: 'dagre',
    direction: getDirection(),
    nodeSpacing: config.nodeSpacing,
    rankSpacing: config.rankSpacing,
    diagramPadding: config.diagramPadding,
    useMaxWidth: config.useMaxWidth,
    markers: ['point', 'socket'],
  };
};

export const db: ComponentDB = {
  getConfig,

  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  getComponents,
  getComponent,
  getInterfaces,
  getInterface,
  getActors,
  getPorts,
  getPort,
  getPackages,
  getPackage,
  getNotes,
  getRelations,
  getClassDefs,
  getDirection,

  addComponent,
  addInterface,
  addActor,
  addPort,
  addPackage,
  addNote,
  addRelation,
  addClassDef,
  setClasses,
  setStyles,
  setDirection,

  getData,
};
