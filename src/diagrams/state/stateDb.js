import { logger } from '../../logger';

let relations = [];
let states = {};

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addState = function(id) {
  if (typeof states[id] === 'undefined') {
    states[id] = {
      id: id,
      descriptions: []
    };
  }
};

export const clear = function() {
  relations = [];
  states = {};
};

export const getState = function(id) {
  return states[id];
};
export const getstates = function() {
  return states;
};

export const getRelations = function() {
  return relations;
};

export const addRelation = function(relation) {
  logger.debug('Adding relation: ' + JSON.stringify(relation));
  addState(relation.id1);
  addState(relation.id2);
  relations.push(relation);
};

export const addMember = function(className, member) {
  const theState = states[className];
  if (typeof member === 'string') {
    if (member.substr(-1) === ')') {
      theState.methods.push(member);
    } else {
      theState.members.push(member);
    }
  }
};

export const addMembers = function(className, MembersArr) {
  if (Array.isArray(MembersArr)) {
    MembersArr.forEach(member => addMember(className, member));
  }
};

export const cleanupLabel = function(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};

export default {
  addState,
  clear,
  getState,
  getstates,
  getRelations,
  addRelation,
  addMember,
  addMembers,
  cleanupLabel,
  lineType,
  relationType
};
