import { logger } from '../../logger';

let relations = [];
let states = {};

let startCnt = 0;
let endCnt = 0;

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addState = function(id, type) {
  if (typeof states[id] === 'undefined') {
    states[id] = {
      id: id,
      descriptions: [],
      type
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
export const getStates = function() {
  return states;
};

export const getRelations = function() {
  // const relations1 = [{ id1: 'start1', id2: 'state1' }, { id1: 'state1', id2: 'exit1' }];
  // return relations;
  return relations;
};

export const addRelation = function(_id1, _id2, title) {
  let id1 = _id1;
  let id2 = _id2;
  let type1 = 'default';
  let type2 = 'default';
  if (_id1 === '[*]') {
    startCnt++;
    id1 = 'start' + startCnt;
    type1 = 'start';
  }
  if (_id2 === '[*]') {
    endCnt++;
    id2 = 'end' + startCnt;
    type2 = 'end';
  }
  console.log(id1, id2, title);
  addState(id1, type1);
  addState(id2, type2);
  relations.push({ id1, id2, title });
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
  getStates,
  getRelations,
  addRelation,
  addMember,
  addMembers,
  cleanupLabel,
  lineType,
  relationType
};
