import { select, type Selection } from 'd3';
import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import common from '../common/common.js';
import utils, { getEdgeId } from '../../utils.js';
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
  StyleClass,
  Interface,
} from './classTypes.js';
import type { Node, Edge } from '../../rendering-util/types.js';

const MERMAID_DOM_ID_PREFIX = 'classId-';

let relations: ClassRelation[] = [];
let classes = new Map<string, ClassNode>();
const styleClasses = new Map<string, StyleClass>();
let notes: ClassNote[] = [];
let interfaces: Interface[] = [];
let classCounter = 0;
let namespaces = new Map<string, NamespaceNode>();
let namespaceCounter = 0;

let functions: any[] = [];

const sanitizeText = (txt: string) => common.sanitizeText(txt, getConfig());

const splitClassIdAndType = function (_id: string) {
  const id = sanitizeText(_id);
  let genericType = '';
  let classId = id;

  if (id.indexOf('~') > 0) {
    const split = id.split('~');
    classId = sanitizeText(split[0]);
    genericType = sanitizeText(split[1]);
  }

  return { classId, type: genericType };
};

/**
 * Function called by parser when a node definition has been found.
 *
 * @param id - Id of the class to add
 * @public
 */
export const addClass = function (_id: string, label?: string) {
  const id = sanitizeText(_id);
  const { classId, type } = splitClassIdAndType(id);
  let newLabel = classId;

  if (classes.has(classId)) {
    return;
  }

  if (label) {
    newLabel = sanitizeText(label);
  }

  const text = `${newLabel}${type ? `&lt;${type}&gt;` : ''}`;

  classes.set(classId, {
    id: classId,
    type: type,
    label: newLabel,
    text: text,
    shape: 'classBox',
    cssClasses: 'default',
    methods: [],
    attributes: [],
    annotations: [],
    styles: [],
    domId: `${MERMAID_DOM_ID_PREFIX}${classId}-${classCounter}`,
  } as ClassNode);

  classCounter++;
};

const addInterface = function (label: string, classId: string) {
  const classInterface: Interface = {
    id: `interface${interfaces.length}`,
    label,
    classId,
  };

  interfaces.push(classInterface);
};

/**
 * Function to lookup domId from id in the graph definition.
 *
 * @param id - class ID to lookup
 * @public
 */
export const lookUpDomId = function (_id: string): string {
  const id = sanitizeText(_id);
  if (classes.has(id)) {
    return classes.get(id)!.domId;
  }
  throw new Error('Class not found: ' + id);
};

export const clear = function () {
  relations = [];
  classes = new Map();
  notes = [];
  interfaces = [];
  functions = [];
  functions.push(setupToolTips);
  namespaces = new Map();
  namespaceCounter = 0;
  direction = 'TB';
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

export const addRelation = function (classRelation: ClassRelation) {
  log.debug('Adding relation: ' + JSON.stringify(classRelation));
  // Due to relationType cannot just check if it is equal to 'none' or it complains, can fix this later
  const invalidTypes = [
    relationType.LOLLIPOP,
    relationType.AGGREGATION,
    relationType.COMPOSITION,
    relationType.DEPENDENCY,
    relationType.EXTENSION,
  ];

  if (
    classRelation.relation.type1 === relationType.LOLLIPOP &&
    !invalidTypes.includes(classRelation.relation.type2)
  ) {
    addClass(classRelation.id2);
    addInterface(classRelation.id1, classRelation.id2);
    classRelation.id1 = `interface${interfaces.length - 1}`;
  } else if (
    classRelation.relation.type2 === relationType.LOLLIPOP &&
    !invalidTypes.includes(classRelation.relation.type1)
  ) {
    addClass(classRelation.id1);
    addInterface(classRelation.id2, classRelation.id1);
    classRelation.id2 = `interface${interfaces.length - 1}`;
  } else {
    addClass(classRelation.id1);
    addClass(classRelation.id2);
  }

  classRelation.id1 = splitClassIdAndType(classRelation.id1).classId;
  classRelation.id2 = splitClassIdAndType(classRelation.id2).classId;

  classRelation.relationTitle1 = sanitizeText(classRelation.relationTitle1.trim());

  classRelation.relationTitle2 = sanitizeText(classRelation.relationTitle2.trim());

  relations.push(classRelation);
};

/**
 * Adds an annotation to the specified class Annotations mark special properties of the given type
 * (like 'interface' or 'service')
 *
 * @param classId - The class name
 * @param annotation - The name of the annotation without any brackets
 * @public
 */
export const addAnnotation = function (className: string, annotation: string) {
  const validatedClassName = splitClassIdAndType(className).classId;
  classes.get(validatedClassName)!.annotations.push(annotation);
};

/**
 * Adds a member to the specified class
 *
 * @param classId - The class name
 * @param member - The full name of the member. If the member is enclosed in `<<brackets>>` it is
 *   treated as an annotation If the member is ending with a closing bracket ) it is treated as a
 *   method Otherwise the member will be treated as a normal property
 * @public
 */
export const addMember = function (classId: string, member: string) {
  addClass(classId);

  const validatedClassId = splitClassIdAndType(classId).classId;
  const theClass = classes.get(validatedClassId)!;

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
      theClass.attributes.push(new ClassMember(memberString, 'attribute'));
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
    if (/\d/.exec(_id[0])) {
      id = MERMAID_DOM_ID_PREFIX + id;
    }
    const classNode = classes.get(id);
    if (classNode) {
      classNode.cssClasses += ' ' + className;
    }
  });
};

export const defineClass = function (ids: string[], style: string[]) {
  for (const id of ids) {
    let styleClass = styleClasses.get(id);
    if (styleClass === undefined) {
      styleClass = { id, styles: [], textStyles: [] };
      styleClasses.set(id, styleClass);
    }

    if (style) {
      style.forEach(function (s) {
        if (/color/.exec(s)) {
          const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
          styleClass.textStyles.push(newStyle);
        }
        styleClass.styles.push(s);
      });
    }

    classes.forEach((value) => {
      if (value.cssClasses.includes(id)) {
        value.styles.push(...style.flatMap((s) => s.split(',')));
      }
    });
  }
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
    if (/\d/.exec(_id[0])) {
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
  const domId = sanitizeText(_domId);
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
        if (item.startsWith('"') && item.endsWith('"')) {
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

      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .text(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
      tooltipElem.html(tooltipElem.html().replace(/&lt;br\/&gt;/g, '<br/>'));
      el.classed('hover', true);
    })
    .on('mouseout', function () {
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
 * @param classIds - Ids of the class to add
 * @public
 */
export const addClassesToNamespace = function (_id: string, classIds: string[]) {
  addNamespace(_id);
  for (const id of classIds) {
    const { classId } = splitClassIdAndType(id);
    classes.get(classId)!.parent = _id;
    namespaces.get(_id)!.classes.set(classId, classes.get(classId)!);
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

/**
 * Gets the arrow marker for a type index
 *
 * @param type - The type to look for
 * @returns The arrow marker
 */
function getArrowMarker(type: number) {
  let marker;
  switch (type) {
    case 0:
      marker = 'aggregation';
      break;
    case 1:
      marker = 'extension';
      break;
    case 2:
      marker = 'composition';
      break;
    case 3:
      marker = 'dependency';
      break;
    case 4:
      marker = 'lollipop';
      break;
    default:
      marker = 'none';
  }
  return marker;
}

export const getData = () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const config = getConfig();

  for (const namespaceKey of namespaces.keys()) {
    const namespace = namespaces.get(namespaceKey);
    if (namespace) {
      const node: Node = {
        id: namespace.id,
        label: namespace.id,
        isGroup: true,
        padding: config.class!.padding ?? 16,
        // parent node must be one of [rect, roundedWithTitle, noteGroup, divider]
        shape: 'rect',
        cssStyles: ['fill: none', 'stroke: black'],
        look: config.look,
      };
      nodes.push(node);
    }
  }

  for (const classKey of classes.keys()) {
    const classNode = classes.get(classKey);
    if (classNode) {
      const node = classNode as unknown as Node;
      node.parentId = classNode.parent;
      node.look = config.look;
      nodes.push(node);
    }
  }

  let cnt = 0;
  for (const note of notes) {
    cnt++;
    const noteNode: Node = {
      id: note.id,
      label: note.text,
      isGroup: false,
      shape: 'note',
      padding: config.class!.padding ?? 6,
      cssStyles: [
        'text-align: left',
        'white-space: nowrap',
        `fill: ${config.themeVariables.noteBkgColor}`,
        `stroke: ${config.themeVariables.noteBorderColor}`,
      ],
      look: config.look,
    };
    nodes.push(noteNode);

    const noteClassId = classes.get(note.class)?.id ?? '';

    if (noteClassId) {
      const edge: Edge = {
        id: `edgeNote${cnt}`,
        start: note.id,
        end: noteClassId,
        type: 'normal',
        thickness: 'normal',
        classes: 'relation',
        arrowTypeStart: 'none',
        arrowTypeEnd: 'none',
        arrowheadStyle: '',
        labelStyle: [''],
        style: ['fill: none'],
        pattern: 'dotted',
        look: config.look,
      };
      edges.push(edge);
    }
  }

  for (const _interface of interfaces) {
    const interfaceNode: Node = {
      id: _interface.id,
      label: _interface.label,
      isGroup: false,
      shape: 'rect',
      cssStyles: ['opacity: 0;'],
      look: config.look,
    };
    nodes.push(interfaceNode);
  }

  cnt = 0;
  for (const classRelation of relations) {
    cnt++;
    const edge: Edge = {
      id: getEdgeId(classRelation.id1, classRelation.id2, {
        prefix: 'id',
        counter: cnt,
      }),
      start: classRelation.id1,
      end: classRelation.id2,
      type: 'normal',
      label: classRelation.title,
      labelpos: 'c',
      thickness: 'normal',
      classes: 'relation',
      arrowTypeStart: getArrowMarker(classRelation.relation.type1),
      arrowTypeEnd: getArrowMarker(classRelation.relation.type2),
      startLabelRight: classRelation.relationTitle1 === 'none' ? '' : classRelation.relationTitle1,
      endLabelLeft: classRelation.relationTitle2 === 'none' ? '' : classRelation.relationTitle2,
      arrowheadStyle: '',
      labelStyle: ['display: inline-block'],
      style: classRelation.style || '',
      pattern: classRelation.relation.lineType == 1 ? 'dashed' : 'solid',
      look: config.look,
    };
    edges.push(edge);
  }

  return { nodes, edges, other: {}, config, direction: getDirection() };
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
  defineClass,
  setLink,
  getTooltip,
  setTooltip,
  lookUpDomId,
  setDiagramTitle,
  getDiagramTitle,
  addNamespace,
  addClassesToNamespace,
  getNamespace,
  getNamespaces,
  setCssStyle,
  getData,
};
