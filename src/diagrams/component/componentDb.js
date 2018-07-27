
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
export const addComponent = function (id, label) {
  if (!componentExists(id)) {
    // console.log('adding component name=' + id + ' label=' + label)
    components[id] = {
      id: id,
      label: cleanupLabel(label),
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

export const addStereotypes = function (componentName, StereotypesArr) {
  logger.debug('adding members to component ' + componentName)
  const theComponent = componentExists(componentName) ? getComponent(componentName) : addComponent(componentName)
  // console.log('adding members to component name=' + componentName + ' found obj=' + theComponent + ' with StereotypesArr=' + StereotypesArr + ' type=' + typeof StereotypesArr)
  if (typeof StereotypesArr === 'string') {
    theComponent.stereotypes.push(StereotypesArr)
  } else {
    theComponent.stereotypes = StereotypesArr
  }
}

export const cleanupLabel = function (label) {
  if (typeof label !== 'undefined') {
    if (label.substring(0, 1) === ':') {
      return label.substr(2).trim()
    } else {
      return label.trim()
    }
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
  addStereotypes,
  cleanupLabel,
  lineType,
  relationType
}
