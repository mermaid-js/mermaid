import { getConfig as commonGetConfig } from '../../config.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { cleanAndMerge } from '../../utils.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { CynefinDB, CynefinDomain, CynefinTransition, DomainName } from './types.js';

interface CynefinData {
  domains: Map<DomainName, CynefinDomain>;
  transitions: CynefinTransition[];
}

const createDefaultData = (): CynefinData => ({
  domains: new Map(),
  transitions: [],
});

let data: CynefinData = createDefaultData();

const getDomains = (): Map<DomainName, CynefinDomain> => data.domains;

const getTransitions = (): CynefinTransition[] => data.transitions;

const setDomains = (blocks: any[]) => {
  if (!blocks) {
    return;
  }
  for (const block of blocks) {
    const domainName = block.domain as DomainName;
    const items = (block.items ?? []).map((item: { label: string }) => ({
      label: item.label,
    }));
    data.domains.set(domainName, {
      name: domainName,
      items,
    });
  }
};

const setTransitions = (transitions: any[]) => {
  if (!transitions) {
    return;
  }
  data.transitions = transitions.map((t) => ({
    from: t.from as DomainName,
    to: t.to as DomainName,
    label: t.label,
  }));
};

const getConfig = (): Record<string, unknown> => {
  const defaultCynefinConfig = (DEFAULT_CONFIG as any).cynefin ?? {};
  const currentConfig = (commonGetConfig() as any).cynefin ?? {};
  return cleanAndMerge({
    ...defaultCynefinConfig,
    ...currentConfig,
  });
};

const clear = () => {
  commonClear();
  data = createDefaultData();
};

export const db: CynefinDB = {
  getDomains,
  getTransitions,
  setDomains,
  setTransitions,
  getConfig,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
