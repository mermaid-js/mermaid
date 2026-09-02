import { describe, expect, it } from 'vitest';
import {
  EDGE_ROUTING_OPTIONS,
  PLACEMENT_OPTIONS,
  ROOT_EXPERIMENT_OVERRIDES,
  SUBGRAPH_EXPERIMENT_OVERRIDES,
} from './elkOptionCatalogue.js';

/**
 * Every catalogue block is merged last over the shipping layout options, so an
 * option left uncommented changes every ELK diagram for every user. That is the
 * point while an option is being tried, and a release blocker afterwards.
 *
 * These assertions are the "off" half of the switch: leave one on and the build
 * fails here, naming the keys, rather than the change reaching a release as a
 * silent rendering diff.
 */
describe('ELK option catalogue', () => {
  const blocks = {
    PLACEMENT_OPTIONS,
    EDGE_ROUTING_OPTIONS,
    ROOT_EXPERIMENT_OVERRIDES,
    SUBGRAPH_EXPERIMENT_OVERRIDES,
  };

  for (const [name, block] of Object.entries(blocks)) {
    it(`ships with nothing switched on in ${name}`, () => {
      expect(
        Object.keys(block),
        're-comment these in elkOptionCatalogue.ts before committing'
      ).toEqual([]);
    });
  }
});
