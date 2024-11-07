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
      const methodRegEx = /([#+~-])?(.+)\((.*)\)([\s$*])?(.*)([$*])?/;
      const match = methodRegEx.exec(input);
      if (match) {
        const detectedVisibility = match[1] ? match[1].trim() : '';

        if (visibilityValues.includes(detectedVisibility)) {
          this.visibility = detectedVisibility as Visibility;
        }

        this.id = match[2];
        this.parameters = match[3] ? match[3].trim() : '';
        potentialClassifier = match[4] ? match[4].trim() : '';
        this.returnType = match[5] ? match[5].trim() : '';

        if (potentialClassifier === '') {
          const lastChar = this.returnType.substring(this.returnType.length - 1);
          if (/[$*]/.exec(lastChar)) {
            potentialClassifier = lastChar;
            this.returnType = this.returnType.substring(0, this.returnType.length - 1);
          }
        }
      }
    } else {
      const length = input.length;
      const firstChar = input.substring(0, 1);
      const lastChar = input.substring(length - 1);

      if (visibilityValues.includes(firstChar)) {
        this.visibility = firstChar as Visibility;
      }

      if (/[$*]/.exec(lastChar)) {
        potentialClassifier = lastChar;
      }

      this.id = input.substring(
        this.visibility === '' ? 0 : 1,
        potentialClassifier === '' ? length : length - 1
      );
    }

    this.classifier = potentialClassifier;
    // Preserve one space only
    this.id = this.id.startsWith(' ') ? ' ' + this.id.trim() : this.id.trim();

    const combinedText = `${this.visibility ? '\\' + this.visibility : ''}${parseGenericTypes(this.id)}${this.memberType === 'method' ? `(${parseGenericTypes(this.parameters)})${this.returnType ? ' : ' + parseGenericTypes(this.returnType) : ''}` : ''}`;
    this.text = combinedText.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    if (this.text.startsWith('\\&lt;')) {
      this.text = this.text.replace('\\&lt;', '~');
    }
  }

  parseClassifier() {
    switch (this.classifier) {
      case '*':
        return 'font-style:italic;';
      case '$':
        return 'text-decoration:underline;';
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
