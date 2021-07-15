/**
 *
 */
import { log } from '../../logger';
import mermaidAPI from '../../mermaidAPI';
import * as configApi from '../../config';

let entities = {};
let relationships = [];
let title = '';

const Cardinality = {
  ZERO_OR_ONE: 'ZERO_OR_ONE',
  ZERO_OR_MORE: 'ZERO_OR_MORE',
  ONE_OR_MORE: 'ONE_OR_MORE',
  ONLY_ONE: 'ONLY_ONE',
};

const Identification = {
  NON_IDENTIFYING: 'NON_IDENTIFYING',
  IDENTIFYING: 'IDENTIFYING',
};

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const addEntity = function (name) {
  if (typeof entities[name] === 'undefined') {
    entities[name] = { attributes: [] };
    log.info('Added new entity :', name);
  }

  return entities[name];
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

// Keep this - TODO: revisit...allow the diagram to have a title
const setTitle = function (txt) {
  title = txt;
};

const getTitle = function () {
  return title;
};

const clear = function () {
  entities = {};
  relationships = [];
  title = '';
};

export default {
  Cardinality,
  Identification,
  parseDirective,
  getConfig: () => configApi.getConfig().er,
  addEntity,
  addAttributes,
  getEntities,
  addRelationship,
  getRelationships,
  clear,
  setTitle,
  getTitle,
};
