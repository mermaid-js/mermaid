import { logger } from '../../logger';

const newDoc = () => {
  return {
    relations: [],
    states: {},
    documents: {}
  };
};

let documents = {
  root: newDoc()
};

let currentDocument = documents.root;

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
  console.warn('Add state', id);
  if (typeof currentDocument.states[id] === 'undefined') {
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type
    };
  }
};

export const clear = function() {
  documents = {
    root: newDoc()
  };
};

export const getState = function(id) {
  return currentDocument.states[id];
};
export const addDocument = id => {
  console.warn(currentDocument, documents);
  currentDocument.documents[id] = newDoc();
  currentDocument.documents[id].parent = currentDocument;
  currentDocument = currentDocument.documents[id];
};
export const getStates = function() {
  return currentDocument.states;
};
export const logDocuments = function() {
  console.warn('Documents = ', documents);
};
export const getRelations = function() {
  // const relations1 = [{ id1: 'start1', id2: 'state1' }, { id1: 'state1', id2: 'exit1' }];
  // return relations;
  return currentDocument.relations;
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
  currentDocument.relations.push({ id1, id2, title });
};

export const addDescription = function(id, _descr) {
  const theState = currentDocument.states[id];
  let descr = _descr;
  if (descr[0] === ':') {
    descr = descr.substr(1).trim();
  }

  theState.descriptions.push(descr);
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
  addDescription,
  cleanupLabel,
  lineType,
  relationType,
  logDocuments,
  addDocument
};
