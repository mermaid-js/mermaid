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
import { dataFetcher, reset as resetDataFetching } from './dataFetcher.js';
import { getDir } from './stateRenderer-v3-unified.js';

import {
  DEFAULT_DIAGRAM_DIRECTION,
  DEFAULT_STATE_TYPE,
  DIVIDER_TYPE,
  STMT_APPLYCLASS,
  STMT_CLASSDEF,
  STMT_RELATION,
  STMT_STATE,
  STMT_STYLEDEF,
} from './stateCommon.js';

export class StateDb {
  #START_NODE = '[*]';
  #START_TYPE = 'start';
  #END_NODE = this.#START_NODE;
  #END_TYPE = 'end';
  #COLOR_KEYWORD = 'color';
  #FILL_KEYWORD = 'fill';
  #BG_FILL = 'bgFill';
  #STYLECLASS_SEP = ',';

  constructor() {
    this.clear();
  }

  /**
   * Returns a new list of classes.
   * In the future, this can be replaced with a class common to all diagrams.
   * ClassDef information = { id: id, styles: [], textStyles: [] }
   *
   * @returns {Map<string, any>}
   */
  #newClassesList = () => {
    return new Map();
  };

  #nodes = [];
  #edges = [];

  #direction = DEFAULT_DIAGRAM_DIRECTION;
  #rootDoc = [];
  #classes = this.#newClassesList(); // style classes defined by a classDef

  // --------------------------------------

  #newDoc = () => {
    return {
      /** @type {{ id1: string, id2: string, relationTitle: string }[]} */
      relations: [],
      states: new Map(),
      documents: {},
    };
  };

  #documents = {
    root: this.#newDoc(),
  };

  #currentDocument = this.#documents.root;
  #startEndCount = 0;
  #dividerCnt = 0;

  lineType = {
    LINE: 0,
    DOTTED_LINE: 1,
  };

  relationType = {
    AGGREGATION: 0,
    EXTENSION: 1,
    COMPOSITION: 2,
    DEPENDENCY: 3,
  };

  #clone = (o) => JSON.parse(JSON.stringify(o));

  setRootDoc = (o) => {
    log.info('Setting root doc', o);
    // rootDoc = { id: 'root', doc: o };
    this.#rootDoc = o;
  };

  getRootDoc = () => this.#rootDoc;

  #docTranslator = (parent, node, first) => {
    if (node.stmt === STMT_RELATION) {
      this.#docTranslator(parent, node.state1, true);
      this.#docTranslator(parent, node.state2, false);
    } else {
      if (node.stmt === STMT_STATE) {
        if (node.id === '[*]') {
          node.id = first ? parent.id + '_start' : parent.id + '_end';
          node.start = first;
        } else {
          // This is just a plain state, not a start or end
          node.id = node.id.trim();
        }
      }

      if (node.doc) {
        const doc = [];
        // Check for concurrency
        let currentDoc = [];
        let i;
        for (i = 0; i < node.doc.length; i++) {
          if (node.doc[i].type === DIVIDER_TYPE) {
            const newNode = this.#clone(node.doc[i]);
            newNode.doc = this.#clone(currentDoc);
            doc.push(newNode);
            currentDoc = [];
          } else {
            currentDoc.push(node.doc[i]);
          }
        }

        // If any divider was encountered
        if (doc.length > 0 && currentDoc.length > 0) {
          const newNode = {
            stmt: STMT_STATE,
            id: generateId(),
            type: 'divider',
            doc: this.#clone(currentDoc),
          };
          doc.push(this.#clone(newNode));
          node.doc = doc;
        }

        node.doc.forEach((docNode) => this.#docTranslator(node, docNode, true));
      }
    }
  };
  getRootDocV2 = () => {
    this.#docTranslator({ id: 'root' }, { id: 'root', doc: this.#rootDoc }, true);
    return { id: 'root', doc: this.#rootDoc };
    // Here
  };

  /**
   * Convert all of the statements (stmts) that were parsed into states and relationships.
   * This is done because a state diagram may have nested sections,
   * where each section is a 'document' and has its own set of statements.
   * Ex: the section within a fork has its own statements, and incoming and outgoing statements
   * refer to the fork as a whole (document).
   * See the parser grammar:  the definition of a document is a document then a 'line', where a line can be a statement.
   * This will push the statement into the list of statements for the current document.
   *
   * @param _doc
   */
  extract = (_doc) => {
    // const res = { states: [], relations: [] };
    let doc;
    if (_doc.doc) {
      doc = _doc.doc;
    } else {
      doc = _doc;
    }
    // let doc = root.doc;
    // if (!doc) {
    //   doc = root;
    // }
    log.info(doc);
    this.clear(true);

    log.info('Extract initial document:', doc);

    doc.forEach((item) => {
      log.warn('Statement', item.stmt);
      switch (item.stmt) {
        case STMT_STATE:
          this.addState(
            item.id.trim(),
            item.type,
            item.doc,
            item.description,
            item.note,
            item.classes,
            item.styles,
            item.textStyles
          );
          break;
        case STMT_RELATION:
          this.addRelation(item.state1, item.state2, item.description);
          break;
        case STMT_CLASSDEF:
          this.addStyleClass(item.id.trim(), item.classes);
          break;
        case STMT_STYLEDEF:
          {
            const ids = item.id.trim().split(',');
            const styles = item.styleClass.split(',');
            ids.forEach((id) => {
              let foundState = this.getState(id);
              if (foundState === undefined) {
                const trimmedId = id.trim();
                this.addState(trimmedId);
                foundState = this.getState(trimmedId);
              }
              foundState.styles = styles.map((s) => s.replace(/;/g, '')?.trim());
            });
          }
          break;
        case STMT_APPLYCLASS:
          this.setCssClass(item.id.trim(), item.styleClass);
          break;
      }
    });

    const diagramStates = this.getStates();
    const config = getConfig();
    const look = config.look;

    resetDataFetching();
    dataFetcher(
      undefined,
      this.getRootDocV2(),
      diagramStates,
      this.#nodes,
      this.#edges,
      true,
      look,
      this.#classes
    );
    this.#nodes.forEach((node) => {
      if (Array.isArray(node.label)) {
        // add the rest as description
        node.description = node.label.slice(1);
        if (node.isGroup && node.description.length > 0) {
          throw new Error(
            'Group nodes can only have label. Remove the additional description for node [' +
              node.id +
              ']'
          );
        }
        // add first description as label
        node.label = node.label[0];
      }
    });
  };

  /**
   * Function called by parser when a node definition has been found.
   *
   * @param {null | string} id
   * @param {null | string} type
   * @param {null | string} doc
   * @param {null | string | string[]} descr - description for the state. Can be a string or a list or strings
   * @param {null | string} note
   * @param {null | string | string[]} classes - class styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 class, convert it to an array of that 1 class.
   * @param {null | string | string[]} styles - styles to apply to this state. Can be a string (1 style) or an array of styles. If it's just 1 style, convert it to an array of that 1 style.
   * @param {null | string | string[]} textStyles - text styles to apply to this state. Can be a string (1 text test) or an array of text styles. If it's just 1 text style, convert it to an array of that 1 text style.
   */
  addState = (
    id,
    type = DEFAULT_STATE_TYPE,
    doc = null,
    descr = null,
    note = null,
    classes = null,
    styles = null,
    textStyles = null
  ) => {
    const trimmedId = id?.trim();
    // add the state if needed
    if (!this.#currentDocument.states.has(trimmedId)) {
      log.info('Adding state ', trimmedId, descr);
      this.#currentDocument.states.set(trimmedId, {
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
      if (!this.#currentDocument.states.get(trimmedId).doc) {
        this.#currentDocument.states.get(trimmedId).doc = doc;
      }
      if (!this.#currentDocument.states.get(trimmedId).type) {
        this.#currentDocument.states.get(trimmedId).type = type;
      }
    }

    if (descr) {
      log.info('Setting state description', trimmedId, descr);
      if (typeof descr === 'string') {
        this.addDescription(trimmedId, descr.trim());
      }

      if (typeof descr === 'object') {
        descr.forEach((des) => this.addDescription(trimmedId, des.trim()));
      }
    }

    if (note) {
      const doc2 = this.#currentDocument.states.get(trimmedId);
      doc2.note = note;
      doc2.note.text = common.sanitizeText(doc2.note.text, getConfig());
    }

    if (classes) {
      log.info('Setting state classes', trimmedId, classes);
      const classesList = typeof classes === 'string' ? [classes] : classes;
      classesList.forEach((cssClass) => this.setCssClass(trimmedId, cssClass.trim()));
    }

    if (styles) {
      log.info('Setting state styles', trimmedId, styles);
      const stylesList = typeof styles === 'string' ? [styles] : styles;
      stylesList.forEach((style) => this.setStyle(trimmedId, style.trim()));
    }

    if (textStyles) {
      log.info('Setting state styles', trimmedId, styles);
      const textStylesList = typeof textStyles === 'string' ? [textStyles] : textStyles;
      textStylesList.forEach((textStyle) => this.setTextStyle(trimmedId, textStyle.trim()));
    }
  };

  clear = (saveCommon) => {
    this.#nodes = [];
    this.#edges = [];
    this.#documents = {
      root: this.#newDoc(),
    };
    this.#currentDocument = this.#documents.root;

    // number of start and end nodes; used to construct ids
    this.#startEndCount = 0;
    this.classes = this.#newClassesList();
    if (!saveCommon) {
      commonClear();
    }
  };

  getState = (id) => {
    return this.#currentDocument.states.get(id);
  };
  getStates = () => {
    return this.#currentDocument.states;
  };
  logDocuments = () => {
    log.info('Documents = ', this.#documents);
  };
  getRelations = () => {
    return this.#currentDocument.relations;
  };

  /**
   * If the id is a start node ( [*] ), then return a new id constructed from
   * the start node name and the current start node count.
   * else return the given id
   *
   * @param {string} id
   * @returns {string} - the id (original or constructed)
   */
  #startIdIfNeeded = (id = '') => {
    let fixedId = id;
    if (id === this.#START_NODE) {
      this.#startEndCount++;
      fixedId = `${this.#START_TYPE}${this.#startEndCount}`;
    }
    return fixedId;
  };

  /**
   * If the id is a start node ( [*] ), then return the start type ('start')
   * else return the given type
   *
   * @param {string} id
   * @param {string} type
   * @returns {string} - the type that should be used
   */
  #startTypeIfNeeded = (id = '', type = DEFAULT_STATE_TYPE) => {
    return id === this.#START_NODE ? this.#START_TYPE : type;
  };

  /**
   * If the id is an end node ( [*] ), then return a new id constructed from
   * the end node name and the current start_end node count.
   * else return the given id
   *
   * @param {string} id
   * @returns {string} - the id (original or constructed)
   */
  #endIdIfNeeded = (id = '') => {
    let fixedId = id;
    if (id === this.#END_NODE) {
      this.#startEndCount++;
      fixedId = `${this.#END_TYPE}${this.#startEndCount}`;
    }
    return fixedId;
  };

  /**
   * If the id is an end node ( [*] ), then return the end type
   * else return the given type
   *
   * @param {string} id
   * @param {string} type
   * @returns {string} - the type that should be used
   */
  #endTypeIfNeeded = (id = '', type = DEFAULT_STATE_TYPE) => {
    return id === this.#END_NODE ? this.#END_TYPE : type;
  };

  /**
   *
   * @param item1
   * @param item2
   * @param relationTitle
   */
  addRelationObjs = (item1, item2, relationTitle) => {
    let id1 = this.#startIdIfNeeded(item1.id.trim());
    let type1 = this.#startTypeIfNeeded(item1.id.trim(), item1.type);
    let id2 = this.#startIdIfNeeded(item2.id.trim());
    let type2 = this.#startTypeIfNeeded(item2.id.trim(), item2.type);

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

    this.#currentDocument.relations.push({
      id1,
      id2,
      relationTitle: common.sanitizeText(relationTitle, getConfig()),
    });
  };

  /**
   * Add a relation between two items.  The items may be full objects or just the string id of a state.
   *
   * @param {string | object} item1
   * @param {string | object} item2
   * @param {string} title
   */
  addRelation = (item1, item2, title) => {
    if (typeof item1 === 'object') {
      this.addRelationObjs(item1, item2, title);
    } else {
      const id1 = this.#startIdIfNeeded(item1.trim());
      const type1 = this.#startTypeIfNeeded(item1);
      const id2 = this.#endIdIfNeeded(item2.trim());
      const type2 = this.#endTypeIfNeeded(item2);

      this.addState(id1, type1);
      this.addState(id2, type2);
      this.#currentDocument.relations.push({
        id1,
        id2,
        title: common.sanitizeText(title, getConfig()),
      });
    }
  };

  addDescription = (id, descr) => {
    const theState = this.#currentDocument.states.get(id);
    const _descr = descr.startsWith(':') ? descr.replace(':', '').trim() : descr;
    theState.descriptions.push(common.sanitizeText(_descr, getConfig()));
  };

  cleanupLabel = (label) => {
    if (label.substring(0, 1) === ':') {
      return label.substr(2).trim();
    } else {
      return label.trim();
    }
  };

  getDividerId = () => {
    this.#dividerCnt++;
    return 'divider-id-' + this.#dividerCnt;
  };

  /**
   * Called when the parser comes across a (style) class definition
   * @example classDef my-style fill:#f96;
   *
   * @param {string} id - the id of this (style) class
   * @param  {string | null} styleAttributes - the string with 1 or more style attributes (each separated by a comma)
   */
  addStyleClass = (id, styleAttributes = '') => {
    // create a new style class object with this id
    if (!this.#classes.has(id)) {
      this.#classes.set(id, { id: id, styles: [], textStyles: [] }); // This is a classDef
    }
    const foundClass = this.#classes.get(id);
    if (styleAttributes !== undefined && styleAttributes !== null) {
      styleAttributes.split(this.#STYLECLASS_SEP).forEach((attrib) => {
        // remove any trailing ;
        const fixedAttrib = attrib.replace(/([^;]*);/, '$1').trim();

        // replace some style keywords
        if (RegExp(this.#COLOR_KEYWORD).exec(attrib)) {
          const newStyle1 = fixedAttrib.replace(this.#FILL_KEYWORD, this.#BG_FILL);
          const newStyle2 = newStyle1.replace(this.#COLOR_KEYWORD, this.#FILL_KEYWORD);
          foundClass.textStyles.push(newStyle2);
        }
        foundClass.styles.push(fixedAttrib);
      });
    }
  };

  /**
   * Return all of the style classes
   * @returns {{} | any | classes}
   */
  getClasses = () => {
    return this.#classes;
  };

  /**
   * Add a (style) class or css class to a state with the given id.
   * If the state isn't already in the list of known states, add it.
   * Might be called by parser when a style class or CSS class should be applied to a state
   *
   * @param {string | string[]} itemIds The id or a list of ids of the item(s) to apply the css class to
   * @param {string} cssClassName CSS class name
   */
  setCssClass = (itemIds, cssClassName) => {
    itemIds.split(',').forEach((id) => {
      let foundState = this.getState(id);
      if (foundState === undefined) {
        const trimmedId = id.trim();
        this.addState(trimmedId);
        foundState = this.getState(trimmedId);
      }
      foundState.classes.push(cssClassName);
    });
  };

  /**
   * Add a style to a state with the given id.
   * @example style stateId fill:#f9f,stroke:#333,stroke-width:4px
   *   where 'style' is the keyword
   *   stateId is the id of a state
   *   the rest of the string is the styleText (all of the attributes to be applied to the state)
   *
   * @param itemId The id of item to apply the style to
   * @param styleText - the text of the attributes for the style
   */
  setStyle = (itemId, styleText) => {
    const item = this.getState(itemId);
    if (item !== undefined) {
      item.styles.push(styleText);
    }
  };

  /**
   * Add a text style to a state with the given id
   *
   * @param itemId The id of item to apply the css class to
   * @param cssClassName CSS class name
   */
  setTextStyle = (itemId, cssClassName) => {
    const item = this.getState(itemId);
    if (item !== undefined) {
      item.textStyles.push(cssClassName);
    }
  };

  getDirection = () => this.#direction;
  setDirection = (dir) => {
    this.#direction = dir;
  };

  trimColon = (str) => (str && str[0] === ':' ? str.substr(1).trim() : str.trim());

  getData = () => {
    const config = getConfig();
    return {
      nodes: this.#nodes,
      edges: this.#edges,
      other: {},
      config,
      direction: getDir(this.getRootDocV2()),
    };
  };

  getConfig = () => getConfig().state;
  getAccTitle = getAccTitle;
  setAccTitle = setAccTitle;
  getAccDescription = getAccDescription;
  setAccDescription = setAccDescription;
  setDiagramTitle = setDiagramTitle;
  getDiagramTitle = getDiagramTitle;
}
