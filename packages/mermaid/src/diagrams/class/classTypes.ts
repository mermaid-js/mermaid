import { getConfig } from '../../diagram-api/diagramAPI.js';
import { parseGenericTypes, sanitizeText } from '../common/common.js';

export interface ClassNode {
  id: string;
  type: string;
  label: string;
  text: string;
  cssClasses: string[];
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

        this.id = match[2].trim();
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
    this.text = `${this.visibility}${this.id}${this.memberType === 'method' ? `(${this.parameters})${this.returnType ? ' : ' + this.returnType : ''}` : ''}`;
    const combinedText = `${this.visibility}${this.id}${this.memberType === 'method' ? `(${this.parameters})${this.returnType ? ' : ' + this.returnType : ''}` : ''}`;
    if (combinedText.includes('~')) {
      const numOfTildes = (combinedText.substring(1).match(/~/g) ?? []).length;
      let count = numOfTildes;
      if (count !== 1) {
        const odd = count % 2 > 0;

        // Replace all '~' with '>'
        let replacedRaw = combinedText.substring(1).replaceAll('~', '&gt;');

        // Replace the first half of '>' with '<'
        while (count > 0) {
          replacedRaw = replacedRaw.replace('&gt;', '&lt;');
          count -= 2; // Each iteration replaces one '>' with '<', so reduce count by 2
        }
        if (odd) {
          if (this.memberType === 'method') {
            replacedRaw = replacedRaw.replace('&lt;', '~');
          } else {
            // Replace the middle occurrence of '&lt;' with '~'
            const ltOccurrences = replacedRaw.match(/&lt;/g) ?? [];
            if (ltOccurrences.length > 1) {
              let ltCount = 0;

              replacedRaw = replacedRaw.replace(/&lt;/g, (match) => {
                ltCount++;
                return ltCount === ltOccurrences.length ? '~' : match;
              });
            }
          }
        }
        this.text = this.text.charAt(0) + replacedRaw;
        if (this.visibility === '~') {
          this.text = this.text.replace('~', '\\~');
        }
      } else if (count === 1 && this.visibility === '~') {
        this.text = this.text.replace('~', '\\~');
      }
    }

    if (this.classifier === '$') {
      this.text = `<u>${this.text}</u>`;
    } else if (this.classifier === '*') {
      this.text = `<i>${this.text}</i>`;
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

export interface NamespaceNode {
  id: string;
  domId: string;
  classes: ClassMap;
  children: NamespaceMap;
}

export type ClassMap = Map<string, ClassNode>;
export type NamespaceMap = Map<string, NamespaceNode>;
