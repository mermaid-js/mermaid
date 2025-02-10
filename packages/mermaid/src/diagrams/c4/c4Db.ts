import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { DiagramDB } from '../../diagram-api/types.js';
import type { Node, Edge } from '../../rendering-util/types.js';
import { sanitizeText } from '../common/common.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,
  clear as commonClear,
} from '../common/commonDb.js';
import type { C4Class, C4Node, C4Relation, LegendItem, Tag } from './c4Types.js';

export class C4DB implements DiagramDB {
  private c4ShapeArray = [];
  private c4Nodes = new Map<string, C4Node>();
  private boundaryParseStack = [''];
  private currentBoundaryParse = 'global';
  private parentBoundaryParse = '';
  private boundaries = [
    {
      alias: 'global',
      label: { text: 'global' },
      type: { text: 'global' },
      tags: null,
      link: null,
      parentBoundary: '',
    },
  ];
  private rels: C4Relation[] = [];
  private wrapEnabled = false;
  private c4ShapeInRow = 4;
  private c4BoundaryInRow = 2;
  private c4Type = '';
  private direction = 'TB';
  private classes = new Map<string, C4Class>();
  private elementTags = new Map<string, Tag>();
  private relTags = new Map<string, Tag>();
  private legend = false;
  private legendTitle = 'Legend';

  constructor() {
    this.clear();

    // Needed for JISON since it only supports direct properties
    this.setDirection = this.setDirection.bind(this);
    this.setC4Type = this.setC4Type.bind(this);
    this.addRel = this.addRel.bind(this);
    this.addPersonOrSystem = this.addPersonOrSystem.bind(this);
    this.addPersonOrSystemBoundary = this.addPersonOrSystemBoundary.bind(this);
    this.addComponent = this.addComponent.bind(this);
    this.addContainer = this.addContainer.bind(this);
    this.addContainerBoundary = this.addContainerBoundary.bind(this);
    this.addDeploymentNode = this.addDeploymentNode.bind(this);
    this.popBoundaryParseStack = this.popBoundaryParseStack.bind(this);
    this.updateElStyle = this.updateElStyle.bind(this);
    this.updateRelStyle = this.updateRelStyle.bind(this);
    this.updateLayoutConfig = this.updateLayoutConfig.bind(this);
    this.setAccTitle = setAccTitle.bind(this);
    this.setAccDescription = setAccDescription.bind(this);
    this.setCssStyle = this.setCssStyle.bind(this);
    this.defineClass = this.defineClass.bind(this);
    this.setClass = this.setClass.bind(this);
    this.addElementTag = this.addElementTag.bind(this);
    this.addRelTag = this.addRelTag.bind(this);
    this.showLegend = this.showLegend.bind(this);
    this.updateLegendTitle = this.updateLegendTitle.bind(this);
  }

  public getDirection() {
    return this.direction;
  }

  public setDirection(dir: string) {
    this.direction = dir;
  }

  public getC4Type() {
    return this.c4Type;
  }

  public setC4Type(c4TypeParam: string) {
    const sanitizedText = sanitizeText(c4TypeParam, getConfig());
    this.c4Type = sanitizedText;
  }

  // Helper function to handle object values
  private applyValueToObject(
    object: Record<string, any>,
    value: object | string,
    specifier: string
  ) {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'object') {
      const [key, text] = Object.entries(value)[0];
      object[key] = text;
    } else {
      object[specifier] = value;
    }
  }

  //type, from, to, label, ?techn, ?descr, ?sprite, ?tags, $link
  public addRel(
    type: string,
    from: string,
    to: string,
    label: string,
    techn: object | string,
    descr: object | string,
    sprite: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!from || !to) {
      return;
    }

    const rel = {
      type,
      label,
      from,
      to,
      wrap: this.autoWrap(),
    };

    this.applyValueToObject(rel, techn, 'techn');
    this.applyValueToObject(rel, descr, 'descr');
    this.applyValueToObject(rel, sprite, 'sprite');
    this.applyValueToObject(rel, tags, 'tags');
    this.applyValueToObject(rel, link, 'link');

    this.rels.push(rel as C4Relation);
  }

  //type, alias, label, ?descr, ?sprite, ?tags, $link
  public addPersonOrSystem(
    typeC4Shape: string,
    alias: string,
    label: string,
    descr: object | string,
    sprite: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const personOrSystem = {
      type: typeC4Shape,
      isBoundary: false,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      link: '',
      shape: 'rect',
    };

    this.applyValueToObject(personOrSystem, descr, 'descr');
    this.applyValueToObject(personOrSystem, sprite, 'sprite');
    this.applyValueToObject(personOrSystem, tags, 'tags');
    this.applyValueToObject(personOrSystem, link, 'link');

    this.c4Nodes.set(alias, personOrSystem as C4Node);
  }

  //type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
  public addContainer(
    typeC4Shape: string,
    alias: string,
    label: string,
    techn: object | string,
    descr: object | string,
    sprite: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const container = {
      type: typeC4Shape,
      isBoundary: false,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      shape: 'rect',
    };

    this.applyValueToObject(container, techn, 'techn');
    this.applyValueToObject(container, descr, 'descr');
    this.applyValueToObject(container, sprite, 'sprite');
    this.applyValueToObject(container, tags, 'tags');
    this.applyValueToObject(container, link, 'link');

    this.c4Nodes.set(alias, container as C4Node);
  }

  //type, alias, label, ?techn, ?descr ?sprite, ?tags, $link
  public addComponent(
    typeC4Shape: string,
    alias: string,
    label: string,
    techn: object | string,
    descr: object | string,
    sprite: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const component = {
      type: typeC4Shape,
      isBoundary: false,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      shape: 'rect',
    };

    this.applyValueToObject(component, techn, 'techn');
    this.applyValueToObject(component, descr, 'descr');
    this.applyValueToObject(component, sprite, 'sprite');
    this.applyValueToObject(component, tags, 'tags');
    this.applyValueToObject(component, link, 'link');

    this.c4Nodes.set(alias, component as C4Node);
  }

  //alias, label, ?type, ?tags, $link
  public addPersonOrSystemBoundary(
    alias: string,
    label: string,
    type: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const boundary = {
      isBoundary: true,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      shape: 'rect',
    };

    this.applyValueToObject(boundary, type || 'system', 'type');
    this.applyValueToObject(boundary, tags, 'tags');
    this.applyValueToObject(boundary, link, 'link');

    this.c4Nodes.set(alias, boundary as C4Node);

    this.parentBoundaryParse = this.currentBoundaryParse;
    this.currentBoundaryParse = alias;
    this.boundaryParseStack.push(this.parentBoundaryParse);
  }

  //alias, label, ?type, ?tags, $link
  public addContainerBoundary(
    alias: string,
    label: string,
    type: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const boundary = {
      isBoundary: true,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      shape: 'rect',
    };

    this.applyValueToObject(boundary, type || 'container', 'type');
    this.applyValueToObject(boundary, tags, 'tags');
    this.applyValueToObject(boundary, link, 'link');

    this.c4Nodes.set(alias, boundary as C4Node);

    this.parentBoundaryParse = this.currentBoundaryParse;
    this.currentBoundaryParse = alias;
    this.boundaryParseStack.push(this.parentBoundaryParse);
  }

  //alias, label, ?type, ?descr, ?sprite, ?tags, $link
  public addDeploymentNode(
    nodeType: string,
    alias: string,
    label: string,
    type: object | string,
    descr: object | string,
    sprite: object | string,
    tags: object | string,
    link: object | string
  ) {
    if (!alias) {
      return;
    }

    const boundary = {
      nodeType,
      isBoundary: true,
      alias,
      label,
      parent: this.currentBoundaryParse,
      wrap: this.autoWrap(),
      cssStyles: [],
      classes: ['default'],
      shape: 'rect',
    };

    this.applyValueToObject(boundary, type || 'node', 'type');
    this.applyValueToObject(boundary, descr, 'descr');
    this.applyValueToObject(boundary, sprite, 'sprite');
    this.applyValueToObject(boundary, tags, 'tags');
    this.applyValueToObject(boundary, link, 'link');

    this.c4Nodes.set(alias, boundary as C4Node);

    this.parentBoundaryParse = this.currentBoundaryParse;
    this.currentBoundaryParse = alias;
    this.boundaryParseStack.push(this.parentBoundaryParse);
  }

  public popBoundaryParseStack() {
    this.currentBoundaryParse = this.parentBoundaryParse;
    this.boundaryParseStack.pop();
    this.parentBoundaryParse = this.boundaryParseStack.pop() ?? '';
    this.boundaryParseStack.push(this.parentBoundaryParse);
  }

  //elementName, ?bgColor, ?fontColor, ?borderColor, ?shadowing, ?shape, ?sprite, ?techn, ?legendText, ?legendSprite
  public updateElStyle(
    typeC4Shape: string,
    elementName: string,
    bgColor: object | string,
    fontColor: object | string,
    borderColor: object | string,
    shadowing: object | string,
    shape: object | string,
    sprite: object | string,
    techn: object | string,
    legendText: object | string,
    legendSprite: object | string
  ) {
    const updatedEl = this.c4Nodes.get(elementName);
    if (!updatedEl) {
      return;
    }

    this.applyValueToObject(updatedEl, bgColor, 'bgColor');
    this.applyValueToObject(updatedEl, fontColor, 'fontColor');
    this.applyValueToObject(updatedEl, borderColor, 'borderColor');
    this.applyValueToObject(updatedEl, shadowing, 'shadowing');
    this.applyValueToObject(updatedEl, shape, 'shape');
    this.applyValueToObject(updatedEl, legendText, 'legendText');
    this.applyValueToObject(updatedEl, legendSprite, 'legendSprite');
    this.applyValueToObject(updatedEl, sprite, 'sprite');
    this.applyValueToObject(updatedEl, techn, 'techn');
  }

  //textColor, lineColor, ?offsetX, ?offsetY
  public updateRelStyle(
    typeC4Shape: string,
    from: string,
    to: string,
    textColor: object | string,
    lineColor: object | string,
    offsetX: object | string,
    offsetY: object | string
  ) {
    const updatedRel = this.rels.find((rel) => rel.from === from && rel.to === to);
    if (!updatedRel) {
      return;
    }
    this.applyValueToObject(updatedRel, textColor, 'textColor');
    this.applyValueToObject(updatedRel, lineColor, 'lineColor');
    this.applyValueToObject(updatedRel, offsetX, 'offsetX');
    this.applyValueToObject(updatedRel, offsetY, 'offsetY');
  }

  public addElementTag(
    tagStereo: string,
    bgColor: object | string,
    fontColor: object | string,
    borderColor: object | string,
    shadowing: object | string,
    shape: object | string,
    sprite: object | string,
    techn: object | string,
    legendText: object | string,
    legendSprite: object | string,
    borderStyle: object | string,
    borderThickness: object | string
  ) {
    if (!tagStereo) {
      return;
    }

    const tag: Tag = {
      tagStereo,
    };

    this.applyValueToObject(tag, bgColor, 'bgColor');
    this.applyValueToObject(tag, fontColor, 'fontColor');
    this.applyValueToObject(tag, borderColor, 'borderColor');
    this.applyValueToObject(tag, shadowing, 'shadowing');
    this.applyValueToObject(tag, sprite, 'sprite');
    this.applyValueToObject(tag, techn, 'techn');
    this.applyValueToObject(tag, legendText, 'legendText');
    this.applyValueToObject(tag, legendSprite, 'legendSprite');
    this.applyValueToObject(tag, borderThickness, 'borderThickness');
    this.applyValueToObject(tag, shape, 'shape');
    this.applyValueToObject(tag, borderStyle, 'borderStyle');

    switch (tag.shape) {
      case 'RoundedBoxShape()': {
        this.applyValueToObject(tag, 'rounded_rect', 'shape');
        break;
      }
      case 'EightSidedShape()': {
        this.applyValueToObject(tag, 'octagon', 'shape');
        break;
      }
      default: {
        this.applyValueToObject(tag, shape, 'shape');
        break;
      }
    }

    switch (tag.borderStyle) {
      case 'DashedLine()': {
        this.applyValueToObject(tag, 'dashed', 'borderStyle');
        break;
      }
      case 'DottedLine()': {
        this.applyValueToObject(tag, 'dotted', 'borderStyle');
        break;
      }
      case 'BoldLine()': {
        this.applyValueToObject(tag, 'bold', 'borderStyle');
        break;
      }
      case 'SolidLine()': {
        this.applyValueToObject(tag, 'solid', 'borderStyle');
        break;
      }
      default: {
        this.applyValueToObject(tag, borderStyle, 'borderStyle');
        break;
      }
    }

    this.elementTags.set(tagStereo, tag);
  }

  public addRelTag(
    tagStereo: string,
    textColor: object | string,
    lineColor: object | string,
    lineStyle: object | string,
    sprite: object | string,
    techn: object | string,
    legendText: object | string,
    legendSprite: object | string,
    lineThickness: object | string
  ) {
    if (!tagStereo) {
      return;
    }

    const tag: Tag = {
      tagStereo,
    };

    this.applyValueToObject(tag, textColor, 'textColor');
    this.applyValueToObject(tag, lineColor, 'lineColor');
    this.applyValueToObject(tag, sprite, 'sprite');
    this.applyValueToObject(tag, techn, 'techn');
    this.applyValueToObject(tag, legendText, 'legendText');
    this.applyValueToObject(tag, legendSprite, 'legendSprite');
    this.applyValueToObject(tag, lineThickness, 'lineThickness');
    this.applyValueToObject(tag, lineStyle, 'lineStyle');

    switch (tag.lineStyle) {
      case 'DashedLine()': {
        this.applyValueToObject(tag, 'dashed', 'lineStyle');
        break;
      }
      case 'DottedLine()': {
        this.applyValueToObject(tag, 'dotted', 'lineStyle');
        break;
      }
      case 'BoldLine()': {
        this.applyValueToObject(tag, 'bold', 'lineStyle');
        break;
      }
      case 'SolidLine()': {
        this.applyValueToObject(tag, 'solid', 'lineStyle');
        break;
      }
      default: {
        this.applyValueToObject(tag, lineStyle, 'lineStyle');
        break;
      }
    }

    this.relTags.set(tagStereo, tag);
  }

  //?c4ShapeInRow, ?c4BoundaryInRow
  public updateLayoutConfig(
    typeC4Shape: string,
    c4ShapeInRowParam: object | string,
    c4BoundaryInRowParam: object | string
  ) {
    let c4ShapeInRowValue = this.c4ShapeInRow;
    let c4BoundaryInRowValue = this.c4BoundaryInRow;

    if (typeof c4ShapeInRowParam === 'object') {
      const value = Object.values(c4ShapeInRowParam)[0];
      c4ShapeInRowValue = parseInt(value);
    } else {
      c4ShapeInRowValue = parseInt(c4ShapeInRowParam);
    }
    if (typeof c4BoundaryInRowParam === 'object') {
      const value = Object.values(c4BoundaryInRowParam)[0];
      c4BoundaryInRowValue = parseInt(value);
    } else {
      c4BoundaryInRowValue = parseInt(c4BoundaryInRowParam);
    }

    if (c4ShapeInRowValue >= 1) {
      this.c4ShapeInRow = c4ShapeInRowValue;
    }
    if (c4BoundaryInRowValue >= 1) {
      this.c4BoundaryInRow = c4BoundaryInRowValue;
    }
  }

  public getC4ShapeInRow() {
    return this.c4ShapeInRow;
  }

  public getC4BoundaryInRow() {
    return this.c4BoundaryInRow;
  }
  public getCurrentBoundaryParse() {
    return this.currentBoundaryParse;
  }

  public getParentBoundaryParse() {
    return this.parentBoundaryParse;
  }

  public getC4ShapeArray(parentBoundary: string) {
    if (parentBoundary === undefined || parentBoundary === null) {
      return this.c4ShapeArray;
    } else {
      return this.c4ShapeArray.filter((personOrSystem: C4Node) => {
        return personOrSystem.parent === parentBoundary;
      });
    }
  }

  public getC4Shape(alias: string) {
    return this.c4ShapeArray.find((personOrSystem: C4Node) => personOrSystem.alias === alias);
  }

  public getC4ShapeKeys(parentBoundary: string) {
    return Object.keys(this.getC4ShapeArray(parentBoundary));
  }

  public getBoundaries(parentBoundary: string) {
    if (parentBoundary === undefined || parentBoundary === null) {
      return this.boundaries;
    } else {
      return this.boundaries.filter((boundary) => boundary.parentBoundary === parentBoundary);
    }
  }

  private setWrap(wrapSetting: boolean) {
    this.wrapEnabled = wrapSetting;
  }

  private autoWrap() {
    return this.wrapEnabled;
  }

  public clear() {
    commonClear();
    this.c4ShapeArray = [];
    this.c4Nodes = new Map();
    this.boundaries = [
      {
        alias: 'global',
        label: { text: 'global' },
        type: { text: 'global' },
        tags: null,
        link: null,
        parentBoundary: '',
      },
    ];
    this.parentBoundaryParse = '';
    this.currentBoundaryParse = 'global';
    this.boundaryParseStack = [''];
    this.rels = [];

    this.boundaryParseStack = [''];
    this.wrapEnabled = false;
    this.c4ShapeInRow = 4;
    this.c4BoundaryInRow = 2;
    this.direction = 'TB';
    this.classes = new Map();
    this.elementTags = new Map();
    this.relTags = new Map();
    this.legend = false;
    this.legendTitle = 'Legend';
  }

  public setCssStyle(ids: string[], styles: string[]) {
    for (const id of ids) {
      const node = this.c4Nodes.get(id) ?? this.c4Nodes.get(id);
      if (!styles || !node) {
        return;
      }
      for (const s of styles) {
        if (s.includes(',')) {
          node.cssStyles.push(...s.split(','));
        } else {
          node.cssStyles.push(s);
        }
      }
    }
  }

  public setClass(ids: string[], classNames: string[]) {
    for (const id of ids) {
      const node = this.c4Nodes.get(id);
      if (node) {
        for (const _class of classNames) {
          node.classes.push(_class);
          const styles = this.classes.get(_class)?.styles;
          if (styles) {
            node.cssStyles.push(...styles);
          }
        }
      }
    }
  }

  public defineClass(ids: string[], style: string[]) {
    for (const id of ids) {
      let styleClass = this.classes.get(id);
      if (styleClass === undefined) {
        styleClass = { id, styles: [], textStyles: [] };
        this.classes.set(id, styleClass);
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

      this.c4Nodes.forEach((value) => {
        if (value.classes.includes(id)) {
          value.cssStyles.push(...style.flatMap((s) => s.split(',')));
        }
      });
    }
  }

  public getClasses() {
    return this.classes;
  }

  private getTagDataFromNode(node: C4Node) {
    if (!node) {
      return null;
    }

    // Initialize base tag data from node type
    let accumulatedTag: Tag = {
      tagStereo: '',
    };

    // Process additional tags if they exist
    const tags = node.tags?.split('+');
    if (tags) {
      tags.forEach((tag) => {
        const tagData = this.elementTags.get(tag);

        if (tagData) {
          // Merge tag data, overwriting existing properties
          accumulatedTag = {
            ...accumulatedTag,
            ...tagData,
          };
        }
      });
    }

    return accumulatedTag;
  }

  private getTagDataFromRel(rel: C4Relation) {
    if (!rel) {
      return null;
    }

    // Initialize base tag data from node type
    let accumulatedTag: Tag = {
      tagStereo: '',
    };

    // Process additional tags if they exist
    const tags = rel.tags?.split('+');
    if (tags) {
      tags.forEach((tag) => {
        const tagData = this.relTags.get(tag);

        if (tagData) {
          // Merge tag data, overwriting existing properties
          accumulatedTag = {
            ...accumulatedTag,
            ...tagData,
          };
        }
      });
    }

    return accumulatedTag;
  }

  private getCssStylesFromNodeTags(node: C4Node) {
    const styles = [];

    const tag = this.getTagDataFromNode(node);
    if (!tag) {
      return;
    }

    if (tag.bgColor) {
      styles.push(`fill: ${tag.bgColor}`);
    }
    if (tag.fontColor) {
      styles.push(`color: ${tag.fontColor}`);
    }
    if (tag.borderColor) {
      styles.push(`stroke: ${tag.borderColor}`);
    }
    if (tag.shadowing === 'true') {
      styles.push(`filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.5))`);
    }
    if (tag.borderStyle === 'dotted') {
      styles.push(`stroke-dasharray: 2, 2`);
    }
    if (tag.borderStyle === 'dashed') {
      styles.push(`stroke-dasharray: 5, 5`);
    }
    if (tag.borderStyle === 'bold') {
      styles.push(`stroke-width: 2`);
    }
    if (tag.borderStyle === 'solid') {
      styles.push(`stroke-width: 1`);
    }
    if (tag.borderThickness) {
      styles.push(`stroke-width: ${tag.borderThickness}`);
    }

    return styles;
  }

  private getCssStylesFromRelTags(rel: C4Relation) {
    const styles = [];

    const tag = this.getTagDataFromRel(rel);
    if (!tag) {
      return;
    }

    if (tag.textColor) {
      styles.push(`color: ${tag.textColor}`);
    }
    if (tag.lineColor) {
      styles.push(`stroke: ${tag.lineColor}`);
    }
    if (tag.lineStyle === 'dotted') {
      styles.push(`stroke-dasharray: 2, 2`);
    }
    if (tag.lineStyle === 'dashed') {
      styles.push(`stroke-dasharray: 5, 5`);
    }
    if (tag.lineStyle === 'bold') {
      styles.push(`stroke-width: 2`);
    }
    if (tag.lineStyle === 'solid') {
      styles.push(`stroke-width: 1`);
    }
    if (tag.lineThickness) {
      styles.push(`stroke-width: ${tag.lineThickness}`);
    }

    return styles;
  }

  public showLegend() {
    this.legend = true;
  }

  public shouldShowLegend() {
    return this.legend;
  }

  public updateLegendTitle(newTitle: string) {
    this.legendTitle = newTitle;
  }

  public getLegendData() {
    const title = this.legendTitle;
    const items: LegendItem[] = [];

    this.c4Nodes.forEach((node, key) => {
      if (node.legendText) {
        items.push({
          text: node.legendText,
          styles: this.getData().nodes.find((n) => n.id === key)?.cssStyles ?? [],
          sprite: node.legendSprite ?? node.sprite ?? '',
          type: 'node',
        });
      }
    });

    this.elementTags.forEach((tag, key) => {
      items.push({
        text: tag.legendText ?? tag.tagStereo,
        styles: this.getCssStylesFromNodeTags({ tags: key } as C4Node) ?? [],
        sprite: tag.legendSprite ?? tag.sprite ?? '',
        type: 'node',
      });
    });

    this.relTags.forEach((tag, key) => {
      items.push({
        text: tag.legendText ?? tag.tagStereo,
        styles: this.getCssStylesFromRelTags({ tags: key } as C4Relation) ?? [],
        sprite: tag.legendSprite ?? tag.sprite ?? '',
        type: 'rel',
      });
    });

    return { title, items };
  }

  public getNodes() {
    return this.c4Nodes;
  }

  public getRels() {
    return this.rels;
  }

  public getElementTags() {
    return this.elementTags;
  }

  public getRelTags() {
    return this.relTags;
  }

  public getData() {
    const config = getConfig();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    for (const alias of this.c4Nodes.keys()) {
      const c4Node = this.c4Nodes.get(alias)!;

      switch (c4Node.type) {
        case 'person':
        case 'external_person':
          if (!c4Node.sprite) {
            c4Node.sprite = 'person';
          }
          c4Node.shape = 'rect';
          break;
        case 'system':
        case 'external_system':
        case 'container':
        case 'external_container':
        case 'component':
        case 'external_component':
          c4Node.shape = 'rect';
          break;
        case 'system_db':
        case 'external_system_db':
        case 'container_db':
        case 'external_container_db':
        case 'component_db':
        case 'external_component_db':
          if (!c4Node.sprite) {
            c4Node.sprite = 'database';
          }
          c4Node.shape = 'database';
          break;
        case 'system_queue':
        case 'external_system_queue':
        case 'container_queue':
        case 'external_container_queue':
        case 'component_queue':
        case 'external_component_queue':
          c4Node.shape = 'das';
          break;
      }

      const tagData = this.getTagDataFromNode(c4Node);
      const techn = tagData?.techn ?? c4Node.techn;
      const validShapes = ['rounded_rect', 'octagon'];
      const shape =
        tagData?.shape && validShapes.includes(tagData.shape)
          ? tagData.shape === 'rounded_rect'
            ? 'rect'
            : tagData.shape
          : c4Node.shape;

      const node = {
        id: c4Node.alias,
        parentId: c4Node.parent !== 'global' ? c4Node.parent : undefined,
        isGroup: c4Node.isBoundary,
        label: !c4Node.isBoundary
          ? `<em>«${c4Node.type}»</em>\n${c4Node.sprite ? '<br><br>' : ''}<strong>${c4Node.label}</strong>${techn ? `<br><em>[${techn}]</em>` : ''}${c4Node.descr ? `${c4Node.sprite ? '<br>' : '<br><br>'}${c4Node.descr}` : ''}`
          : `<strong>${c4Node.label}</strong>\n[${c4Node.type}]`,
        padding: config.c4?.c4ShapePadding ?? 6,
        shape: shape,
        rx: tagData?.shape === 'rounded_rect' ? 5 : 0,
        ry: tagData?.shape === 'rounded_rect' ? 5 : 0,
        cssStyles: [...(this.getCssStylesFromNodeTags(c4Node) ?? []), ...c4Node.cssStyles],
        cssClasses: c4Node.classes.join(' '),
        look: config.look,
        link: c4Node.link,
        icon: tagData?.sprite ?? c4Node.sprite,
      } as Node;

      nodes.push(node);
    }

    let count = 0;
    for (const rel of this.rels) {
      const tagData = this.getTagDataFromRel(rel);
      const techn = tagData?.techn ?? rel.techn;
      const sprite = tagData?.sprite ?? rel.sprite;

      const edge: Edge = {
        id: `${rel.from}-${rel.to}-${count}`,
        start: rel.from,
        end: rel.to,
        //label: '<br><br>' + rel.label + (rel.techn ? `\n<em>[${techn}]</em>` : ''),
        label: (sprite ? '<br><br>' : '') + rel.label + (rel.techn ? `\n<em>[${techn}]</em>` : ''),
        labelpos: 'c',
        type: 'normal',
        thickness: 'normal',
        stroke: 'normal',
        arrowTypeStart: rel.type === 'birel' ? 'extension' : '',
        arrowTypeEnd: 'extension',
        arrowheadStyle: '',
        labelStyle: [
          `${tagData?.textColor ? `color: ${tagData.textColor}` : ''}`,
          `id: ${rel.from}-${rel.to}-${count}`,
        ],
        style: [
          'fill: none',
          `${rel.lineColor ? `stroke: ${rel.lineColor}` : ''}`,
          ...(this.getCssStylesFromRelTags(rel) ?? []),
        ],
        classes: 'edge',
        pattern: 'solid',
        look: config.look,
        link: rel.link,
        icon: sprite,
      };
      edges.push(edge);
      count++;
    }

    return { nodes, edges, other: {}, config, direction: this.getDirection() };
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public getConfig = () => getConfig().c4;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
}
