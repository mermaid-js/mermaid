import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';

let entities = new Map();
let relationships = [];

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
 * @param {string} name - The name of the entity
 * @param {string | undefined} alias - The alias of the entity
 */
const addEntity = function (name, alias = undefined) {
  if (!entities.has(name)) {
    entities.set(name, { attributes: [], alias });
    log.info('Added new entity :', name);
  } else if (!entities.get(name).alias && alias) {
    entities.get(name).alias = alias;
    log.info(`Add alias '${alias}' to entity '${name}'`);
  }

  return entities.get(name);
};

const getEntities = () => entities;

const addAttributes = function (entityName, attribs) {
  let entity = addEntity(entityName); // May do nothing (if entity has already been added)

  // Process attribs in reverse order due to effect of recursive construction (last attribute is first)
  let i;
  for (i = attribs.length - 1; i >= 0; i--) {
    entity.attributes.push(attribs[i]);
    log.debug('Added attribute ', attribs[i].attributeName);
  }
};

/**
 * Add a relationship
 *
 * @param entA The first entity in the relationship
 * @param rolA The role played by the first entity in relation to the second
 * @param entB The second entity in the relationship
 * @param rSpec The details of the relationship between the two entities
 */
const addRelationship = function (entA, rolA, entB, rSpec) {
  let rel = {
    entityA: entA,
    roleA: rolA,
    entityB: entB,
    relSpec: rSpec,
  };

  relationships.push(rel);
  log.debug('Added new relationship :', rel);
};

const getRelationships = () => relationships;

const clear = function () {
  entities = new Map();
  relationships = [];
  commonClear();
};

export default {
  Cardinality,
  Identification,
  getConfig: () => getConfig().er,
  addEntity,
  addAttributes,
  getEntities,
  addRelationship,
  getRelationships,
  clear,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  setDiagramTitle,
  getDiagramTitle,
};
