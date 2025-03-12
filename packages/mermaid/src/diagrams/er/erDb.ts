import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import type { EntityNode, Attribute, Relationship, EntityClass, RelSpec } from './erTypes.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { getEdgeId } from '../../utils.js';
import type { DiagramDB } from '../../diagram-api/types.js';

export class ErDB implements DiagramDB {
  private entities = new Map<string, EntityNode>();
  private relationships: Relationship[] = [];
  private classes = new Map<string, EntityClass>();
  private direction = 'TB';

  private Cardinality = {
    ZERO_OR_ONE: 'ZERO_OR_ONE',
    ZERO_OR_MORE: 'ZERO_OR_MORE',
    ONE_OR_MORE: 'ONE_OR_MORE',
    ONLY_ONE: 'ONLY_ONE',
    MD_PARENT: 'MD_PARENT',
  };

  private Identification = {
    NON_IDENTIFYING: 'NON_IDENTIFYING',
    IDENTIFYING: 'IDENTIFYING',
  };

  constructor() {
    this.clear();
    this.addEntity = this.addEntity.bind(this);
    this.addAttributes = this.addAttributes.bind(this);
    this.addRelationship = this.addRelationship.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.addCssStyles = this.addCssStyles.bind(this);
    this.addClass = this.addClass.bind(this);
    this.setClass = this.setClass.bind(this);
    this.setAccTitle = this.setAccTitle.bind(this);
    this.setAccDescription = this.setAccDescription.bind(this);
  }

  /**
   * Add entity
   * @param name - The name of the entity
   * @param alias - The alias of the entity
   */
  public addEntity(name: string, alias = ''): EntityNode {
    if (!this.entities.has(name)) {
      this.entities.set(name, {
        id: `entity-${name}-${this.entities.size}`,
        label: name,
        attributes: [],
        alias,
        shape: 'erBox',
        look: getConfig().look ?? 'default',
        cssClasses: 'default',
        cssStyles: [],
      });
      log.info('Added new entity :', name);
    } else if (!this.entities.get(name)?.alias && alias) {
      this.entities.get(name)!.alias = alias;
      log.info(`Add alias '${alias}' to entity '${name}'`);
    }

    return this.entities.get(name)!;
  }

  public getEntity(name: string) {
    return this.entities.get(name);
  }

  public getEntities() {
    return this.entities;
  }

  public getClasses() {
    return this.classes;
  }

  public addAttributes(entityName: string, attribs: Attribute[]) {
    const entity = this.addEntity(entityName); // May do nothing (if entity has already been added)

    // Process attribs in reverse order due to effect of recursive construction (last attribute is first)
    let i;
    for (i = attribs.length - 1; i >= 0; i--) {
      if (!attribs[i].keys) {
        attribs[i].keys = [];
      }
      if (!attribs[i].comment) {
        attribs[i].comment = '';
      }
      entity.attributes.push(attribs[i]);
      log.debug('Added attribute ', attribs[i].name);
    }
  }

  /**
   * Add a relationship
   *
   * @param entA - The first entity in the relationship
   * @param rolA - The role played by the first entity in relation to the second
   * @param entB - The second entity in the relationship
   * @param rSpec - The details of the relationship between the two entities
   */
  public addRelationship(entA: string, rolA: string, entB: string, rSpec: RelSpec) {
    const entityA = this.entities.get(entA);
    const entityB = this.entities.get(entB);
    if (!entityA || !entityB) {
      return;
    }

    const rel = {
      entityA: entityA.id,
      roleA: rolA,
      entityB: entityB.id,
      relSpec: rSpec,
    };

    this.relationships.push(rel);
    log.debug('Added new relationship :', rel);
  }

  public getRelationships() {
    return this.relationships;
  }

  public getDirection() {
    return this.direction;
  }

  public setDirection(dir: string) {
    this.direction = dir;
  }

  private getCompiledStyles(classDefs: string[]) {
    let compiledStyles: string[] = [];
    for (const customClass of classDefs) {
      const cssClass = this.classes.get(customClass);
      if (cssClass?.styles) {
        compiledStyles = [...compiledStyles, ...(cssClass.styles ?? [])].map((s) => s.trim());
      }
      if (cssClass?.textStyles) {
        compiledStyles = [...compiledStyles, ...(cssClass.textStyles ?? [])].map((s) => s.trim());
      }
    }
    return compiledStyles;
  }

  public addCssStyles(ids: string[], styles: string[]) {
    for (const id of ids) {
      const entity = this.entities.get(id);
      if (!styles || !entity) {
        return;
      }
      for (const style of styles) {
        entity.cssStyles!.push(style);
      }
    }
  }

  public addClass(ids: string[], style: string[]) {
    ids.forEach((id) => {
      let classNode = this.classes.get(id);
      if (classNode === undefined) {
        classNode = { id, styles: [], textStyles: [] };
        this.classes.set(id, classNode);
      }

      if (style) {
        style.forEach(function (s) {
          if (/color/.exec(s)) {
            const newStyle = s.replace('fill', 'bgFill');
            classNode.textStyles.push(newStyle);
          }
          classNode.styles.push(s);
        });
      }
    });
  }

  public setClass(ids: string[], classNames: string[]) {
    for (const id of ids) {
      const entity = this.entities.get(id);
      if (entity) {
        for (const className of classNames) {
          entity.cssClasses += ' ' + className;
        }
      }
    }
  }

  public clear() {
    this.entities = new Map();
    this.classes = new Map();
    this.relationships = [];
    commonClear();
  }

  public getData() {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const config = getConfig();

    for (const entityKey of this.entities.keys()) {
      const entityNode = this.entities.get(entityKey);
      if (entityNode) {
        entityNode.cssCompiledStyles = this.getCompiledStyles(entityNode.cssClasses!.split(' '));
        nodes.push(entityNode as unknown as Node);
      }
    }

    let count = 0;
    for (const relationship of this.relationships) {
      const edge: Edge = {
        id: getEdgeId(relationship.entityA, relationship.entityB, {
          prefix: 'id',
          counter: count++,
        }),
        type: 'normal',
        curve: 'basis',
        start: relationship.entityA,
        end: relationship.entityB,
        label: relationship.roleA,
        labelpos: 'c',
        thickness: 'normal',
        classes: 'relationshipLine',
        arrowTypeStart: relationship.relSpec.cardB.toLowerCase(),
        arrowTypeEnd: relationship.relSpec.cardA.toLowerCase(),
        pattern: relationship.relSpec.relType == 'IDENTIFYING' ? 'solid' : 'dashed',
        look: config.look,
      };
      edges.push(edge);
    }
    return { nodes, edges, other: {}, config, direction: 'TB' };
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getConfig = () => getConfig().er;
}
