import { logger } from '../../logger';

let relations = [];
let classes = {};

const splitClassNameAndType = function(id){
  let genericType = '';
  let className = id;
  
  if(id.indexOf('~') > 0){
    let split = id.split('~');
    className = split[0];
    genericType = split[1];
  }

  return {className: className, type: genericType};
}

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @public
 */
export const addClass = function(id) {
  let classId = splitClassNameAndType(id);
  // Only add class if not exists
  if (typeof classes[classId.className] !== 'undefined') return;

  classes[classId.className] = {
    id: classId.className,
    type: classId.type,
    methods: [],
    members: [],
    annotations: []
  };
};

export const clear = function() {
  relations = [];
  classes = {};
};

export const getClass = function(id) {
  return classes[id];
};
export const getClasses = function() {
  return classes;
};

export const getRelations = function() {
  return relations;
};

export const addRelation = function(relation) {
  logger.debug('Adding relation: ' + JSON.stringify(relation));
  addClass(relation.id1);
  addClass(relation.id2);

  relation.id1 = splitClassNameAndType(relation.id1).className;
  relation.id2 = splitClassNameAndType(relation.id2).className;

  relations.push(relation);
};

/**
 * Adds an annotation to the specified class
 * Annotations mark special properties of the given type (like 'interface' or 'service')
 * @param className The class name
 * @param annotation The name of the annotation without any brackets
 * @public
 */
export const addAnnotation = function(className, annotation) {
  const validatedClassName = splitClassNameAndType(className).className;
  classes[validatedClassName].annotations.push(annotation);
};

/**
 * Adds a member to the specified class
 * @param className The class name
 * @param member The full name of the member.
 * If the member is enclosed in <<brackets>> it is treated as an annotation
 * If the member is ending with a closing bracket ) it is treated as a method
 * Otherwise the member will be treated as a normal property
 * @public
 */
export const addMember = function(className, member) {
  const validatedClassName = splitClassNameAndType(className).className;
  const theClass = classes[validatedClassName];

  if (typeof member === 'string') {
    // Member can contain white spaces, we trim them out
    const memberString = member.trim();

    if (memberString.startsWith('<<') && memberString.endsWith('>>')) {
      // Remove leading and trailing brackets
      theClass.annotations.push(memberString.substring(2, memberString.length - 2));
    } else if (memberString.endsWith(')')) {
      theClass.methods.push(memberString);
    } else if (memberString) {
      theClass.members.push(memberString);
    }
  }
};

export const addMembers = function(className, members) {
  if (Array.isArray(members)) {
    members.reverse();
    members.forEach(member => addMember(className, member));
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
  addClass,
  clear,
  getClass,
  getClasses,
  addAnnotation,
  getRelations,
  addRelation,
  addMember,
  addMembers,
  cleanupLabel,
  lineType,
  relationType
};
