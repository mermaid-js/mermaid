import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';

let relations = [];
let latestRequirement = {};
let requirements = new Map();
let latestElement = {};
let elements = new Map();

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

const addRequirement = (name, type) => {
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
  latestRequirement = {};

  return requirements.get(name);
};

const getRequirements = () => requirements;

const setNewReqId = (id) => {
  if (latestRequirement !== undefined) {
    latestRequirement.id = id;
  }
};

const setNewReqText = (text) => {
  if (latestRequirement !== undefined) {
    latestRequirement.text = text;
  }
};

const setNewReqRisk = (risk) => {
  if (latestRequirement !== undefined) {
    latestRequirement.risk = risk;
  }
};

const setNewReqVerifyMethod = (verifyMethod) => {
  if (latestRequirement !== undefined) {
    latestRequirement.verifyMethod = verifyMethod;
  }
};

const addElement = (name) => {
  if (!elements.has(name)) {
    elements.set(name, {
      name,
      type: latestElement.type,
      docRef: latestElement.docRef,
    });
    log.info('Added new requirement: ', name);
  }
  latestElement = {};

  return elements.get(name);
};

const getElements = () => elements;

const setNewElementType = (type) => {
  if (latestElement !== undefined) {
    latestElement.type = type;
  }
};

const setNewElementDocRef = (docRef) => {
  if (latestElement !== undefined) {
    latestElement.docRef = docRef;
  }
};

const addRelationship = (type, src, dst) => {
  relations.push({
    type,
    src,
    dst,
  });
};

const getRelationships = () => relations;

const clear = () => {
  relations = [];
  latestRequirement = {};
  requirements = new Map();
  latestElement = {};
  elements = new Map();
  commonClear();
};

export default {
  RequirementType,
  RiskLevel,
  VerifyType,
  Relationships,

  getConfig: () => getConfig().req,

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
