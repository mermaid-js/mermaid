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
import type { DiagramDB } from '../../diagram-api/types.js';

const MERMAID_DOM_ID_PREFIX = 'classId-';
let classCounter = 0;

const sanitizeText = (txt: string) => common.sanitizeText(txt, getConfig());

export class ClassDB implements DiagramDB {
  private relations: ClassRelation[] = [];
  private classes = new Map<string, ClassNode>();
  private readonly styleClasses = new Map<string, StyleClass>();
  private notes: ClassNote[] = [];
  private interfaces: Interface[] = [];
  // private static classCounter = 0;
  private namespaces = new Map<string, NamespaceNode>();
  private namespaceCounter = 0;

  private functions: any[] = [];

  constructor() {
    this.functions.push(this.setupToolTips.bind(this));
    this.clear();

    // Needed for JISON since it only supports direct properties
    this.addRelation = this.addRelation.bind(this);
    this.addClassesToNamespace = this.addClassesToNamespace.bind(this);
    this.addNamespace = this.addNamespace.bind(this);
    this.setCssClass = this.setCssClass.bind(this);
    this.addMembers = this.addMembers.bind(this);
    this.addClass = this.addClass.bind(this);
    this.setClassLabel = this.setClassLabel.bind(this);
    this.addAnnotation = this.addAnnotation.bind(this);
    this.addMember = this.addMember.bind(this);
    this.cleanupLabel = this.cleanupLabel.bind(this);
    this.addNote = this.addNote.bind(this);
    this.defineClass = this.defineClass.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.setLink = this.setLink.bind(this);
    this.bindFunctions = this.bindFunctions.bind(this);
    this.clear = this.clear.bind(this);

    this.setTooltip = this.setTooltip.bind(this);
    this.setClickEvent = this.setClickEvent.bind(this);
    this.setCssStyle = this.setCssStyle.bind(this);
  }

  private splitClassNameAndType(_id: string) {
    const id = common.sanitizeText(_id, getConfig());
    let genericType = '';
    let className = id;

    if (id.indexOf('~') > 0) {
      const split = id.split('~');
      className = sanitizeText(split[0]);
      genericType = sanitizeText(split[1]);
    }

    return { className: className, type: genericType };
  }

  public setClassLabel(_id: string, label: string) {
    const id = common.sanitizeText(_id, getConfig());
    if (label) {
      label = sanitizeText(label);
    }

    const { className } = this.splitClassNameAndType(id);
    this.classes.get(className)!.label = label;
    this.classes.get(className)!.text =
      `${label}${this.classes.get(className)!.type ? `<${this.classes.get(className)!.type}>` : ''}`;
  }

  /**
   * Function called by parser when a node definition has been found.
   *
   * @param id - Id of the class to add
   * @public
   */
  public addClass(_id: string) {
    const id = common.sanitizeText(_id, getConfig());
    const { className, type } = this.splitClassNameAndType(id);
    // Only add class if not exists
    if (this.classes.has(className)) {
      return;
    }
    // alert('Adding class: ' + className);
    const name = common.sanitizeText(className, getConfig());
    // alert('Adding class after: ' + name);
    this.classes.set(name, {
      id: name,
      type: type,
      label: name,
      text: `${name}${type ? `&lt;${type}&gt;` : ''}`,
      shape: 'classBox',
      cssClasses: 'default',
      methods: [],
      members: [],
      annotations: [],
      styles: [],
      domId: MERMAID_DOM_ID_PREFIX + name + '-' + classCounter,
    } as ClassNode);

    classCounter++;
  }

  private addInterface(label: string, classId: string) {
    const classInterface: Interface = {
      id: `interface${this.interfaces.length}`,
      label,
      classId,
    };

    this.interfaces.push(classInterface);
  }

  /**
   * Function to lookup domId from id in the graph definition.
   *
   * @param id - class ID to lookup
   * @public
   */
  public lookUpDomId(_id: string): string {
    const id = common.sanitizeText(_id, getConfig());
    if (this.classes.has(id)) {
      return this.classes.get(id)!.domId;
    }
    throw new Error('Class not found: ' + id);
  }

  public clear() {
    this.relations = [];
    this.classes = new Map();
    this.notes = [];
    this.interfaces = [];
    this.functions = [];
    this.functions.push(this.setupToolTips.bind(this));
    this.namespaces = new Map();
    this.namespaceCounter = 0;
    this.direction = 'TB';
    commonClear();
  }

  public getClass(id: string): ClassNode {
    return this.classes.get(id)!;
  }

  public getClasses(): ClassMap {
    return this.classes;
  }

  public getRelations(): ClassRelation[] {
    return this.relations;
  }

  public getNotes() {
    return this.notes;
  }

  public addRelation(classRelation: ClassRelation) {
    log.debug('Adding relation: ' + JSON.stringify(classRelation));
    // Due to relationType cannot just check if it is equal to 'none' or it complains, can fix this later
    const invalidTypes = [
      this.relationType.LOLLIPOP,
      this.relationType.AGGREGATION,
      this.relationType.COMPOSITION,
      this.relationType.DEPENDENCY,
      this.relationType.EXTENSION,
    ];

    if (
      classRelation.relation.type1 === this.relationType.LOLLIPOP &&
      !invalidTypes.includes(classRelation.relation.type2)
    ) {
      this.addClass(classRelation.id2);
      this.addInterface(classRelation.id1, classRelation.id2);
      classRelation.id1 = `interface${this.interfaces.length - 1}`;
    } else if (
      classRelation.relation.type2 === this.relationType.LOLLIPOP &&
      !invalidTypes.includes(classRelation.relation.type1)
    ) {
      this.addClass(classRelation.id1);
      this.addInterface(classRelation.id2, classRelation.id1);
      classRelation.id2 = `interface${this.interfaces.length - 1}`;
    } else {
      this.addClass(classRelation.id1);
      this.addClass(classRelation.id2);
    }

    classRelation.id1 = this.splitClassNameAndType(classRelation.id1).className;
    classRelation.id2 = this.splitClassNameAndType(classRelation.id2).className;

    classRelation.relationTitle1 = common.sanitizeText(
      classRelation.relationTitle1.trim(),
      getConfig()
    );

    classRelation.relationTitle2 = common.sanitizeText(
      classRelation.relationTitle2.trim(),
      getConfig()
    );

    this.relations.push(classRelation);
  }

  /**
   * Adds an annotation to the specified class Annotations mark special properties of the given type
   * (like 'interface' or 'service')
   *
   * @param className - The class name
   * @param annotation - The name of the annotation without any brackets
   * @public
   */
  public addAnnotation(className: string, annotation: string) {
    const validatedClassName = this.splitClassNameAndType(className).className;
    this.classes.get(validatedClassName)!.annotations.push(annotation);
  }

  /**
   * Adds a member to the specified class
   *
   * @param className - The class name
   * @param member - The full name of the member. If the member is enclosed in `<<brackets>>` it is
   *   treated as an annotation If the member is ending with a closing bracket ) it is treated as a
   *   method Otherwise the member will be treated as a normal property
   * @public
   */
  public addMember(className: string, member: string) {
    this.addClass(className);

    const validatedClassName = this.splitClassNameAndType(className).className;
    const theClass = this.classes.get(validatedClassName)!;

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
  }

  public addMembers(className: string, members: string[]) {
    if (Array.isArray(members)) {
      members.reverse();
      members.forEach((member) => this.addMember(className, member));
    }
  }

  public addNote(text: string, className: string) {
    const note = {
      id: `note${this.notes.length}`,
      class: className,
      text: text,
    };
    this.notes.push(note);
  }

  public cleanupLabel(label: string) {
    if (label.startsWith(':')) {
      label = label.substring(1);
    }
    return sanitizeText(label.trim());
  }

  /**
   * Called by parser when assigning cssClass to a class
   *
   * @param ids - Comma separated list of ids
   * @param className - Class to add
   */
  public setCssClass(ids: string, className: string) {
    ids.split(',').forEach((_id) => {
      let id = _id;
      if (/\d/.exec(_id[0])) {
        id = MERMAID_DOM_ID_PREFIX + id;
      }
      const classNode = this.classes.get(id);
      if (classNode) {
        classNode.cssClasses += ' ' + className;
      }
    });
  }

  public defineClass(ids: string[], style: string[]) {
    for (const id of ids) {
      let styleClass = this.styleClasses.get(id);
      if (styleClass === undefined) {
        styleClass = { id, styles: [], textStyles: [] };
        this.styleClasses.set(id, styleClass);
      }

      if (style) {
        style.forEach((s) => {
          if (/color/.exec(s)) {
            const newStyle = s.replace('fill', 'bgFill'); // .replace('color', 'fill');
            styleClass.textStyles.push(newStyle);
          }
          styleClass.styles.push(s);
        });
      }

      this.classes.forEach((value) => {
        if (value.cssClasses.includes(id)) {
          value.styles.push(...style.flatMap((s) => s.split(',')));
        }
      });
    }
  }

  /**
   * Called by parser when a tooltip is found, e.g. a clickable element.
   *
   * @param ids - Comma separated list of ids
   * @param tooltip - Tooltip to add
   */
  public setTooltip(ids: string, tooltip?: string) {
    ids.split(',').forEach((id) => {
      if (tooltip !== undefined) {
        this.classes.get(id)!.tooltip = sanitizeText(tooltip);
      }
    });
  }

  public getTooltip(id: string, namespace?: string) {
    if (namespace && this.namespaces.has(namespace)) {
      return this.namespaces.get(namespace)!.classes.get(id)!.tooltip;
    }

    return this.classes.get(id)!.tooltip;
  }

  /**
   * Called by parser when a link is found. Adds the URL to the vertex data.
   *
   * @param ids - Comma separated list of ids
   * @param linkStr - URL to create a link for
   * @param target - Target of the link, _blank by default as originally defined in the svgDraw.js file
   */
  public setLink(ids: string, linkStr: string, target: string) {
    const config = getConfig();
    ids.split(',').forEach((_id) => {
      let id = _id;
      if (/\d/.exec(_id[0])) {
        id = MERMAID_DOM_ID_PREFIX + id;
      }
      const theClass = this.classes.get(id);
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
    this.setCssClass(ids, 'clickable');
  }

  /**
   * Called by parser when a click definition is found. Registers an event handler.
   *
   * @param ids - Comma separated list of ids
   * @param functionName - Function to be called on click
   * @param functionArgs - Function args the function should be called with
   */
  public setClickEvent(ids: string, functionName: string, functionArgs: string) {
    ids.split(',').forEach((id) => {
      this.setClickFunc(id, functionName, functionArgs);
      this.classes.get(id)!.haveCallback = true;
    });
    this.setCssClass(ids, 'clickable');
  }

  private setClickFunc(_domId: string, functionName: string, functionArgs: string) {
    const domId = common.sanitizeText(_domId, getConfig());
    const config = getConfig();
    if (config.securityLevel !== 'loose') {
      return;
    }
    if (functionName === undefined) {
      return;
    }

    const id = domId;
    if (this.classes.has(id)) {
      const elemId = this.lookUpDomId(id);
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

      this.functions.push(() => {
        const elem = document.querySelector(`[id="${elemId}"]`);
        if (elem !== null) {
          elem.addEventListener(
            'click',
            () => {
              utils.runFunc(functionName, ...argList);
            },
            false
          );
        }
      });
    }
  }

  public bindFunctions(element: Element) {
    this.functions.forEach((fun) => {
      fun(element);
    });
  }

  public readonly lineType = {
    LINE: 0,
    DOTTED_LINE: 1,
  };

  public readonly relationType = {
    AGGREGATION: 0,
    EXTENSION: 1,
    COMPOSITION: 2,
    DEPENDENCY: 3,
    LOLLIPOP: 4,
  };

  private readonly setupToolTips = (element: Element) => {
    let tooltipElem: Selection<HTMLDivElement, unknown, HTMLElement, unknown> =
      select('.mermaidTooltip');
    // @ts-expect-error - Incorrect types
    if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
      tooltipElem = select('body')
        .append('div')
        .attr('class', 'mermaidTooltip')
        .style('opacity', 0);
    }

    const svg = select(element).select('svg');

    const nodes = svg.selectAll('g.node');
    nodes
      .on('mouseover', (event: MouseEvent) => {
        const el = select(event.currentTarget as HTMLElement);
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
      .on('mouseout', (event: MouseEvent) => {
        tooltipElem.transition().duration(500).style('opacity', 0);
        const el = select(event.currentTarget as HTMLElement);
        el.classed('hover', false);
      });
  };

  private direction = 'TB';
  public getDirection() {
    return this.direction;
  }
  public setDirection(dir: string) {
    this.direction = dir;
  }

  /**
   * Function called by parser when a namespace definition has been found.
   *
   * @param id - Id of the namespace to add
   * @public
   */
  public addNamespace(id: string) {
    if (this.namespaces.has(id)) {
      return;
    }

    this.namespaces.set(id, {
      id: id,
      classes: new Map(),
      children: {},
      domId: MERMAID_DOM_ID_PREFIX + id + '-' + this.namespaceCounter,
    } as NamespaceNode);

    this.namespaceCounter++;
  }

  public getNamespace(name: string): NamespaceNode {
    return this.namespaces.get(name)!;
  }

  public getNamespaces(): NamespaceMap {
    return this.namespaces;
  }

  /**
   * Function called by parser when a namespace definition has been found.
   *
   * @param id - Id of the namespace to add
   * @param classNames - Ids of the class to add
   * @public
   */
  public addClassesToNamespace(id: string, classNames: string[]) {
    if (!this.namespaces.has(id)) {
      return;
    }
    for (const name of classNames) {
      const { className } = this.splitClassNameAndType(name);
      this.classes.get(className)!.parent = id;
      this.namespaces.get(id)!.classes.set(className, this.classes.get(className)!);
    }
  }

  public setCssStyle(id: string, styles: string[]) {
    const thisClass = this.classes.get(id);
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
  }

  /**
   * Gets the arrow marker for a type index
   *
   * @param type - The type to look for
   * @returns The arrow marker
   */
  private getArrowMarker(type: number) {
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

  public getData() {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const config = getConfig();

    for (const namespaceKey of this.namespaces.keys()) {
      const namespace = this.namespaces.get(namespaceKey);
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

    for (const classKey of this.classes.keys()) {
      const classNode = this.classes.get(classKey);
      if (classNode) {
        const node = classNode as unknown as Node;
        node.parentId = classNode.parent;
        node.look = config.look;
        nodes.push(node);
      }
    }

    let cnt = 0;
    for (const note of this.notes) {
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

      const noteClassId = this.classes.get(note.class)?.id ?? '';

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

    for (const _interface of this.interfaces) {
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
    for (const classRelation of this.relations) {
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
        arrowTypeStart: this.getArrowMarker(classRelation.relation.type1),
        arrowTypeEnd: this.getArrowMarker(classRelation.relation.type2),
        startLabelRight:
          classRelation.relationTitle1 === 'none' ? '' : classRelation.relationTitle1,
        endLabelLeft: classRelation.relationTitle2 === 'none' ? '' : classRelation.relationTitle2,
        arrowheadStyle: '',
        labelStyle: ['display: inline-block'],
        style: classRelation.style || '',
        pattern: classRelation.relation.lineType == 1 ? 'dashed' : 'solid',
        look: config.look,
      };
      edges.push(edge);
    }

    return { nodes, edges, other: {}, config, direction: this.getDirection() };
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getConfig = () => getConfig().class;
}
