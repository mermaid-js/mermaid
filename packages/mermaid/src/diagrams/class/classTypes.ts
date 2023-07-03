import { parseGenericTypes } from '../common/common.js';

export interface ClassNode {
  id: string;
  type: string;
  label: string;
  cssClasses: string[];
  methods: ClassMember[];
  members: ClassMember[];
  annotations: string[];
  domId: string;
  parent?: string;
  link?: string;
  linkTarget?: string;
  haveCallback?: boolean;
  tooltip?: string;
}

export class ClassMember {
  id!: string;
  cssStyle!: string;
  memberType!: 'method' | 'attribute';
  visibility!: string;
  classifier!: string;
  parameters!: string;
  returnType!: string;

  constructor(input: string, memberType: 'method' | 'attribute') {
    this.memberType = memberType;
    this.visibility = '';
    this.classifier = '';
    this.parseMember(input);
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
      const match = input.match(methodRegEx);
      if (match) {
        this.visibility = match[1] ? match[1].trim() : '';
        this.id = match[2].trim();
        this.parameters = match[3] ? match[3].trim() : '';
        potentialClassifier = match[4] ? match[4].trim() : '';
        this.returnType = match[5] ? match[5].trim() : '';

        if (potentialClassifier === '') {
          const lastChar = this.returnType.substring(this.returnType.length - 1);
          if (lastChar.match(/[$*]/)) {
            potentialClassifier = lastChar;
            this.returnType = this.returnType.substring(0, this.returnType.length - 1);
          }
        }
      }
    } else {
      const length = input.length;
      const firstChar = input.substring(0, 1);
      const lastChar = input.substring(length - 1);

      if (firstChar.match(/[#+~-]/)) {
        this.visibility = firstChar;
      }

      if (lastChar.match(/[*?]/)) {
        potentialClassifier = lastChar;
      }

      this.id = input.substring(
        this.visibility === '' ? 0 : 1,
        potentialClassifier === '' ? length : length - 1
      );
    }

    this.classifier = potentialClassifier;
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

export interface EdgeData {
  arrowheadStyle?: string;
  labelpos?: string;
  labelType?: string;
  label?: string;
  classes: string;
  pattern: string;
  id: string;
  arrowhead: string;
  startLabelRight: string;
  endLabelLeft: string;
  arrowTypeStart: string;
  arrowTypeEnd: string;
  style: string;
  labelStyle: string;
  curve: any;
}

export type ClassRelation = {
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
};

export interface NamespaceNode {
  id: string;
  domId: string;
  classes: ClassMap;
  children: NamespaceMap;
}

export type ClassMap = Record<string, ClassNode>;
export type NamespaceMap = Record<string, NamespaceNode>;
