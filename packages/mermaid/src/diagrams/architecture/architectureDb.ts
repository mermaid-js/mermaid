import type {
  ArchitectureFields,
  ArchitectureDB,
  ArchitectureService,
  ArchitectureGroup,
  ArchitectureDirection,
  ArchitectureLine,
} from './architectureTypes.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { isArchitectureDirection } from './architectureTypes.js';
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
  services: [],
  groups: [],
  lines: [],
  registeredIds: {},
  config: DEFAULT_ARCHITECTURE_CONFIG,
} as const;

let services = DEFAULT_ARCHITECTURE_DB.services;
let groups = DEFAULT_ARCHITECTURE_DB.groups;
let lines = DEFAULT_ARCHITECTURE_DB.lines;
let registeredIds = DEFAULT_ARCHITECTURE_DB.registeredIds;
let elements: Record<string, D3Element> = {};

const clear = (): void => {
  services = structuredClone(DEFAULT_ARCHITECTURE_DB.services);
  groups = structuredClone(DEFAULT_ARCHITECTURE_DB.groups);
  lines = structuredClone(DEFAULT_ARCHITECTURE_DB.lines);
  registeredIds = structuredClone(DEFAULT_ARCHITECTURE_DB.registeredIds)
  elements = {};
  commonClear();
};

const addService = function (id: string, opts: Omit<ArchitectureService, 'id'> = {}) {
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

  services.push({
    id,
    icon,
    title,
    in: inside,
  });
};
const getServices = (): ArchitectureService[] => services;

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
const getGroups = (): ArchitectureGroup[] => groups;

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

  lines.push({
    lhs_id,
    lhs_dir,
    rhs_id,
    rhs_dir,
    title,
    lhs_into,
    rhs_into,
  });
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