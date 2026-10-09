import { log } from '../../logger.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import type { Edge, Node } from '../../rendering-util/types.js';
import type { EntityNode, Attribute, Relationship, EntityClass, RelSpec } from './erTypes.js';
import common from '../common/common.js';
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
import type { ErSubGraph } from './erTypes.js';

export class ErDB implements DiagramDB {
  private entities = new Map<string, EntityNode>();
  private relationships: Relationship[] = [];
  private classes = new Map<string, EntityClass>();
  public subgraphDepth = 0; // Public because JISON yy actions access it dynamically.
  private subGraphs: ErSubGraph[] = [];
  private subGraphLookup = new Map<string, ErSubGraph>();
  private subCount = 0;
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
    this.addSubGraph = this.addSubGraph.bind(this);
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
        labelType: 'markdown',
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
    // Check if entA is a subgraph, otherwise treat it as an entity
    let entityAId: string;
    if (this.subGraphLookup.has(entA)) {
      entityAId = entA;
    } else {
      const entityA = this.addEntity(entA);
      if (!entityA) {
        return;
      }
      entityAId = entityA.id;
    }

    // Check if entB is a subgraph, otherwise treat it as an entity
    let entityBId: string;
    if (this.subGraphLookup.has(entB)) {
      entityBId = entB;
    } else {
      const entityB = this.addEntity(entB);
      if (!entityB) {
        return;
      }
      entityBId = entityB.id;
    }

    const rel = {
      entityA: entityAId,
      roleA: rolA,
      entityB: entityBId,
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
      const subGraph = this.subGraphLookup.get(id);

      if (!styles) {
        continue;
      }

      if (entity) {
        for (const style of styles) {
          entity.cssStyles!.push(style);
        }
      }

      if (subGraph) {
        if (!subGraph.cssStyles) {
          subGraph.cssStyles = [];
        }

        for (const style of styles) {
          subGraph.cssStyles.push(style);
        }
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

  public addSubGraph(
    _id: { text: string },
    list: string[],
    _title: { text: string; type: string }
  ) {
    let id: string | undefined = _id.text.trim();
    let title = _title.text;

    const uniq = (a: any[]) => {
      const seen = new Set<string>();
      let dir: string | undefined;

      const nodeList = a.filter((item) => {
        if (item?.stmt) {
          if (item.stmt === 'dir') {
            dir = item.value;
          }
          return false;
        }

        if (typeof item !== 'string') {
          return false;
        }

        const trimmed = item.trim();
        if (!trimmed) {
          return false;
        }

        if (seen.has(trimmed)) {
          return false;
        }
        seen.add(trimmed);

        return true;
      });

      return { nodeList, dir };
    };

    const result = uniq(list.flat());
    const nodeList = result.nodeList;
    // If no explicit direction is declared within the subgraph, leave dir as undefined
    // so that the layout engine applies its own default direction
    const dir = result.dir;

    id = id ?? 'subGraph' + this.subCount;
    title = title || '';
    title = this.sanitizeText(title);
    this.subCount = this.subCount + 1;

    const subGraph: ErSubGraph = {
      id: id,
      nodes: nodeList,
      title: title.trim(),
      classes: [],
      cssStyles: [],
      dir,
      labelType: this.sanitizeNodeLabelType(_title?.type),
    };

    log.info('Adding', subGraph.id, subGraph.nodes, subGraph.dir);

    // Ensure nodes are unique across subgraphs by removing duplicates from the new subgraph
    subGraph.nodes = this.makeUniq(subGraph, this.subGraphs).nodes;
    this.subGraphs.push(subGraph);
    this.subGraphLookup.set(id, subGraph);
    return id;
  }

  public getSubGraphs() {
    return this.subGraphs;
  }

  public setClass(ids: string[], classNames: string[]) {
    for (const id of ids) {
      const entity = this.entities.get(id);
      if (entity) {
        for (const className of classNames) {
          entity.cssClasses += ' ' + className;
        }
      }

      const subGraph = this.subGraphLookup.get(id);
      if (subGraph) {
        for (const className of classNames) {
          subGraph.classes.push(className);
        }
      }
    }
  }

  /**
   * Build a quick lookup for all node IDs already assigned to existing subgraphs.
   */
  private subgraphNodeCache(allSubgraphs: ErSubGraph[]) {
    const nodeCache = new Set<string>();
    for (const subGraph of allSubgraphs) {
      for (const id of subGraph.nodes) {
        nodeCache.add(id);
      }
    }
    return nodeCache;
  }

  /**
   * Filter out nodes that are already part of another subgraph,
   * keeping subgraph membership unique.
   */
  private makeUniq(subGraph: ErSubGraph, allSubgraphs: ErSubGraph[]) {
    const existingNodes = this.subgraphNodeCache(allSubgraphs);
    const res: string[] = [];
    subGraph.nodes.forEach((_id, pos) => {
      if (existingNodes.has(_id)) {
        log.warn(`Entity '${_id}' already belongs to another subgraph and will be ignored`);
      } else {
        res.push(subGraph.nodes[pos]);
      }
    });
    return { nodes: res };
  }

  private sanitizeText(txt: string) {
    return common.sanitizeText(txt, getConfig());
  }

  private sanitizeNodeLabelType(labelType?: string) {
    switch (labelType) {
      case 'markdown':
      case 'string':
      case 'text':
        return labelType;
      default:
        return 'markdown';
    }
  }

  public clear() {
    this.entities = new Map();
    this.classes = new Map();
    this.relationships = [];
    this.subGraphs = [];
    this.subGraphLookup = new Map();
    this.subCount = 0;
    this.subgraphDepth = 0;
    commonClear();
  }

  public getData() {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const config = getConfig();

    const subGraphs = this.getSubGraphs();
    const parentDB = new Map<string, string>();
    const subGraphDB = new Map<string, boolean>();

    // Setup the subgraph data for adding nodes
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const subGraph = subGraphs[i];
      if (subGraph.nodes.length > 0) {
        subGraphDB.set(subGraph.id, true);
      }
      for (const id of subGraph.nodes) {
        parentDB.set(id, subGraph.id);
      }
    }

    // Add the nodes
    for (let i = subGraphs.length - 1; i >= 0; i--) {
      const subGraph = subGraphs[i];
      nodes.push({
        id: subGraph.id,
        label: subGraph.title,
        labelStyle: '',
        labelType: subGraph.labelType,
        parentId: parentDB.get(subGraph.id),
        padding: 8,
        cssCompiledStyles: this.getCompiledStyles(subGraph.classes),
        cssStyles: subGraph.cssStyles,
        cssClasses: subGraph.classes.join(' '),
        shape: 'rect',
        dir: subGraph.dir,
        isGroup: true,
        look: config.look,
      });
    }

    const subGraphIds = new Set(subGraphs.map((sg) => sg.id));
    let colorIndex = 0;
    for (const entityKey of this.entities.keys()) {
      if (subGraphIds.has(entityKey)) {
        continue;
      }
      const entityNode = this.entities.get(entityKey);
      if (entityNode) {
        entityNode.cssCompiledStyles = this.getCompiledStyles(entityNode.cssClasses!.split(' '));
        entityNode.colorIndex = colorIndex++;
        nodes.push({
          ...entityNode,
          parentId: parentDB.get(entityKey),
          isGroup: false,
        } as unknown as Node);
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
        labelType: 'markdown',
      };
      edges.push(edge);
    }
    return { nodes, edges, other: {}, config, direction: this.direction };
  }

  public setAccTitle = setAccTitle;
  public getAccTitle = getAccTitle;
  public setAccDescription = setAccDescription;
  public getAccDescription = getAccDescription;
  public setDiagramTitle = setDiagramTitle;
  public getDiagramTitle = getDiagramTitle;
  public getConfig = () => getConfig().er;
}
