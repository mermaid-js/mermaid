import { getConfig } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { generateId } from '../../utils.js';
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
import { dataFetcher, reset as resetDataFetcher } from './dataFetcher.js';
import { getDir } from './stateRenderer-v3-unified.js';
import {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  STMT_APPLYCLASS,
  STMT_CLASSDEF,
  STMT_RELATION,
  STMT_ROOT,
  STMT_DIRECTION,
  STMT_STATE,
  STMT_STYLEDEF,
} from './stateCommon.js';
import type { MermaidConfig } from '../../config.type.js';

const CONSTANTS = {
  START_NODE: '[*]',
  START_TYPE: 'start',
  END_NODE: '[*]',
  END_TYPE: 'end',
  COLOR_KEYWORD: 'color',
  FILL_KEYWORD: 'fill',
  BG_FILL: 'bgFill',
  STYLECLASS_SEP: ',',
} as const;

interface BaseStmt {
  stmt:
    | 'applyClass'
    | 'classDef'
    | 'dir'
    | 'relation'
    | 'state'
    | 'style'
    | 'root'
    | 'default'
    | 'click';
}

interface ApplyClassStmt extends BaseStmt {
  stmt: 'applyClass';
  id: string;
  styleClass: string;
}

interface ClassDefStmt extends BaseStmt {
  stmt: 'classDef';
  id: string;
  classes: string;
}

interface DirectionStmt extends BaseStmt {
  stmt: 'dir';
  value: 'TB' | 'BT' | 'RL' | 'LR';
}

interface RelationStmt extends BaseStmt {
  stmt: 'relation';
  state1: StateStmt;
  state2: StateStmt;
  description?: string;
}

export interface StateStmt extends BaseStmt {
  stmt: 'state' | 'default';
  id: string;
  type: 'default' | 'fork' | 'join' | 'choice' | 'divider' | 'start' | 'end';
  description?: string;
  descriptions?: string[];
  doc?: Stmt[];
  note?: Note;
  start?: boolean;
  classes?: string[];
  styles?: string[];
  textStyles?: string[];
}

interface StyleStmt extends BaseStmt {
  stmt: 'style';
  id: string;
  styleClass: string;
}

export interface RootStmt {
  id: 'root';
  stmt: 'root';
  doc?: Stmt[];
}

export interface ClickStmt extends BaseStmt {
  stmt: 'click';
  id: string;
  url: string;
  tooltip: string;
}

interface Note {
  position?: 'left of' | 'right of';
  text: string;
}

export type Stmt =
  | ApplyClassStmt
  | ClassDefStmt
  | DirectionStmt
  | RelationStmt
  | StateStmt
  | StyleStmt
  | RootStmt
  | ClickStmt;

interface DiagramEdge {
  id1: string;
  id2: string;
  relationTitle?: string;
}

interface Document {
  relations: DiagramEdge[];
  states: Map<string, StateStmt>;
  documents: Record<string, Document>;
}

export interface StyleClass {
  id: string;
  styles: string[];
  textStyles: string[];
}

export interface NodeData {
  labelStyle?: string;
  shape: string;
  label?: string | string[];
  cssClasses: string;
  cssCompiledStyles?: string[];
  cssStyles: string[];
  id: string;
  dir?: string;
  domId?: string;
  type?: string;
  isGroup?: boolean;
  padding?: number;
  rx?: number;
  ry?: number;
  look?: MermaidConfig['look'];
  parentId?: string;
  centerLabel?: boolean;
  position?: string;
  description?: string | string[];
}

export interface Edge {
  id: string;
  start: string;
  end: string;
  arrowhead: string;
  arrowTypeEnd: string;
  style: string;
  labelStyle: string;
  label?: string;
  arrowheadStyle: string;
  labelpos: string;
  labelType: string;
  thickness: string;
  classes: string;
  look: MermaidConfig['look'];
}

/**
 * Returns a new list of classes.
 * In the future, this can be replaced with a class common to all diagrams.
 * ClassDef information = \{ id: id, styles: [], textStyles: [] \}
 */
const newClassesList = (): Map<string, StyleClass> => new Map();
const newDoc = (): Document => ({
  relations: [],
  states: new Map(),
  documents: {},
});
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

export class StateDB {
  private nodes: NodeData[] = [];
  private edges: Edge[] = [];
  private rootDoc: Stmt[] = [];
  private classes = newClassesList();
  private documents = { root: newDoc() };
  private currentDocument = this.documents.root;
  private startEndCount = 0;
  private dividerCnt = 0;
  private links = new Map<string, { url: string; tooltip: string }>();

  static readonly relationType = {
    AGGREGATION: 0,
    EXTENSION: 1,
    COMPOSITION: 2,
    DEPENDENCY: 3,
  } as const;

  constructor(private version: 1 | 2) {
    this.clear();
    // Bind methods used by JISON
    this.setRootDoc = this.setRootDoc.bind(this);
    this.getDividerId = this.getDividerId.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.trimColon = this.trimColon.bind(this);
  }

  /**
   * Convert all of the statements (stmts) that were parsed into states and relationships.
   * This is done because a state diagram may have nested sections,
   * where each section is a 'document' and has its own set of statements.
   * Ex: the section within a fork has its own statements, and incoming and outgoing statements
   * refer to the fork as a whole (document).
   * See the parser grammar:  the definition of a document is a document then a 'line', where a line can be a statement.
   * This will push the statement into the list of statements for the current document.
   */
  extract(statements: Stmt[] | { doc: Stmt[] }) {
    this.clear(true);
    for (const item of Array.isArray(statements) ? statements : statements.doc) {
      switch (item.stmt) {
        case STMT_STATE:
          this.addState(item.id.trim(), item.type, item.doc, item.description, item.note);
          break;
        case STMT_RELATION:
          this.addRelation(item.state1, item.state2, item.description);
          break;
        case STMT_CLASSDEF:
          this.addStyleClass(item.id.trim(), item.classes);
          break;
        case STMT_STYLEDEF:
          this.handleStyleDef(item);
          break;
        case STMT_APPLYCLASS:
          this.setCssClass(item.id.trim(), item.styleClass);
          break;
        case 'click':
          this.addLink(item.id, item.url, item.tooltip);
          break;
      }
    }
    const diagramStates = this.getStates();
    const config = getConfig();

    resetDataFetcher();
    dataFetcher(
      undefined,
      this.getRootDocV2() as StateStmt,
      diagramStates,
      this.nodes,
      this.edges,
      true,
      config.look,
      this.classes
    );

    // Process node labels
    for (const node of this.nodes) {
      if (!Array.isArray(node.label)) {
        continue;
      }

      node.description = node.label.slice(1);
      if (node.isGroup && node.description.length > 0) {
        throw new Error(
          `Group nodes can only have label. Remove the additional description for node [${node.id}]`
        );
      }
      node.label = node.label[0];
    }
  }

  private handleStyleDef(item: StyleStmt) {
    const ids = item.id.trim().split(',');
    const styles = item.styleClass.split(',');

    for (const id of ids) {
      let state = this.getState(id);
      if (!state) {
        const trimmedId = id.trim();
        this.addState(trimmedId);
        state = this.getState(trimmedId);
      }
      if (state) {
        state.styles = styles.map((s) => s.replace(/;/g, '')?.trim());
      }
    }
  }

  setRootDoc(o: Stmt[]) {
    log.info('Setting root doc', o);
    this.rootDoc = o;
    if (this.version === 1) {
      this.extract(o);
    } else {
      this.extract(this.getRootDocV2());
    }
  }

  docTranslator(parent: RootStmt | StateStmt, node: Stmt, first: boolean) {
    if (node.stmt === STMT_RELATION) {
      this.docTranslator(parent, node.state1, true);
      this.docTranslator(parent, node.state2, false);
      return;
    }

    if (node.stmt === STMT_STATE) {
      if (node.id === CONSTANTS.START_NODE) {
        node.id = parent.id + (first ? '_start' : '_end');
        node.start = first;
      } else {
        // This is just a plain state, not a start or end
        node.id = node.id.trim();
      }
    }

    if ((node.stmt !== STMT_ROOT && node.stmt !== STMT_STATE) || !node.doc) {
      return;
    }

    const doc = [];
    // Check for concurrency
    let currentDoc = [];
    for (const stmt of node.doc) {
      if ((stmt as StateStmt).type === DIVIDER_TYPE) {
        const newNode = clone(stmt as StateStmt);
        newNode.doc = clone(currentDoc);
        doc.push(newNode);
        currentDoc = [];
      } else {
        currentDoc.push(stmt);
      }
    }

    // If any divider was encountered
    if (doc.length > 0 && currentDoc.length > 0) {
      const newNode = {
        stmt: STMT_STATE,
        id: generateId(),
        type: 'divider',
        doc: clone(currentDoc),
      } satisfies StateStmt;
      doc.push(clone(newNode));
      node.doc = doc;
    }

    node.doc.forEach((docNode) => this.docTranslator(node, docNode, true));
  }

  private getRootDocV2() {
    this.docTranslator(
      { id: STMT_ROOT, stmt: STMT_ROOT },
      { id: STMT_ROOT, stmt: STMT_ROOT, doc: this.rootDoc },
      true
    );
    return { id: STMT_ROOT, doc: this.rootDoc };
  }

  /**
   * Function called by parser when a node definition has been found.
   *
   * @param descr - description for the state. Can be a string or a list or strings
   * @param classes - class styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 class, convert it to an array of that 1 class.
   * @param styles - styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 style, convert it to an array of that 1 style.
   * @param textStyles - text styles to apply to this state. Can be a string (1 text test) or an array of text styles. If it's just 1 text style, convert it to an array of that 1 text style.
   */
  addState(
    id: string,
    type: StateStmt['type'] = DEFAULT_STATE_TYPE,
    doc: Stmt[] | undefined = undefined,
    descr: string | string[] | undefined = undefined,
    note: Note | undefined = undefined,
    classes: string | string[] | undefined = undefined,
    styles: string | string[] | undefined = undefined,
    textStyles: string | string[] | undefined = undefined
  ) {
    const trimmedId = id?.trim();
    if (!this.currentDocument.states.has(trimmedId)) {
      log.info('Adding state ', trimmedId, descr);
      this.currentDocument.states.set(trimmedId, {
        stmt: STMT_STATE,
        id: trimmedId,
        descriptions: [],
        type,
        doc,
        note,
        classes: [],
        styles: [],
        textStyles: [],
      });
    } else {
      const state = this.currentDocument.states.get(trimmedId);
      if (!state) {
        throw new Error(`State not found: ${trimmedId}`);
      }
      if (!state.doc) {
        state.doc = doc;
      }
      if (!state.type) {
        state.type = type;
      }
    }

    if (descr) {
      log.info('Setting state description', trimmedId, descr);
      const descriptions = Array.isArray(descr) ? descr : [descr];
      descriptions.forEach((des) => this.addDescription(trimmedId, des.trim()));
    }

    if (note) {
      const doc2 = this.currentDocument.states.get(trimmedId);
      if (!doc2) {
        throw new Error(`State not found: ${trimmedId}`);
      }
      doc2.note = note;
      doc2.note.text = common.sanitizeText(doc2.note.text, getConfig());
    }

    if (classes) {
      log.info('Setting state classes', trimmedId, classes);
      const classesList = Array.isArray(classes) ? classes : [classes];
      classesList.forEach((cssClass) => this.setCssClass(trimmedId, cssClass.trim()));
    }

    if (styles) {
      log.info('Setting state styles', trimmedId, styles);
      const stylesList = Array.isArray(styles) ? styles : [styles];
      stylesList.forEach((style) => this.setStyle(trimmedId, style.trim()));
    }

    if (textStyles) {
      log.info('Setting state styles', trimmedId, styles);
      const textStylesList = Array.isArray(textStyles) ? textStyles : [textStyles];
      textStylesList.forEach((textStyle) => this.setTextStyle(trimmedId, textStyle.trim()));
    }
  }

  clear(saveCommon?: boolean) {
    this.nodes = [];
    this.edges = [];
    this.documents = { root: newDoc() };
    this.currentDocument = this.documents.root;

    // number of start and end nodes; used to construct ids
    this.startEndCount = 0;
    this.classes = newClassesList();
    if (!saveCommon) {
      this.links = new Map(); // <-- add here
      commonClear();
    }
  }

  getState(id: string) {
    return this.currentDocument.states.get(id);
  }

  getStates() {
    return this.currentDocument.states;
  }

  logDocuments() {
    log.info('Documents = ', this.documents);
  }

  getRelations() {
    return this.currentDocument.relations;
  }

  /**
   * Adds a clickable link to a state.
   */
  addLink(stateId: string, url: string, tooltip: string): void {
    this.links.set(stateId, { url, tooltip });
    log.warn('Adding link', stateId, url, tooltip);
  }

  /**
   * Get all registered links.
   */
  getLinks(): Map<string, { url: string; tooltip: string }> {
    return this.links;
  }

  /**
   * If the id is a start node ( [*] ), then return a new id constructed from
   * the start node name and the current start node count.
   * else return the given id
   */
  startIdIfNeeded(id = '') {
    if (id === CONSTANTS.START_NODE) {
      this.startEndCount++;
      return `${CONSTANTS.START_TYPE}${this.startEndCount}`;
    }
    return id;
  }

  /**
   * If the id is a start node ( [*] ), then return the start type ('start')
   * else return the given type
   */
  startTypeIfNeeded(id = '', type: StateStmt['type'] = DEFAULT_STATE_TYPE) {
    return id === CONSTANTS.START_NODE ? CONSTANTS.START_TYPE : type;
  }

  /**
   * If the id is an end node ( [*] ), then return a new id constructed from
   * the end node name and the current start_end node count.
   * else return the given id
   */
  endIdIfNeeded(id = '') {
    if (id === CONSTANTS.END_NODE) {
      this.startEndCount++;
      return `${CONSTANTS.END_TYPE}${this.startEndCount}`;
    }
    return id;
  }

  /**
   * If the id is an end node ( [*] ), then return the end type
   * else return the given type
   *
   */
  endTypeIfNeeded(id = '', type: StateStmt['type'] = DEFAULT_STATE_TYPE) {
    return id === CONSTANTS.END_NODE ? CONSTANTS.END_TYPE : type;
  }

  addRelationObjs(item1: StateStmt, item2: StateStmt, relationTitle = '') {
    const id1 = this.startIdIfNeeded(item1.id.trim());
    const type1 = this.startTypeIfNeeded(item1.id.trim(), item1.type);
    const id2 = this.startIdIfNeeded(item2.id.trim());
    const type2 = this.startTypeIfNeeded(item2.id.trim(), item2.type);
    this.addState(
      id1,
      type1,
      item1.doc,
      item1.description,
      item1.note,
      item1.classes,
      item1.styles,
      item1.textStyles
    );
    this.addState(
      id2,
      type2,
      item2.doc,
      item2.description,
      item2.note,
      item2.classes,
      item2.styles,
      item2.textStyles
    );
    this.currentDocument.relations.push({
      id1,
      id2,
      relationTitle: common.sanitizeText(relationTitle, getConfig()),
    });
  }

  /**
   * Add a relation between two items.  The items may be full objects or just the string id of a state.
   */
  addRelation(item1: string | StateStmt, item2: string | StateStmt, title?: string) {
    if (typeof item1 === 'object' && typeof item2 === 'object') {
      this.addRelationObjs(item1, item2, title);
    } else if (typeof item1 === 'string' && typeof item2 === 'string') {
      const id1 = this.startIdIfNeeded(item1.trim());
      const type1 = this.startTypeIfNeeded(item1);
      const id2 = this.endIdIfNeeded(item2.trim());
      const type2 = this.endTypeIfNeeded(item2);

      this.addState(id1, type1);
      this.addState(id2, type2);
      this.currentDocument.relations.push({
        id1,
        id2,
        relationTitle: title ? common.sanitizeText(title, getConfig()) : undefined,
      });
    }
  }

  addDescription(id: string, descr: string) {
    const theState = this.currentDocument.states.get(id);
    const _descr = descr.startsWith(':') ? descr.replace(':', '').trim() : descr;
    theState?.descriptions?.push(common.sanitizeText(_descr, getConfig()));
  }

  cleanupLabel(label: string) {
    return label.startsWith(':') ? label.slice(2).trim() : label.trim();
  }

  getDividerId() {
    this.dividerCnt++;
    return `divider-id-${this.dividerCnt}`;
  }

  /**
   * Called when the parser comes across a (style) class definition
   * @example classDef my-style fill:#f96;
   *
   * @param id - the id of this (style) class
   * @param styleAttributes - the string with 1 or more style attributes (each separated by a comma)
   */
  addStyleClass(id: string, styleAttributes = '') {
    // create a new style class object with this id
    if (!this.classes.has(id)) {
      this.classes.set(id, { id, styles: [], textStyles: [] });
    }
    const foundClass = this.classes.get(id);
    if (styleAttributes && foundClass) {
      styleAttributes.split(CONSTANTS.STYLECLASS_SEP).forEach((attrib) => {
        const fixedAttrib = attrib.replace(/([^;]*);/, '$1').trim();
        if (RegExp(CONSTANTS.COLOR_KEYWORD).exec(attrib)) {
          const newStyle1 = fixedAttrib.replace(CONSTANTS.FILL_KEYWORD, CONSTANTS.BG_FILL);
          const newStyle2 = newStyle1.replace(CONSTANTS.COLOR_KEYWORD, CONSTANTS.FILL_KEYWORD);
          foundClass.textStyles.push(newStyle2);
        }
        foundClass.styles.push(fixedAttrib);
      });
    }
  }

  getClasses() {
    return this.classes;
  }

  /**
   * Add a (style) class or css class to a state with the given id.
   * If the state isn't already in the list of known states, add it.
   * Might be called by parser when a style class or CSS class should be applied to a state
   *
   * @param itemIds - The id or a list of ids of the item(s) to apply the css class to
   * @param cssClassName - CSS class name
   */
  setCssClass(itemIds: string, cssClassName: string) {
    itemIds.split(',').forEach((id) => {
      let foundState = this.getState(id);
      if (!foundState) {
        const trimmedId = id.trim();
        this.addState(trimmedId);
        foundState = this.getState(trimmedId);
      }
      foundState?.classes?.push(cssClassName);
    });
  }

  /**
   * Add a style to a state with the given id.
   * @example style stateId fill:#f9f,stroke:#333,stroke-width:4px
   *   where 'style' is the keyword
   *   stateId is the id of a state
   *   the rest of the string is the styleText (all of the attributes to be applied to the state)
   *
   * @param itemId - The id of item to apply the style to
   * @param styleText - the text of the attributes for the style
   */
  setStyle(itemId: string, styleText: string) {
    this.getState(itemId)?.styles?.push(styleText);
  }

  /**
   * Add a text style to a state with the given id
   *
   * @param itemId - The id of item to apply the css class to
   * @param cssClassName - CSS class name
   */
  setTextStyle(itemId: string, cssClassName: string) {
    this.getState(itemId)?.textStyles?.push(cssClassName);
  }

  /**
   * Finds the direction statement in the root document.
   * @returns the direction statement if present
   */
  private getDirectionStatement() {
    return this.rootDoc.find((doc): doc is DirectionStmt => doc.stmt === STMT_DIRECTION);
  }

  getDirection() {
    return this.getDirectionStatement()?.value ?? DEFAULT_DIAGRAM_DIRECTION;
  }

  setDirection(dir: DirectionStmt['value']) {
    const doc = this.getDirectionStatement();
    if (doc) {
      doc.value = dir;
    } else {
      this.rootDoc.unshift({ stmt: STMT_DIRECTION, value: dir });
    }
  }

  trimColon(str: string) {
    return str.startsWith(':') ? str.slice(1).trim() : str.trim();
  }

  getData() {
    const config = getConfig();
    return {
      nodes: this.nodes,
      edges: this.edges,
      other: {},
      config,
      direction: getDir(this.getRootDocV2()),
    };
  }

  getConfig() {
    return getConfig().state;
  }

  getAccTitle = getAccTitle;
  setAccTitle = setAccTitle;
  getAccDescription = getAccDescription;
  setAccDescription = setAccDescription;
  setDiagramTitle = setDiagramTitle;
  getDiagramTitle = getDiagramTitle;
}
