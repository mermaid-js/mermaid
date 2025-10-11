import { getConfig } from '../../diagram-api/diagramAPI.js';
import { parseGenericTypes, sanitizeText } from '../common/common.js';

export interface ClassNode {
  id: string;
  type: string;
  label: string;
  shape: string;
  text: string;
  cssClasses: string;
  methods: ClassMember[];
  members: ClassMember[];
  annotations: string[];
  domId: string;
  styles: string[];
  parent?: string;
  link?: string;
  linkTarget?: string;
  haveCallback?: boolean;
  tooltip?: string;
  look?: string;
}

export type Visibility = '#' | '+' | '~' | '-' | '';
export const visibilityValues = ['#', '+', '~', '-', ''];

/**
 * Parses and stores class diagram member variables/methods.
 *
 */
export class ClassMember {
  id!: string;
  cssStyle!: string;
  memberType!: 'method' | 'attribute';
  visibility!: Visibility;
  text: string;
  /**
   * denote if static or to determine which css class to apply to the node
   * @defaultValue ''
   */
  classifier!: string;
  /**
   * parameters for method
   * @defaultValue ''
   */
  parameters!: string;
  /**
   * return type for method
   * @defaultValue ''
   */
  returnType!: string;

  constructor(input: string, memberType: 'method' | 'attribute') {
    this.memberType = memberType;
    this.visibility = '';
    this.classifier = '';
    this.text = '';
    const sanitizedInput = sanitizeText(input, getConfig());
    this.parseMember(sanitizedInput);
  }

  getDisplayDetails() {
    let displayText = this.visibility + parseGenericTypes(this.id);
    if (this.memberType === 'method') {
      displayText += `(${parseGenericTypes(this.parameters.trim())})`;
      if (this.returnType) {
        displayText += ' : ' + parseGenericTypes(this.returnType);
      }
    }

    displayText = displayText.trim();
    const cssStyle = this.parseClassifier();

    return {
      displayText,
      cssStyle,
    };
  }

  parseMember(input: string) {
    let potentialClassifier = '';

    if (this.memberType === 'method') {
      const methodRegEx = /([#+~-])?(.+)\((.*)\)([$*]{0,2})(.*?)([$*]{0,2})$/;
      const match = methodRegEx.exec(input);
      if (match) {
        this.visibility = (match[1] ? match[1].trim() : '') as Visibility;
        this.id = match[2].trim();
        this.parameters = match[3] ? match[3].trim() : '';
        potentialClassifier = match[4] ? match[4].trim() : '';
        this.returnType = match[5] ? match[5].trim() : '';

        if (potentialClassifier === '') {
          potentialClassifier = match[6] ? match[6].trim() : '';
        }
      }
    } else {
      const fieldRegEx = /([#+~-])?(.*?)([$*]{0,2})$/;
      const match = fieldRegEx.exec(input);

      if (match) {
        this.visibility = (match[1] ? match[1].trim() : '') as Visibility;
        this.id = match[2] ? match[2].trim() : '';
        potentialClassifier = match[3] ? match[3].trim() : '';
      }
    }

    this.classifier = potentialClassifier;
  }

  parseClassifier() {
    switch (this.classifier) {
      case '$':
        return 'text-decoration:underline;';
      case '*':
        return 'font-style:italic;';
      case '$*':
      case '*$':
        return 'text-decoration:underline;font-style:italic;';
      default:
        return '';
    }
  }
}

export interface ClassNote {
  id: string;
  class: string;
  text: string;
}

export interface ClassRelation {
  id1: string;
  id2: string;
  relationTitle1: string;
  relationTitle2: string;
  type: string;
  title: string;
  text: string;
  style: string[];
  relation: {
    type1: number;
    type2: number;
    lineType: number;
  };
}

export interface Interface {
  id: string;
  label: string;
  classId: string;
}

export interface NamespaceNode {
  id: string;
  domId: string;
  classes: ClassMap;
  children: NamespaceMap;
}

export interface StyleClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

export type ClassMap = Map<string, ClassNode>;
export type NamespaceMap = Map<string, NamespaceNode>;
