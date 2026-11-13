import type { DomainBlock, Transition } from '@mermaid-js/parser';
import { getConfig as commonGetConfig } from '../../config.js';
import type { CynefinDiagramConfig } from '../../config.type.js';
import DEFAULT_CONFIG from '../../defaultConfig.js';
import { log } from '../../logger.js';
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

const setDomains = (blocks: DomainBlock[]) => {
  if (!blocks) {
    return;
  }
  for (const block of blocks) {
    const domainName = block.domain as DomainName;
    const items = (block.items ?? []).map((item) => ({
      label: item.label,
    }));
    data.domains.set(domainName, {
      name: domainName,
      items,
    });
  }
};

const setTransitions = (transitions: Transition[]) => {
  if (!transitions) {
    return;
  }
  data.transitions = transitions
    .filter((t) => {
      if (t.from === t.to) {
        log.warn(
          `Cynefin: self-loop transition on domain "${t.from}" is not meaningful and will be skipped.`
        );
        return false;
      }
      return true;
    })
    .map((t) => ({
      from: t.from as DomainName,
      to: t.to as DomainName,
      label: t.label || undefined,
    }));
};

const getConfig = (): Required<CynefinDiagramConfig> => {
  return cleanAndMerge({
    ...DEFAULT_CONFIG.cynefin,
    ...commonGetConfig().cynefin,
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
