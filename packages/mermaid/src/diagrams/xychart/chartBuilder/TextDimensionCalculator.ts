import { Dimension } from './Interfaces.js';

export interface ITextDimensionCalculator {
  getDimension(texts: string[], fontSize: number, fontFamily?: string): Dimension;
}

export class TextDimensionCalculator implements ITextDimensionCalculator {
  constructor() {}
  getDimension(texts: string[], fontSize: number): Dimension {
    return {
      width: texts.reduce((acc, cur) => Math.max(cur.length, acc), 0) * fontSize,
      height: fontSize,
    };
  }
}

export class TextDimensionCalculatorWithFont implements ITextDimensionCalculator {
  private container: HTMLSpanElement | null = null;
  private hiddenElementId = 'mermaid-text-dimension-calculator';
  constructor(fontFamily?: string) {
    if (document) {
      let parentContainer = document.getElementById(this.hiddenElementId);
      if (!parentContainer) {
        parentContainer = document.createElement('div');
        parentContainer.id = this.hiddenElementId;
        parentContainer.style.position = 'absolute';
        parentContainer.style.top = '-100px';
        parentContainer.style.left = '0px';
        parentContainer.style.visibility = 'hidden';
        document.body.append(parentContainer);
      }
      const fontClassName = `font-${fontFamily}`;
      const prevContainerAvailable = parentContainer.getElementsByClassName(fontClassName);
      if (prevContainerAvailable.length > 0) {
        this.container = prevContainerAvailable.item(0) as HTMLSpanElement;
      } else {
        this.container = document.createElement('div');
        this.container.className = fontClassName;
        if (fontFamily) {
          this.container.style.fontFamily = fontFamily;
        }
        parentContainer.append(this.container);
      }
    }
  }
  getDimension(texts: string[], fontSize: number): Dimension {
    if (!this.container) {
      return {
        width: texts.reduce((acc, cur) => Math.max(cur.length, acc), 0) * fontSize,
        height: fontSize,
      };
    }

    const dimension: Dimension = {
      width: 0,
      height: 0,
    };

    this.container.style.fontSize = `${fontSize}px`;

    for (let t of texts) {
      this.container.innerHTML = t;
      const bbox = this.container.getBoundingClientRect();
      dimension.width = Math.max(dimension.width, bbox.width);
      dimension.height = Math.max(dimension.height, bbox.height);
    }
    return dimension;
  }
}
