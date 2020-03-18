/**
 *
 */
import { logger } from '../../logger';

let entities = {};
let relationships = [];
let title = '';

const Cardinality = {
  ONLY_ONE_TO_ONE_OR_MORE: 'ONLY_ONE_TO_ONE_OR_MORE',
  ONLY_ONE_TO_ZERO_OR_MORE: 'ONLY_ONE_TO_ZERO_OR_MORE',
  ZERO_OR_ONE_TO_ZERO_OR_MORE: 'ZERO_OR_ONE_TO_ZERO_OR_MORE',
  ZERO_OR_ONE_TO_ONE_OR_MORE: 'ZERO_OR_ONE_TO_ONE_OR_MORE',
  ONE_OR_MORE_TO_ONLY_ONE: 'ONE_OR_MORE_TO_ONLY_ONE',
  ZERO_OR_MORE_TO_ONLY_ONE: 'ZERO_OR_MORE_TO_ONLY_ONE',
  ZERO_OR_MORE_TO_ZERO_OR_ONE: 'ZERO_OR_MORE_TO_ZERO_OR_ONE',
  ONE_OR_MORE_TO_ZERO_OR_ONE: 'ONE_OR_MORE_TO_ZERO_OR_ONE',
  ZERO_OR_ONE_TO_ONLY_ONE: 'ZERO_OR_ONE_TO_ONLY_ONE',
  ONLY_ONE_TO_ONLY_ONE: 'ONLY_ONE_TO_ONLY_ONE',
  ONLY_ONE_TO_ZERO_OR_ONE: 'ONLY_ONE_TO_ZERO_OR_ONE',
  ZERO_OR_ONE_TO_ZERO_OR_ONE: 'ZERO_OR_ONE_TO_ZERO_OR_ONE',
  ZERO_OR_MORE_TO_ZERO_OR_MORE: 'ZERO_OR_MORE_TO_ZERO_OR_MORE',
  ZERO_OR_MORE_TO_ONE_OR_MORE: 'ZERO_OR_MORE_TO_ONE_OR_MORE',
  ONE_OR_MORE_TO_ZERO_OR_MORE: 'ONE_OR_MORE_TO_ZERO_OR_MORE',
  ONE_OR_MORE_TO_ONE_OR_MORE: 'ONE_OR_MORE_TO_ONE_OR_MORE'
};

const addEntity = function(name) {
  if (typeof entities[name] === 'undefined') {
    entities[name] = name;
    logger.debug('Added new entity :', name);
  }
};

const getEntities = () => entities;

/**
 * Add a relationship
 * @param entA The first entity in the relationship
 * @param rolA The role played by the first entity in relation to the second
 * @param entB The second entity in the relationship
 * @param card The cardinality of the relationship between the two entities
 */
const addRelationship = function(entA, rolA, entB, card) {
  let rel = {
    entityA: entA,
    roleA: rolA,
    entityB: entB,
    cardinality: card
  };

  relationships.push(rel);
  logger.debug('Added new relationship :', rel);
};

const getRelationships = () => relationships;

// Keep this - TODO: revisit...allow the diagram to have a title
const setTitle = function(txt) {
  title = txt;
};

const getTitle = function() {
  return title;
};

const clear = function() {
  entities = {};
  relationships = [];
  title = '';
};

export default {
  Cardinality,
  addEntity,
  getEntities,
  addRelationship,
  getRelationships,
  clear,
  setTitle,
  getTitle
};
