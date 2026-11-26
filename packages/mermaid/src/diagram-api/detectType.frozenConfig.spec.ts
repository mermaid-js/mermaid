import { beforeAll, describe, expect, it } from 'vitest';
import { Diagram } from '../Diagram.js';
import mermaidAPI from '../mermaidAPI.js';
import { getConfig, reset } from '../config.js';
import { addDiagrams } from './diagram-orchestration.js';
import { detectors } from './detectType.js';

// `getConfig()` returns a deeply frozen snapshot, and that snapshot is what render paths
// hand to detectors. A detector that writes to its config would throw on the matching
// keyword only, which no other test exercises, so every detector is run against every
// registered keyword here.
describe('diagram detectors with the frozen config snapshot', () => {
  beforeAll(() => {
    addDiagrams();
    reset();
  });

  const keywords = () => {
    const keys = Object.keys(detectors);
    const stripped = keys.map((key) => key.replace(/-(v\d+|beta)$/, ''));
    return [...new Set([...keys, ...stripped])];
  };

  it('never writes to the config they are given', () => {
    const config = getConfig();
    expect(Object.isFrozen(config)).toBe(true);
    for (const [id, { detector }] of Object.entries(detectors)) {
      for (const keyword of keywords()) {
        expect(() => detector(`${keyword}\n  A`, config), `${id} on "${keyword}"`).not.toThrow();
      }
    }
  });

  it('parses and loads flowchart-elk', async () => {
    await expect(mermaidAPI.parse('flowchart-elk TD\n  A-->B')).resolves.toMatchObject({
      diagramType: 'flowchart-elk',
    });
    expect((await Diagram.fromText('flowchart-elk TD\n  A-->B')).type).toBe('flowchart-elk');
  });
});
