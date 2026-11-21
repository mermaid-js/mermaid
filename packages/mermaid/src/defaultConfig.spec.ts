/**
 * Array-valued config keys (journey/timeline `sectionFills`,
 * `sectionColours`, `actorColours`) must survive frontmatter and
 * `%%{init}%%` directives. `keyify` used to skip array values while
 * building `configKeys`, so `sanitizeDirective` deleted them before
 * they could reach the config (mermaid-js/mermaid#8600).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import * as configApi from './config.js';
import { configKeys } from './defaultConfig.js';
import { sanitizeDirective } from './utils/sanitizeDirective.js';

describe('array-valued config keys (#8600)', () => {
  beforeEach(() => {
    configApi.reset();
    configApi.setSiteConfig({});
  });

  it.each(['sectionFills', 'sectionColours', 'actorColours'])(
    '%s is a recognised config key',
    (key) => {
      expect(configKeys.has(key)).toBe(true);
    }
  );

  it('keeps journey sectionFills from a directive', () => {
    const directive = { journey: { sectionFills: ['#ff0000', '#00ff00'] } };
    sanitizeDirective(directive);
    expect(directive.journey.sectionFills).toEqual(['#ff0000', '#00ff00']);
  });

  it('applies journey and timeline array keys from a directive', () => {
    configApi.addDirective({
      journey: { sectionFills: ['#ff0000', '#00ff00'] },
      timeline: { sectionColours: ['#111111'] },
    });
    // The directive values reach the user-defined config exactly as
    // written (the #8600 repro); the merged config appends them after
    // the defaults, which assignWithDepth does for every array — the
    // journey renderer reads the user's own arrays first (#8577).
    expect(configApi.getUserDefinedConfig().journey?.sectionFills).toEqual(['#ff0000', '#00ff00']);
    expect(configApi.getUserDefinedConfig().timeline?.sectionColours).toEqual(['#111111']);
    const config = configApi.getConfig();
    expect(config.journey?.sectionFills).toContain('#ff0000');
    expect(config.journey?.sectionFills).toContain('#00ff00');
    expect(config.timeline?.sectionColours).toContain('#111111');
  });

  it('still keeps secure keys out of the config when set by a directive', () => {
    const before = configApi.getConfig().secure;
    configApi.addDirective({ secure: ['x'] } as never);
    expect(configApi.getConfig().secure).toEqual(before);
  });
});
