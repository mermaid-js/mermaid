import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type {
  Element,
  Relation,
  RelationshipType,
  Requirement,
  RequirementType,
  RiskLevel,
  VerifyType,
} from './types.js';

const RequirementType = {
  REQUIREMENT: 'Requirement',
  FUNCTIONAL_REQUIREMENT: 'Functional Requirement',
  INTERFACE_REQUIREMENT: 'Interface Requirement',
  PERFORMANCE_REQUIREMENT: 'Performance Requirement',
  PHYSICAL_REQUIREMENT: 'Physical Requirement',
  DESIGN_CONSTRAINT: 'Design Constraint',
};

const RiskLevel = {
  LOW_RISK: 'Low',
  MED_RISK: 'Medium',
  HIGH_RISK: 'High',
};

const VerifyType = {
  VERIFY_ANALYSIS: 'Analysis',
  VERIFY_DEMONSTRATION: 'Demonstration',
  VERIFY_INSPECTION: 'Inspection',
  VERIFY_TEST: 'Test',
};

const Relationships = {
  CONTAINS: 'contains',
  COPIES: 'copies',
  DERIVES: 'derives',
  SATISFIES: 'satisfies',
  VERIFIES: 'verifies',
  REFINES: 'refines',
  TRACES: 'traces',
};

const getInitialRequirement = (): Requirement => ({
  id: '',
  text: '',
  risk: RiskLevel.LOW_RISK as RiskLevel,
  verifyMethod: VerifyType.VERIFY_ANALYSIS as VerifyType,
  name: '',
  type: RequirementType.REQUIREMENT as RequirementType,
});

const getInitialElement = (): Element => ({
  name: '',
  type: '',
  docRef: '',
});

// Update initial declarations
let relations: Relation[] = [];
let latestRequirement: Requirement = getInitialRequirement();
let requirements = new Map<string, Requirement>();
let latestElement: Element = getInitialElement();
let elements = new Map<string, Element>();

// Add reset functions
const resetLatestRequirement = () => {
  latestRequirement = getInitialRequirement();
};

const resetLatestElement = () => {
  latestElement = getInitialElement();
};

const addRequirement = (name: string, type: RequirementType) => {
  if (!requirements.has(name)) {
    requirements.set(name, {
      name,
      type,
      id: latestRequirement.id,
      text: latestRequirement.text,
      risk: latestRequirement.risk,
      verifyMethod: latestRequirement.verifyMethod,
    });
  }
  resetLatestRequirement();

  return requirements.get(name);
};

const getRequirements = () => requirements;

const setNewReqId = (id: string) => {
  if (latestRequirement !== undefined) {
    latestRequirement.id = id;
  }
};

const setNewReqText = (text: string) => {
  if (latestRequirement !== undefined) {
    latestRequirement.text = text;
  }
};

const setNewReqRisk = (risk: RiskLevel) => {
  if (latestRequirement !== undefined) {
    latestRequirement.risk = risk;
  }
};

const setNewReqVerifyMethod = (verifyMethod: VerifyType) => {
  if (latestRequirement !== undefined) {
    latestRequirement.verifyMethod = verifyMethod;
  }
};

const addElement = (name: string) => {
  if (!elements.has(name)) {
    elements.set(name, {
      name,
      type: latestElement.type,
      docRef: latestElement.docRef,
    });
    log.info('Added new element: ', name);
  }
  resetLatestElement();

  return elements.get(name);
};

const getElements = () => elements;

const setNewElementType = (type: string) => {
  if (latestElement !== undefined) {
    latestElement.type = type;
  }
};

const setNewElementDocRef = (docRef: string) => {
  if (latestElement !== undefined) {
    latestElement.docRef = docRef;
  }
};

const addRelationship = (type: RelationshipType, src: string, dst: string) => {
  relations.push({
    type,
    src,
    dst,
  });
};

const getRelationships = () => relations;

const clear = () => {
  relations = [];
  resetLatestRequirement();
  requirements = new Map();
  resetLatestElement();
  elements = new Map();
  commonClear();
};

export default {
  Relationships,
  RequirementType,
  RiskLevel,
  VerifyType,
  getConfig: () => getConfig().requirement,
  addRequirement,
  getRequirements,
  setNewReqId,
  setNewReqText,
  setNewReqRisk,
  setNewReqVerifyMethod,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,
  addElement,
  getElements,
  setNewElementType,
  setNewElementDocRef,
  addRelationship,
  getRelationships,
  clear,
};
