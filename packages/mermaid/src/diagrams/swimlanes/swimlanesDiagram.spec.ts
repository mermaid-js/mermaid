import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getConfig,
  getUserDefinedConfig,
  reset,
  saveConfigFromInitialize,
  setSiteConfig,
} from '../../config.js';
import { diagram } from './swimlanesDiagram.js';

const resetConfig = () => {
  saveConfigFromInitialize({});
  setSiteConfig({});
  reset();
};

describe('swimlanesDiagram', () => {
  beforeEach(resetConfig);
  afterEach(resetConfig);

  it('defaults the shared flowchart renderer to the swimlane layout', () => {
    expect(getUserDefinedConfig().layout).toBeUndefined();

    diagram.init?.(getConfig());

    expect(getConfig().layout).toBe('swimlane');
  });

  it('keeps an explicit layout override', () => {
    saveConfigFromInitialize({ layout: 'dagre' });
    setSiteConfig({ layout: 'dagre' });
    reset();

    diagram.init?.(getConfig());

    expect(getConfig().layout).toBe('dagre');
  });
});
