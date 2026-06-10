import { sanitizeText as _sanitizeText } from './common.js';
import { getConfig } from '../../config.js';

let accTitle = '';
let diagramTitle = '';
let accDescription = '';

const sanitizeText = (txt: string): string => _sanitizeText(txt, getConfig());

/**
 * Instance scoped version of the accessibility title/description and diagram
 * title state below.
 *
 * Diagram DBs that are instantiated per render (the `get db()` pattern in
 * their {@link DiagramDefinition}) must use this class instead of the
 * module-level functions, so that concurrently rendered diagrams cannot
 * overwrite each other's titles.
 *
 * All members are arrow functions so they can be safely detached and exposed
 * directly on a DB instance (e.g. `public setAccTitle = this.common.setAccTitle`).
 */
export class CommonDB {
  private accTitle = '';
  private diagramTitle = '';
  private accDescription = '';

  public clear = (): void => {
    this.accTitle = '';
    this.diagramTitle = '';
    this.accDescription = '';
  };

  public setAccTitle = (txt: string): void => {
    this.accTitle = sanitizeText(txt).replace(/^\s+/g, '');
  };

  public getAccTitle = (): string => this.accTitle;

  public setAccDescription = (txt: string): void => {
    this.accDescription = sanitizeText(txt).replace(/\n\s+/g, '\n');
  };

  public getAccDescription = (): string => this.accDescription;

  public setDiagramTitle = (txt: string): void => {
    this.diagramTitle = sanitizeText(txt);
  };

  public getDiagramTitle = (): string => this.diagramTitle;
}

export const clear = (): void => {
  accTitle = '';
  accDescription = '';
  diagramTitle = '';
};

export const setAccTitle = (txt: string): void => {
  accTitle = sanitizeText(txt).replace(/^\s+/g, '');
};

export const getAccTitle = (): string => accTitle;

export const setAccDescription = (txt: string): void => {
  accDescription = sanitizeText(txt).replace(/\n\s+/g, '\n');
};

export const getAccDescription = (): string => accDescription;

export const setDiagramTitle = (txt: string): void => {
  diagramTitle = sanitizeText(txt);
};

export const getDiagramTitle = (): string => diagramTitle;
