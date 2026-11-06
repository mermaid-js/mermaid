/**
 * `flowContainerStroke` is the theme variable agentflow containers are drawn
 * with. `clusters.js` and `collapsedGroup.ts` fall back to
 * `secondaryBorderColor` when it is missing, so a theme that omits it doesn't
 * break — it just silently picks up a border from a palette nobody tuned for
 * agentflow. Every registered theme has to define it, not only the five
 * built-ins the e2e theme matrix covers.
 */
import { describe, expect, it } from 'vitest';
import themes from './index.js';

describe('agentflow theme variables', () => {
  it.each(Object.keys(themes))('%s defines flowContainerStroke', (name) => {
    const variables = themes[name as keyof typeof themes].getThemeVariables({});
    expect(variables.flowContainerStroke).toBeTruthy();
  });

  it.each(Object.keys(themes))('%s honours a flowContainerStroke override', (name) => {
    const variables = themes[name as keyof typeof themes].getThemeVariables({
      flowContainerStroke: '#abcdef',
    });
    expect(variables.flowContainerStroke).toBe('#abcdef');
  });
});
