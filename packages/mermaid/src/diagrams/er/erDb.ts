import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import type { EntityNode, Attribute, Relationship, EntityClass, RelSpec } from './erTypes.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { getEdgeId } from '../../utils.js';

let entities = new Map<string, EntityNode>();
let relationships: Relationship[] = [];
let classes = new Map<string, EntityClass>();
let direction = 'TB';

const Cardinality = {
  ZERO_OR_ONE: 'ZERO_OR_ONE',
  ZERO_OR_MORE: 'ZERO_OR_MORE',
  ONE_OR_MORE: 'ONE_OR_MORE',
  ONLY_ONE: 'ONLY_ONE',
  MD_PARENT: 'MD_PARENT',
};

const Identification = {
  NON_IDENTIFYING: 'NON_IDENTIFYING',
  IDENTIFYING: 'IDENTIFYING',
};
/**
 * Add entity
 * @param name - The name of the entity
 * @param alias - The alias of the entity
 */
const addEntity = function (name: string, alias = ''): EntityNode {
  if (!entities.has(name)) {
    entities.set(name, {
      id: `entity-${name}-${entities.size}`,
      label: name,
      attributes: [],
      alias,
      shape: 'erBox',
      look: getConfig().look || 'default',
      cssClasses: ['default'],
      cssStyles: [],
    });
    log.info('Added new entity :', name);
  } else if (!entities.get(name)?.alias && alias) {
    entities.get(name)!.alias = alias;
    log.info(`Add alias '${alias}' to entity '${name}'`);
  }

  return entities.get(name)!;
};

const getEntity = function (name: string) {
  return entities.get(name);
};

const getEntities = () => entities;

const getClasses = () => classes;

const addAttributes = function (entityName: string, attribs: Attribute[]) {
  const entity = addEntity(entityName); // May do nothing (if entity has already been added)

  // Process attribs in reverse order due to effect of recursive construction (last attribute is first)
  let i;
  for (i = attribs.length - 1; i >= 0; i--) {
    if (!attribs[i].keys) {
      attribs[i].keys = [];
    }
    if (!attribs[i].comment) {
      attribs[i].comment = '';
    }
    entity.attributes.push(attribs[i]);
    log.debug('Added attribute ', attribs[i].name);
  }
};

/**
 * Add a relationship
 *
 * @param entA - The first entity in the relationship
 * @param rolA - The role played by the first entity in relation to the second
 * @param entB - The second entity in the relationship
 * @param rSpec - The details of the relationship between the two entities
 */
const addRelationship = function (entA: string, rolA: string, entB: string, rSpec: RelSpec) {
  const entityA = entities.get(entA);
  const entityB = entities.get(entB);
  if (!entityA || !entityB) {
    return;
  }

  const rel = {
    entityA: entityA.id,
    roleA: rolA,
    entityB: entityB.id,
    relSpec: rSpec,
  };

  relationships.push(rel);
  log.debug('Added new relationship :', rel);
};

const getRelationships = () => relationships;

export const getDirection = () => direction;
const setDirection = (dir: string) => {
  direction = dir;
};

const clear = function () {
  entities = new Map();
  classes = new Map();
  relationships = [];
  commonClear();
};

export const getData = function () {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const config = getConfig();

  for (const entityKey of entities.keys()) {
    const entityNode = entities.get(entityKey);
    if (entityNode) {
      entityNode.cssCompiledStyles = getCompiledStyles(entityNode.cssClasses!);
      nodes.push(entityNode as unknown as Node);
    }
  }

  let count = 0;
  for (const relationship of relationships) {
    const edge: Edge = {
      id: getEdgeId(relationship.entityA, relationship.entityB, { prefix: 'id', counter: count++ }),
      type: 'normal',
      start: relationship.entityA,
      end: relationship.entityB,
      label: relationship.roleA,
      labelpos: 'c',
      thickness: 'normal',
      classes: 'relationshipLine',
      arrowTypeStart: relationship.relSpec.cardB.toLowerCase(),
      arrowTypeEnd: relationship.relSpec.cardA.toLowerCase(),
      pattern: relationship.relSpec.relType == 'IDENTIFYING' ? 'solid' : 'dashed',
      look: config.look,
    };
    edges.push(edge);
  }
  return { nodes, edges, other: {}, config, direction: 'TB' };
};

export const addCssStyles = function (ids: string[], styles: string[]) {
  for (const id of ids) {
    const entity = entities.get(id);
    if (!styles || !entity) {
      return;
    }
    for (const style of styles) {
      entity.cssStyles!.push(style);
    }
  }
};

export const addClass = function (ids: string[], style: string[]) {
  ids.forEach(function (id) {
    let classNode = classes.get(id);
    if (classNode === undefined) {
      classNode = { id, styles: [], textStyles: [] };
      classes.set(id, classNode);
    }

    if (style) {
      style.forEach(function (s) {
        if (/color/.exec(s)) {
          const newStyle = s.replace('fill', 'bgFill');
          classNode.textStyles.push(newStyle);
        }
        classNode.styles.push(s);
      });
    }
  });
};

export const setClass = function (ids: string[], classNames: string[]) {
  for (const id of ids) {
    const entity = entities.get(id);
    if (entity) {
      for (const className of classNames) {
        entity.cssClasses!.push(className);
      }
    }
  }
};

function getCompiledStyles(classDefs: string[]) {
  let compiledStyles: string[] = [];
  for (const customClass of classDefs) {
    const cssClass = classes.get(customClass);
    if (cssClass?.styles) {
      compiledStyles = [...compiledStyles, ...(cssClass.styles ?? [])].map((s) => s.trim());
    }
    if (cssClass?.textStyles) {
      compiledStyles = [...compiledStyles, ...(cssClass.textStyles ?? [])].map((s) => s.trim());
    }
  }
  return compiledStyles;
}

export default {
  Cardinality,
  Identification,
  getConfig: () => getConfig().er,
  addEntity,
  addAttributes,
  getEntities,
  getEntity,
  getClasses,
  addRelationship,
  getRelationships,
  clear,
  getDirection,
  setDirection,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  getData,
  addCssStyles,
  addClass,
  setClass,
};
