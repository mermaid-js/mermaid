import type { Selection } from 'd3';
import { select } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import utils from '../../utils.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { ClassMember } from './classTypes.js';
import type {
  ClassRelation,
  ClassNode,
  ClassNote,
  ClassMap,
  NamespaceMap,
  NamespaceNode,
} from './classTypes.js';

const MERMAID_DOM_ID_PREFIX = 'classId-';

let relations: ClassRelation[] = [];
let classes: Map<string, ClassNode> = new Map();
let notes: ClassNote[] = [];
let classCounter = 0;
let namespaces: Map<string, NamespaceNode> = new Map();
let namespaceCounter = 0;

let functions: any[] = [];

const sanitizeText = (txt: string) => common.sanitizeText(txt, getConfig());

const splitClassNameAndType = function (_id: string) {
  const id = common.sanitizeText(_id, getConfig());
  let genericType = '';
  let className = id;

  if (id.indexOf('~') > 0) {
    const split = id.split('~');
    className = sanitizeText(split[0]);
    genericType = sanitizeText(split[1]);
  }

  return { className: className, type: genericType };
};

export const setClassLabel = function (_id: string, label: string) {
  const id = common.sanitizeText(_id, getConfig());
  if (label) {
    label = sanitizeText(label);
  }

  const { className } = splitClassNameAndType(id);
  classes.get(className)!.label = label;
};

/**
 * Function called by parser when a node definition has been found.
 *
 * @param id - Id of the class to add
 * @public
 */
export const addClass = function (_id: string) {
  const id = common.sanitizeText(_id, getConfig());
  const { className, type } = splitClassNameAndType(id);
  // Only add class if not exists
  if (classes.has(className)) {
    return;
  }
  // alert('Adding class: ' + className);
  const name = common.sanitizeText(className, getConfig());
  // alert('Adding class after: ' + name);
  classes.set(name, {
    id: name,
    type: type,
    label: name,
    cssClasses: [],
    methods: [],
    members: [],
    annotations: [],
    styles: [],
    domId: MERMAID_DOM_ID_PREFIX + name + '-' + classCounter,
  } as ClassNode);

  classCounter++;
};

/**
 * Function to lookup domId from id in the graph definition.
 *
 * @param id - class ID to lookup
 * @public
 */
export const lookUpDomId = function (_id: string): string {
  const id = common.sanitizeText(_id, getConfig());
  if (classes.has(id)) {
    return classes.get(id)!.domId;
  }
  throw new Error('Class not found: ' + id);
};

export const clear = function () {
  relations = [];
  classes = new Map();
  notes = [];
  functions = [];
  functions.push(setupToolTips);
  namespaces = new Map();
  namespaceCounter = 0;
  commonClear();
};

export const getClass = function (id: string): ClassNode {
  return classes.get(id)!;
};

export const getClasses = function (): ClassMap {
  return classes;
};

export const getRelations = function (): ClassRelation[] {
  return relations;
};

export const getNotes = function () {
  return notes;
};

export const addRelation = function (relation: ClassRelation) {
  log.debug('Adding relation: ' + JSON.stringify(relation));
  addClass(relation.id1);
  addClass(relation.id2);

  relation.id1 = splitClassNameAndType(relation.id1).className;
  relation.id2 = splitClassNameAndType(relation.id2).className;

  relation.relationTitle1 = common.sanitizeText(relation.relationTitle1.trim(), getConfig());

  relation.relationTitle2 = common.sanitizeText(relation.relationTitle2.trim(), getConfig());

  relations.push(relation);
};

/**
 * Adds an annotation to the specified class Annotations mark special properties of the given type
 * (like 'interface' or 'service')
 *
 * @param className - The class name
 * @param annotation - The name of the annotation without any brackets
 * @public
 */
export const addAnnotation = function (className: string, annotation: string) {
  const validatedClassName = splitClassNameAndType(className).className;
  classes.get(validatedClassName)!.annotations.push(annotation);
};

/**
 * Adds a member to the specified class
 *
 * @param className - The class name
 * @param member - The full name of the member. If the member is enclosed in `<<brackets>>` it is
 *   treated as an annotation If the member is ending with a closing bracket ) it is treated as a
 *   method Otherwise the member will be treated as a normal property
 * @public
 */
export const addMember = function (className: string, member: string) {
  addClass(className);

  const validatedClassName = splitClassNameAndType(className).className;
  const theClass = classes.get(validatedClassName)!;

  if (typeof member === 'string') {
    // Member can contain white spaces, we trim them out
    const memberString = member.trim();

    if (memberString.startsWith('<<') && memberString.endsWith('>>')) {
      // its an annotation
      theClass.annotations.push(sanitizeText(memberString.substring(2, memberString.length - 2)));
    } else if (memberString.indexOf(')') > 0) {
      //its a method
      theClass.methods.push(new ClassMember(memberString, 'method'));
    } else if (memberString) {
      theClass.members.push(new ClassMember(memberString, 'attribute'));
    }
  }
};

export const addMembers = function (className: string, members: string[]) {
  if (Array.isArray(members)) {
    members.reverse();
    members.forEach((member) => addMember(className, member));
  }
};

export const addNote = function (text: string, className: string) {
  const note = {
    id: `note${notes.length}`,
    class: className,
    text: text,
  };
  notes.push(note);
};

export const cleanupLabel = function (label: string) {
  if (label.startsWith(':')) {
    label = label.substring(1);
  }
  return sanitizeText(label.trim());
};

/**
 * Called by parser when assigning cssClass to a class
 *
 * @param ids - Comma separated list of ids
 * @param className - Class to add
 */
export const setCssClass = function (ids: string, className: string) {
  ids.split(',').forEach(function (_id) {
    let id = _id;
    if (_id[0].match(/\d/)) {
      id = MERMAID_DOM_ID_PREFIX + id;
    }
    const classNode = classes.get(id);
    if (classNode) {
      classNode.cssClasses.push(className);
    }
  });
};

/**
 * Called by parser when a tooltip is found, e.g. a clickable element.
 *
 * @param ids - Comma separated list of ids
 * @param tooltip - Tooltip to add
 */
const setTooltip = function (ids: string, tooltip?: string) {
  ids.split(',').forEach(function (id) {
    if (tooltip !== undefined) {
      classes.get(id)!.tooltip = sanitizeText(tooltip);
    }
  });
};

export const getTooltip = function (id: string, namespace?: string) {
  if (namespace && namespaces.has(namespace)) {
    return namespaces.get(namespace)!.classes.get(id)!.tooltip;
  }

  return classes.get(id)!.tooltip;
};

/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 *
 * @param ids - Comma separated list of ids
 * @param linkStr - URL to create a link for
 * @param target - Target of the link, _blank by default as originally defined in the svgDraw.js file
 */
export const setLink = function (ids: string, linkStr: string, target: string) {
  const config = getConfig();
  ids.split(',').forEach(function (_id) {
    let id = _id;
    if (_id[0].match(/\d/)) {
      id = MERMAID_DOM_ID_PREFIX + id;
    }
    const theClass = classes.get(id);
    if (theClass) {
      theClass.link = utils.formatUrl(linkStr, config);
      if (config.securityLevel === 'sandbox') {
        theClass.linkTarget = '_top';
      } else if (typeof target === 'string') {
        theClass.linkTarget = sanitizeText(target);
      } else {
        theClass.linkTarget = '_blank';
      }
    }
  });
  setCssClass(ids, 'clickable');
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 *
 * @param ids - Comma separated list of ids
 * @param functionName - Function to be called on click
 * @param functionArgs - Function args the function should be called with
 */
export const setClickEvent = function (ids: string, functionName: string, functionArgs: string) {
  ids.split(',').forEach(function (id) {
    setClickFunc(id, functionName, functionArgs);
    classes.get(id)!.haveCallback = true;
  });
  setCssClass(ids, 'clickable');
};

const setClickFunc = function (_domId: string, functionName: string, functionArgs: string) {
  const domId = common.sanitizeText(_domId, getConfig());
  const config = getConfig();
  if (config.securityLevel !== 'loose') {
    return;
  }
  if (functionName === undefined) {
    return;
  }

  const id = domId;
  if (classes.has(id)) {
    const elemId = lookUpDomId(id);
    let argList: string[] = [];
    if (typeof functionArgs === 'string') {
      /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
      argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      for (let i = 0; i < argList.length; i++) {
        let item = argList[i].trim();
        /* Removes all double quotes at the start and end of an argument */
        /* This preserves all starting and ending whitespace inside */
        if (item.charAt(0) === '"' && item.charAt(item.length - 1) === '"') {
          item = item.substr(1, item.length - 2);
        }
        argList[i] = item;
      }
    }

    /* if no arguments passed into callback, default to passing in id */
    if (argList.length === 0) {
      argList.push(elemId);
    }

    functions.push(function () {
      const elem = document.querySelector(`[id="${elemId}"]`);
      if (elem !== null) {
        elem.addEventListener(
          'click',
          function () {
            utils.runFunc(functionName, ...argList);
          },
          false
        );
      }
    });
  }
};

export const bindFunctions = function (element: Element) {
  functions.forEach(function (fun) {
    fun(element);
  });
};

export const lineType = {
  LINE: 0,
  DOTTED_LINE: 1,
};

export const relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3,
  LOLLIPOP: 4,
};

const setupToolTips = function (element: Element) {
  let tooltipElem: Selection<HTMLDivElement, unknown, HTMLElement, unknown> =
    select('.mermaidTooltip');
  // @ts-expect-error - Incorrect types
  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = select('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  const svg = select(element).select('svg');

  const nodes = svg.selectAll('g.node');
  nodes
    .on('mouseover', function () {
      const el = select(this);
      const title = el.attr('title');
      // Don't try to draw a tooltip if no data is provided
      if (title === null) {
        return;
      }
      // @ts-ignore - getBoundingClientRect is not part of the d3 type definition
      const rect = this.getBoundingClientRect();

      // @ts-expect-error - Incorrect types
      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .text(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
      tooltipElem.html(tooltipElem.html().replace(/&lt;br\/&gt;/g, '<br/>'));
      el.classed('hover', true);
    })
    .on('mouseout', function () {
      // @ts-expect-error - Incorrect types
      tooltipElem.transition().duration(500).style('opacity', 0);
      const el = select(this);
      el.classed('hover', false);
    });
};
functions.push(setupToolTips);

let direction = 'TB';
const getDirection = () => direction;
const setDirection = (dir: string) => {
  direction = dir;
};

/**
 * Function called by parser when a namespace definition has been found.
 *
 * @param id - Id of the namespace to add
 * @public
 */
export const addNamespace = function (id: string) {
  if (namespaces.has(id)) {
    return;
  }

  namespaces.set(id, {
    id: id,
    classes: new Map(),
    children: {},
    domId: MERMAID_DOM_ID_PREFIX + id + '-' + namespaceCounter,
  } as NamespaceNode);

  namespaceCounter++;
};

const getNamespace = function (name: string): NamespaceNode {
  return namespaces.get(name)!;
};

const getNamespaces = function (): NamespaceMap {
  return namespaces;
};

/**
 * Function called by parser when a namespace definition has been found.
 *
 * @param id - Id of the namespace to add
 * @param classNames - Ids of the class to add
 * @public
 */
export const addClassesToNamespace = function (id: string, classNames: string[]) {
  if (!namespaces.has(id)) {
    return;
  }
  for (const name of classNames) {
    const { className } = splitClassNameAndType(name);
    classes.get(className)!.parent = id;
    namespaces.get(id)!.classes.set(className, classes.get(className)!);
  }
};

export const setCssStyle = function (id: string, styles: string[]) {
  const thisClass = classes.get(id);
  if (!styles || !thisClass) {
    return;
  }
  for (const s of styles) {
    if (s.includes(',')) {
      thisClass.styles.push(...s.split(','));
    } else {
      thisClass.styles.push(s);
    }
  }
};

export default {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  getConfig: () => getConfig().class,
  addClass,
  bindFunctions,
  clear,
  getClass,
  getClasses,
  getNotes,
  addAnnotation,
  addNote,
  getRelations,
  addRelation,
  getDirection,
  setDirection,
  addMember,
  addMembers,
  cleanupLabel,
  lineType,
  relationType,
  setClickEvent,
  setCssClass,
  setLink,
  getTooltip,
  setTooltip,
  lookUpDomId,
  setDiagramTitle,
  getDiagramTitle,
  setClassLabel,
  addNamespace,
  addClassesToNamespace,
  getNamespace,
  getNamespaces,
  setCssStyle,
};
