
import { logger } from '../../logger'

let relations = []
let components = {}

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */
export const addComponent = function (id) {
  if (!componentExists(id)) {
    components[id] = {
      id: id,
      stereotypes: []
    }
  }
  return components[id]
}

export const clear = function () {
  relations = []
  components = {}
}

export const componentExists = function (id) {
  return typeof components[id] !== 'undefined'
}
export const getComponent = function (id) {
  return components[id]
}
export const getComponents = function () {
  return components
}

export const getRelations = function () {
  return relations
}

export const addRelation = function (relation) {
  logger.debug('Adding relation: ' + JSON.stringify(relation))
  addComponent(relation.id1)
  addComponent(relation.id2)
  relations.push(relation)
}

export const addMembers = function (componentName, MembersArr) {
  logger.info('adding members to component ' + componentName)
  const theComponent = componentExists(componentName) ? getComponent(componentName) : addComponent(componentName)
  if (typeof MembersArr === 'string') {
    theComponent.stereotypes.push(MembersArr)
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
  addComponent,
  clear,
  getComponent,
  getComponents,
  getRelations,
  addRelation,
  addMembers,
  cleanupLabel,
  lineType,
  relationType
}
