import { select } from 'd3';
import { log } from '../../logger';
import * as configApi from '../../config';
import common from '../common/common';
import utils from '../../utils';
import mermaidAPI from '../../mermaidAPI';

const MERMAID_DOM_ID_PREFIX = 'classid-';

let relations = [];
let classes = {};
let classCounter = 0;

let funs = [];

export const parseDirective = function (statement, context, type) {
  mermaidAPI.parseDirective(this, statement, context, type);
};

const splitClassNameAndType = function (id) {
  let genericType = '';
  let className = id;

  if (id.indexOf('~') > 0) {
    let split = id.split('~');
    className = split[0];

    genericType = split[1];
  }

  return { className: className, type: genericType };
};

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @public
 */
export const addClass = function (id) {
  let classId = splitClassNameAndType(id);
  // Only add class if not exists
  if (typeof classes[classId.className] !== 'undefined') return;

  classes[classId.className] = {
    id: classId.className,
    type: classId.type,
    cssClasses: [],
    methods: [],
    members: [],
    annotations: [],
    domId: MERMAID_DOM_ID_PREFIX + classId.className + '-' + classCounter,
  };

  classCounter++;
};

/**
 * Function to lookup domId from id in the graph definition.
 * @param id
 * @public
 */
export const lookUpDomId = function (id) {
  const classKeys = Object.keys(classes);
  for (let i = 0; i < classKeys.length; i++) {
    if (classes[classKeys[i]].id === id) {
      return classes[classKeys[i]].domId;
    }
  }
};

export const clear = function () {
  relations = [];
  classes = {};
  funs = [];
  funs.push(setupToolTips);
};

export const getClass = function (id) {
  return classes[id];
};
export const getClasses = function () {
  return classes;
};

export const getRelations = function () {
  return relations;
};

export const addRelation = function (relation) {
  log.debug('Adding relation: ' + JSON.stringify(relation));
  addClass(relation.id1);
  addClass(relation.id2);

  relation.id1 = splitClassNameAndType(relation.id1).className;
  relation.id2 = splitClassNameAndType(relation.id2).className;

  relations.push(relation);
};

/**
 * Adds an annotation to the specified class
 * Annotations mark special properties of the given type (like 'interface' or 'service')
 * @param className The class name
 * @param annotation The name of the annotation without any brackets
 * @public
 */
export const addAnnotation = function (className, annotation) {
  const validatedClassName = splitClassNameAndType(className).className;
  classes[validatedClassName].annotations.push(annotation);
};

/**
 * Adds a member to the specified class
 * @param className The class name
 * @param member The full name of the member.
 * If the member is enclosed in <<brackets>> it is treated as an annotation
 * If the member is ending with a closing bracket ) it is treated as a method
 * Otherwise the member will be treated as a normal property
 * @public
 */
export const addMember = function (className, member) {
  const validatedClassName = splitClassNameAndType(className).className;
  const theClass = classes[validatedClassName];

  if (typeof member === 'string') {
    // Member can contain white spaces, we trim them out
    const memberString = member.trim();

    if (memberString.startsWith('<<') && memberString.endsWith('>>')) {
      // Remove leading and trailing brackets
      theClass.annotations.push(memberString.substring(2, memberString.length - 2));
    } else if (memberString.indexOf(')') > 0) {
      theClass.methods.push(memberString);
    } else if (memberString) {
      theClass.members.push(memberString);
    }
  }
};

export const addMembers = function (className, members) {
  if (Array.isArray(members)) {
    members.reverse();
    members.forEach((member) => addMember(className, member));
  }
};

export const cleanupLabel = function (label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(1).trim();
  } else {
    return label.trim();
  }
};

/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */
export const setCssClass = function (ids, className) {
  ids.split(',').forEach(function (_id) {
    let id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (typeof classes[id] !== 'undefined') {
      classes[id].cssClasses.push(className);
    }
  });
};

/**
 * Called by parser when a tooltip is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param tooltip Tooltip to add
 */
const setTooltip = function (ids, tooltip) {
  const config = configApi.getConfig();
  ids.split(',').forEach(function (id) {
    if (typeof tooltip !== 'undefined') {
      classes[id].tooltip = common.sanitizeText(tooltip, config);
    }
  });
};

/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 * @param target Target of the link, _blank by default as originally defined in the svgDraw.js file
 */
export const setLink = function (ids, linkStr, target) {
  const config = configApi.getConfig();
  ids.split(',').forEach(function (_id) {
    let id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
    if (typeof classes[id] !== 'undefined') {
      classes[id].link = utils.formatUrl(linkStr, config);
      if (typeof target === 'string') {
        classes[id].linkTarget = target;
      } else {
        classes[id].linkTarget = '_blank';
      }
    }
  });
  setCssClass(ids, 'clickable');
};

/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param functionArgs Function args the function should be called with
 */
export const setClickEvent = function (ids, functionName, functionArgs) {
  ids.split(',').forEach(function (id) {
    setClickFunc(id, functionName, functionArgs);
    classes[id].haveCallback = true;
  });
  setCssClass(ids, 'clickable');
};

const setClickFunc = function (domId, functionName, functionArgs) {
  const config = configApi.getConfig();
  let id = domId;
  let elemId = lookUpDomId(id);

  if (config.securityLevel !== 'loose') {
    return;
  }
  if (typeof functionName === 'undefined') {
    return;
  }
  if (typeof classes[id] !== 'undefined') {
    let argList = [];
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

    funs.push(function () {
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

export const bindFunctions = function (element) {
  funs.forEach(function (fun) {
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
};

const setupToolTips = function (element) {
  let tooltipElem = select('.mermaidTooltip');
  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = select('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  const svg = select(element).select('svg');

  const nodes = svg.selectAll('g.node');
  nodes
    .on('mouseover', function () {
      const el = select(this);
      const title = el.attr('title');
      // Dont try to draw a tooltip if no data is provided
      if (title === null) {
        return;
      }
      const rect = this.getBoundingClientRect();

      tooltipElem.transition().duration(200).style('opacity', '.9');
      tooltipElem
        .html(el.attr('title'))
        .style('left', window.scrollX + rect.left + (rect.right - rect.left) / 2 + 'px')
        .style('top', window.scrollY + rect.top - 14 + document.body.scrollTop + 'px');
      el.classed('hover', true);
    })
    .on('mouseout', function () {
      tooltipElem.transition().duration(500).style('opacity', 0);
      const el = select(this);
      el.classed('hover', false);
    });
};
funs.push(setupToolTips);

export default {
  parseDirective,
  getConfig: () => configApi.getConfig().class,
  addClass,
  bindFunctions,
  clear,
  getClass,
  getClasses,
  addAnnotation,
  getRelations,
  addRelation,
  addMember,
  addMembers,
  cleanupLabel,
  lineType,
  relationType,
  setClickEvent,
  setCssClass,
  setLink,
  setTooltip,
  lookUpDomId,
};
