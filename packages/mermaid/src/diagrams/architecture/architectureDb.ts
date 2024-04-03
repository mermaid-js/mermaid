import type {
  ArchitectureFields,
  ArchitectureDB,
  ArchitectureService,
  ArchitectureGroup,
  ArchitectureDirection,
  ArchitectureLine,
  ArchitectureDirectionPairMap,
  ArchitectureDirectionPair,
  ArchitectureSpatialMap,
} from './architectureTypes.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { getArchitectureDirectionPair, isArchitectureDirection, shiftPositionByArchitectureDirectionPair } from './architectureTypes.js';
import {
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
} from '../common/commonDb.js';
import type { ArchitectureDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import type { D3Element } from '../../mermaidAPI.js';

export const DEFAULT_ARCHITECTURE_CONFIG: Required<ArchitectureDiagramConfig> =
  DEFAULT_CONFIG.architecture;
export const DEFAULT_ARCHITECTURE_DB: ArchitectureFields = {
  services: {},
  groups: [],
  lines: [],
  registeredIds: {},
  config: DEFAULT_ARCHITECTURE_CONFIG,
} as const;

let services = DEFAULT_ARCHITECTURE_DB.services;
let groups = DEFAULT_ARCHITECTURE_DB.groups;
let lines = DEFAULT_ARCHITECTURE_DB.lines;
let registeredIds = DEFAULT_ARCHITECTURE_DB.registeredIds;
let datastructures = DEFAULT_ARCHITECTURE_DB.datastructures;
let elements: Record<string, D3Element> = {};

const clear = (): void => {
  services = structuredClone(DEFAULT_ARCHITECTURE_DB.services);
  groups = structuredClone(DEFAULT_ARCHITECTURE_DB.groups);
  lines = structuredClone(DEFAULT_ARCHITECTURE_DB.lines);
  registeredIds = structuredClone(DEFAULT_ARCHITECTURE_DB.registeredIds);
  datastructures = undefined;
  elements = {};
  commonClear();
};

const addService = function (id: string, opts: Omit<ArchitectureService, 'id' | 'edges'> = {}) {
  const { icon, in: inside, title } = opts;
  if (registeredIds[id] !== undefined) {
    throw new Error(`The service id [${id}] is already in use by another ${registeredIds[id]}`)
  }
  if (inside !== undefined) {
    if (id === inside) {
      throw new Error(`The service [${id}] cannot be placed within itself`)
    }
    if (registeredIds[inside] === undefined) {
      throw new Error(`The service [${id}]'s parent does not exist. Please make sure the parent is created before this service`)
    }
    if (registeredIds[inside] === 'service') {
      throw new Error(`The service [${id}]'s parent is not a group`);
    }
  }

  registeredIds[id] = 'service';

  services[id] = {
    id,
    icon,
    title,
    edges: [],
    in: inside,
  };
};

const getServices = (): ArchitectureService[] => Object.values(services);

const addGroup = function (id: string, opts: Omit<ArchitectureGroup, 'id'> = {}) {
  const { icon, in: inside, title } = opts;
  if (registeredIds[id] !== undefined) {
    throw new Error(`The group id [${id}] is already in use by another ${registeredIds[id]}`)
  }
  if (inside !== undefined) {
    if (id === inside) {
      throw new Error(`The group [${id}] cannot be placed within itself`)
    }
    if (registeredIds[inside] === undefined) {
      throw new Error(`The group [${id}]'s parent does not exist. Please make sure the parent is created before this group`)
    }
    if (registeredIds[inside] === 'service') {
      throw new Error(`The group [${id}]'s parent is not a group`);
    }
  }

  registeredIds[id] = 'group';

  groups.push({
    id,
    icon,
    title,
    in: inside,
  });
};
const getGroups = (): ArchitectureGroup[] => {
  return groups
};


const getDataStructures = () => {
  console.log('===== createSpatialMap =====')
  if (datastructures === undefined) {
    // Create an adjacency list of the diagram to perform BFS on
    // Outer reduce applied on all services
    // Inner reduce applied on the edges for a service
    const adjList = Object.entries(services).reduce<{[id: string]: ArchitectureDirectionPairMap}>((prev, [id, service]) => {
      prev[id] = service.edges.reduce<ArchitectureDirectionPairMap>((prev, edge) => {
        if (edge.lhs_id === id) { // source is LHS
          const pair = getArchitectureDirectionPair(edge.lhs_dir, edge.rhs_dir);
          if (pair) {
            prev[pair] = edge.rhs_id
          }
        } else { // source is RHS
          const pair = getArchitectureDirectionPair(edge.rhs_dir, edge.lhs_dir);
          if (pair) {
            prev[pair] = edge.lhs_id
          }
        }
        return prev;
      }, {})
      return prev
    }, {});
    
    // Configuration for the initial pass of BFS
    const [firstId, _] = Object.entries(adjList)[0];
    const visited = {[firstId]: 1};
    const notVisited = Object.keys(adjList).reduce((prev, id) => (
      id === firstId ? prev : {...prev, [id]: 1}
    ), {} as Record<string, number>);
    
    // Perform BFS on adjacency list
    const BFS = (startingId: string): ArchitectureSpatialMap => {
      const spatialMap = {[startingId]: [0,0]};
      const queue = [startingId];
      while(queue.length > 0) {
        const id = queue.shift();
        if (id) {
          visited[id] = 1
          delete notVisited[id]
          const adj = adjList[id];
          const [posX, posY] = spatialMap[id];
          Object.entries(adj).forEach(([dir, rhsId]) => {
            if (!visited[rhsId]) {
              console.log(`${id} -- ${rhsId}`);
              spatialMap[rhsId] = shiftPositionByArchitectureDirectionPair([posX, posY], dir as ArchitectureDirectionPair)
              queue.push(rhsId);
            }
          })
        }
      }
      return spatialMap;
    }
    const spatialMaps = [BFS(firstId)];
    
    // If our diagram is disconnected, keep adding additional spatial maps until all disconnected graphs have been found
    while (Object.keys(notVisited).length > 0) {
      spatialMaps.push(BFS(Object.keys(notVisited)[0]))
    }
    datastructures = {
      adjList,
      spatialMaps
    }
    console.log(datastructures)
  }
  return datastructures;
}

const addLine = function (
  lhs_id: string,
  lhs_dir: ArchitectureDirection,
  rhs_id: string,
  rhs_dir: ArchitectureDirection,
  opts: Omit<ArchitectureLine, 'lhs_id' | 'lhs_dir' | 'rhs_id' | 'rhs_dir'> = {}
) {
  const { title, lhs_into, rhs_into } = opts;
  if (!isArchitectureDirection(lhs_dir)) {
    throw new Error(
      `Invalid direction given for left hand side of line ${lhs_id}--${rhs_id}. Expected (L,R,T,B) got ${lhs_dir}`
    );
  }
  if (!isArchitectureDirection(rhs_dir)) {
    throw new Error(
      `Invalid direction given for right hand side of line ${lhs_id}--${rhs_id}. Expected (L,R,T,B) got ${rhs_dir}`
    );
  }
  if (services[lhs_id] === undefined) {
    throw new Error(
      `The left-hand service [${lhs_id}] does not yet exist. Please create the service before declaring an edge to it.`
    );
  }
  if (services[rhs_id] === undefined) {
    throw new Error(
      `The right-hand service [${rhs_id}] does not yet exist. Please create the service before declaring an edge to it.`
    );
  }

  const edge = {
    lhs_id,
    lhs_dir,
    rhs_id,
    rhs_dir,
    title,
    lhs_into,
    rhs_into,
  }
  
  lines.push(edge);
  
  services[lhs_id].edges.push(lines[lines.length - 1])
  services[rhs_id].edges.push(lines[lines.length - 1])
};
const getLines = (): ArchitectureLine[] => lines;

const setElementForId = (id: string, element: D3Element) => {
  elements[id] = element;
};
const getElementById = (id: string) => elements[id];

export const db: ArchitectureDB = {
  clear,
  setDiagramTitle,
  getDiagramTitle,
  setAccTitle,
  getAccTitle,
  setAccDescription,
  getAccDescription,

  addService,
  getServices,
  addGroup,
  getGroups,
  addLine,
  getLines,
  setElementForId,
  getElementById,
  getDataStructures,
};

function getConfigField<T extends keyof ArchitectureDiagramConfig>(field: T): Required<ArchitectureDiagramConfig>[T] {
  const arch = getConfig().architecture;
  if (arch && arch[field] !== undefined) {
    const a = arch[field];
    return arch[field] as Required<ArchitectureDiagramConfig>[T]
  }
  return DEFAULT_ARCHITECTURE_CONFIG[field]
}

export { getConfigField }