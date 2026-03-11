import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import common from '../common/common.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { IshikawaNode } from './ishikawaTypes.js';

interface StackEntry {
  level: number;
  node: IshikawaNode;
}

export class IshikawaDB implements DiagramDB {
  private root?: IshikawaNode;
  private stack: StackEntry[] = [];
  private baseLevel?: number;

  constructor() {
    this.clear = this.clear.bind(this);
    this.addNode = this.addNode.bind(this);
    this.getRoot = this.getRoot.bind(this);
  }

  clear(): void {
    this.root = undefined;
    this.stack = [];
    this.baseLevel = undefined;
    commonClear();
  }

  getRoot(): IshikawaNode | undefined {
    return this.root;
  }

  addNode(rawLevel: number, text: string): void {
    const label = common.sanitizeText(text, getConfig());

    if (!this.root) {
      this.baseLevel = rawLevel;
      this.root = { text: label, children: [] };
      this.stack = [{ level: 0, node: this.root }];
      setDiagramTitle(label);
      return;
    }

    let level = rawLevel - (this.baseLevel ?? 0);
    if (level <= 0) {
      level = 1;
    }

    // Pop stack until the top has a strictly lower level (= parent)
    while (this.stack.length > 1 && this.stack[this.stack.length - 1].level >= level) {
      this.stack.pop();
    }

    const parent = this.stack[this.stack.length - 1].node;
    const node: IshikawaNode = { text: label, children: [] };
    parent.children.push(node);
    this.stack.push({ level, node });
  }

  getAccTitle(): string {
    return getAccTitle();
  }

  setAccTitle(title: string): void {
    setAccTitle(title);
  }

  getAccDescription(): string {
    return getAccDescription();
  }

  setAccDescription(description: string): void {
    setAccDescription(description);
  }

  getDiagramTitle(): string {
    return getDiagramTitle();
  }

  setDiagramTitle(title: string): void {
    setDiagramTitle(title);
  }
}
