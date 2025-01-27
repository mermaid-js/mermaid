import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
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
  RequirementClass,
  RequirementType,
  RiskLevel,
  VerifyType,
} from './types.js';

export class RequirementDB implements DiagramDB {
  private relations: Relation[] = [];
  private latestRequirement: Requirement = this.getInitialRequirement();
  private requirements = new Map<string, Requirement>();
  private latestElement: Element = this.getInitialElement();
  private elements = new Map<string, Element>();
  private classes = new Map<string, RequirementClass>();
  private direction = 'TB';

  private RequirementType = {
    REQUIREMENT: 'Requirement',
    FUNCTIONAL_REQUIREMENT: 'Functional Requirement',
    INTERFACE_REQUIREMENT: 'Interface Requirement',
    PERFORMANCE_REQUIREMENT: 'Performance Requirement',
    PHYSICAL_REQUIREMENT: 'Physical Requirement',
    DESIGN_CONSTRAINT: 'Design Constraint',
  };

  private RiskLevel = {
    LOW_RISK: 'Low',
    MED_RISK: 'Medium',
    HIGH_RISK: 'High',
  };

  private VerifyType = {
    VERIFY_ANALYSIS: 'Analysis',
    VERIFY_DEMONSTRATION: 'Demonstration',
    VERIFY_INSPECTION: 'Inspection',
    VERIFY_TEST: 'Test',
  };

  private Relationships = {
    CONTAINS: 'contains',
    COPIES: 'copies',
    DERIVES: 'derives',
    SATISFIES: 'satisfies',
    VERIFIES: 'verifies',
    REFINES: 'refines',
    TRACES: 'traces',
  };

  constructor() {
    this.clear();

    // Needed for JISON since it only supports direct properties
    this.setDirection = this.setDirection.bind(this);
    this.addRequirement = this.addRequirement.bind(this);
    this.setNewReqId = this.setNewReqId.bind(this);
    this.setNewReqRisk = this.setNewReqRisk.bind(this);
    this.setNewReqText = this.setNewReqText.bind(this);
    this.setNewReqVerifyMethod = this.setNewReqVerifyMethod.bind(this);
    this.addElement = this.addElement.bind(this);
    this.setNewElementType = this.setNewElementType.bind(this);
    this.setNewElementDocRef = this.setNewElementDocRef.bind(this);
    this.addRelationship = this.addRelationship.bind(this);
    this.setCssStyle = this.setCssStyle.bind(this);
    this.setClass = this.setClass.bind(this);
    this.defineClass = this.defineClass.bind(this);
    this.setAccTitle = this.setAccTitle.bind(this);
    this.setAccDescription = this.setAccDescription.bind(this);
  }

  public getDirection() {
    return this.direction;
  }
  public setDirection(dir: string) {
    this.direction = dir;
  }

  private resetLatestRequirement() {
    this.latestRequirement = this.getInitialRequirement();
  }

  private resetLatestElement() {
    this.latestElement = this.getInitialElement();
  }

  private getInitialRequirement(): Requirement {
    return {
      requirementId: '',
      text: '',
      risk: '' as RiskLevel,
      verifyMethod: '' as VerifyType,
      name: '',
      type: '' as RequirementType,
      cssStyles: [],
      classes: ['default'],
    };
  }

  private getInitialElement(): Element {
    return {
      name: '',
      type: '',
      docRef: '',
      cssStyles: [],
      classes: ['default'],
    };
  }

  public addRequirement(name: string, type: RequirementType) {
    if (!this.requirements.has(name)) {
      this.requirements.set(name, {
        name,
        type,
        requirementId: this.latestRequirement.requirementId,
        text: this.latestRequirement.text,
        risk: this.latestRequirement.risk,
        verifyMethod: this.latestRequirement.verifyMethod,
        cssStyles: [],
        classes: ['default'],
      });
    }
    this.resetLatestRequirement();

    return this.requirements.get(name);
  }

  public getRequirements() {
    return this.requirements;
  }

  public setNewReqId(id: string) {
    if (this.latestRequirement !== undefined) {
      this.latestRequirement.requirementId = id;
    }
  }

  public setNewReqText(text: string) {
    if (this.latestRequirement !== undefined) {
      this.latestRequirement.text = text;
    }
  }

  public setNewReqRisk(risk: RiskLevel) {
    if (this.latestRequirement !== undefined) {
      this.latestRequirement.risk = risk;
    }
  }

  public setNewReqVerifyMethod(verifyMethod: VerifyType) {
    if (this.latestRequirement !== undefined) {
      this.latestRequirement.verifyMethod = verifyMethod;
    }
  }

  public addElement(name: string) {
    if (!this.elements.has(name)) {
      this.elements.set(name, {
        name,
        type: this.latestElement.type,
        docRef: this.latestElement.docRef,
        cssStyles: [],
        classes: ['default'],
      });
      log.info('Added new element: ', name);
    }
    this.resetLatestElement();

    return this.elements.get(name);
  }

  public getElements() {
    return this.elements;
  }

  public setNewElementType(type: string) {
    if (this.latestElement !== undefined) {
      this.latestElement.type = type;
    }
  }

  public setNewElementDocRef(docRef: string) {
    if (this.latestElement !== undefined) {
      this.latestElement.docRef = docRef;
    }
  }

  public addRelationship(type: RelationshipType, src: string, dst: string) {
    this.relations.push({
      type,
      src,
      dst,
    });
  }

  public getRelationships() {
    return this.relations;
  }

  public clear() {
    this.relations = [];
    this.resetLatestRequirement();
    this.requirements = new Map();
    this.resetLatestElement();
    this.elements = new Map();
    this.classes = new Map();
    commonClear();
  }

  public setCssStyle(ids: string[], styles: string[]) {
    for (const id of ids) {
      const node = this.requirements.get(id) ?? this.elements.get(id);
      if (!styles || !node) {
        return;
      }
      for (const s of styles) {
        if (s.includes(',')) {
          node.cssStyles.push(...s.split(','));
        } else {
          node.cssStyles.push(s);
        }
      }
    }
  }

  public setClass(ids: string[], classNames: string[]) {
    for (const id of ids) {
      const node = this.requirements.get(id) ?? this.elements.get(id);
      if (node) {
        for (const _class of classNames) {
          node.classes.push(_class);
          const styles = this.classes.get(_class)?.styles;
          if (styles) {
            node.cssStyles.push(...styles);
          }
        }
      }
    }
  }

  public defineClass(ids: string[], style: string[]) {
    for (const id of ids) {
      let styleClass = this.classes.get(id);
      if (styleClass === undefined) {
        styleClass = { id, styles: [], textStyles: [] };
        this.classes.set(id, styleClass);
      }

      if (style) {
        style.forEach(function (s) {
          if (/color/.exec(s)) {
            const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
            styleClass.textStyles.push(newStyle);
          }
          styleClass.styles.push(s);
        });
      }

      this.requirements.forEach((value) => {
        if (value.classes.includes(id)) {
          value.cssStyles.push(...style.flatMap((s) => s.split(',')));
        }
      });
      this.elements.forEach((value) => {
        if (value.classes.includes(id)) {
          value.cssStyles.push(...style.flatMap((s) => s.split(',')));
        }
      });
    }
  }

  public getClasses() {
    return this.classes;
  }

  public getData() {
    const config = getConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    for (const requirement of this.requirements.values()) {
      const node = requirement as unknown as Node;
      node.id = requirement.name;
      node.cssStyles = requirement.cssStyles;
      node.cssClasses = requirement.classes.join(' ');
      node.shape = 'requirementBox';
      node.look = config.look;
      nodes.push(node);
    }

    for (const element of this.elements.values()) {
      const node = element as unknown as Node;
      node.shape = 'requirementBox';
      node.look = config.look;
      node.id = element.name;
      node.cssStyles = element.cssStyles;
      node.cssClasses = element.classes.join(' ');

      nodes.push(node);
    }

    for (const relation of this.relations) {
      let counter = 0;
      const isContains = relation.type === this.Relationships.CONTAINS;
      const edge: Edge = {
        id: `${relation.src}-${relation.dst}-${counter}`,
        start: this.requirements.get(relation.src)?.name ?? this.elements.get(relation.src)?.name,
        end: this.requirements.get(relation.dst)?.name ?? this.elements.get(relation.dst)?.name,
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

    return { nodes, edges, other: {}, config, direction: this.getDirection() };
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getConfig = () => getConfig().requirement;
}
