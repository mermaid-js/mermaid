import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import type { Node, Edge } from '../../rendering-util/types.js';

import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
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

const getData = () => {
  const config = getConfig();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  for (const requirement of requirements.values()) {
    const node = requirement as unknown as Node;
    node.shape = 'requirementBox';
    node.look = config.look;
    nodes.push(node);
  }

  for (const element of elements.values()) {
    const node = element as unknown as Node;
    node.shape = 'requirementBox';
    node.look = config.look;
    node.id = element.name;

    nodes.push(node);
  }

  for (const relation of relations) {
    let counter = 0;
    const isContains = relation.type === Relationships.CONTAINS;
    const edge: Edge = {
      id: `${relation.src}-${relation.dst}-${counter}`,
      start: requirements.get(relation.src)?.id ?? elements.get(relation.src)?.name,
      end: requirements.get(relation.dst)?.id ?? elements.get(relation.dst)?.name,
      label: `&lt;&lt;${relation.type}&gt;&gt;`,
      classes: 'relationshipLine',
      style: ['fill:none', isContains ? '' : 'stroke-dasharray: 10,7'],
      labelpos: 'c',
      thickness: 'normal',
      type: 'normal',
      pattern: isContains ? 'normal' : 'dashed',
      arrowTypeEnd: isContains ? 'requirement_contains' : 'requirement_arrow',
      look: config.look,
    };

    edges.push(edge);
    counter++;
  }

  return { nodes, edges, other: {}, config };
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
  setDiagramTitle,
  getDiagramTitle,
  addElement,
  getElements,
  setNewElementType,
  setNewElementDocRef,
  addRelationship,
  getRelationships,
  clear,
  getData,
};
