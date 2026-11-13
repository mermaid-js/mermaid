import { describe, expect, it, beforeEach } from 'vitest';
import * as configApi from '../../config.js';
import { MindmapDB } from './mindmapDb.js';

/**
 * Mindmap picks `cose-bilkent` for itself when the user has not asked for a
 * layout, which `mindmapDb.getData()` decides. ELK is now the global default,
 * so without these the diagram would quietly start laying out with ELK.
 */
describe('mindmap layout selection', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
    configApi.saveConfigFromInitialize({});
  });

  const resolvedLayout = () => {
    const db = new MindmapDB();
    db.getMindmap = () => null;
    return db.getData().config.layout;
  };

  it('uses cose-bilkent when no layout was requested, despite the elk default', () => {
    expect(configApi.getConfig().layout).toBe('elk');
    expect(resolvedLayout()).toBe('cose-bilkent');
  });

  it('honours a layout the diagram explicitly asks for', () => {
    configApi.addDirective({ layout: 'elk' });
    expect(resolvedLayout()).toBe('elk');
  });

  it('honours an explicit dagre', () => {
    configApi.addDirective({ layout: 'dagre' });
    expect(resolvedLayout()).toBe('dagre');
  });
});
