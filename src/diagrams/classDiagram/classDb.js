
import { logger } from '../../logger'

let relations = []
let classes = {}

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addClass = function (id) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = {
      id: id,
      methods: [],
      members: []
    }
  }
}

export const clear = function () {
  relations = []
  classes = {}
}

export const getClass = function (id) {
  return classes[id]
}
export const getClasses = function () {
  return classes
}

export const getRelations = function () {
  return relations
}

export const addRelation = function (relation) {
  logger.warn('Adding relation: ' + JSON.stringify(relation))
  addClass(relation.id1)
  addClass(relation.id2)
  relations.push(relation)
}

export const addMembers = function (className, MembersArr) {
  const theClass = classes[className]
  if (typeof MembersArr === 'string') {
    if (MembersArr.substr(-1) === ')') {
      theClass.methods.push(MembersArr)
    } else {
      theClass.members.push(MembersArr)
    }
  }
}

export const cleanupLabel = function (label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim()
  } else {
    return label.trim()
  }
}

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1
}

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
}

export default {
  addClass,
  clear,
  getClass,
  getClasses,
  getRelations,
  addRelation,
  addMembers,
  cleanupLabel,
  lineType,
  relationType
}
