import type {
  ArchitectureFields,
  ArchitectureDB,
  ArchitectureService,
  ArchitectureGroup,
  ArchitectureDirection,
  ArchitectureLine,
} from './architectureTypes.js';
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
  cnt: 0,
  config: DEFAULT_ARCHITECTURE_CONFIG,
} as const;

let services = DEFAULT_ARCHITECTURE_DB.services;
let groups = DEFAULT_ARCHITECTURE_DB.groups;
let lines = DEFAULT_ARCHITECTURE_DB.lines;
let elements: Record<string, D3Element> = {};
let cnt = DEFAULT_ARCHITECTURE_DB.cnt;

const config: Required<ArchitectureDiagramConfig> = structuredClone(DEFAULT_ARCHITECTURE_CONFIG);

const getConfig = (): Required<ArchitectureDiagramConfig> => structuredClone(config);

const clear = (): void => {
  services = structuredClone(DEFAULT_ARCHITECTURE_DB.services);
  groups = structuredClone(DEFAULT_ARCHITECTURE_DB.groups);
  lines = structuredClone(DEFAULT_ARCHITECTURE_DB.lines);
  elements = {};
  cnt = 0;
  commonClear();
};

const addService = function (id: string, opts: Omit<ArchitectureService, 'id'> = {}) {
  const { icon, in: inside, title } = opts;
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
  getConfig,
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
