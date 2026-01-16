import { describe, expect, it } from 'vitest';

import { getHeaderLogo, HOME_NAV_ITEM, withConditionalHomeNav } from './headerDomainRules.ts';

describe('headerDomainRules', () => {
  describe('withConditionalHomeNav', () => {
    it('adds Home nav item first on non-mermaid.js.org domains', () => {
      const nav = [{ text: 'Docs', link: '/intro/', activeMatch: '/intro/' }];
      expect(withConditionalHomeNav(nav, 'mermaid.ai')).toEqual([HOME_NAV_ITEM, ...nav]);
    });

    it('removes Home nav item on mermaid.js.org', () => {
      const nav = [HOME_NAV_ITEM, { text: 'Docs', link: '/intro/', activeMatch: '/intro/' }];
      expect(withConditionalHomeNav(nav, 'mermaid.js.org')).toEqual([
        { text: 'Docs', link: '/intro/', activeMatch: '/intro/' },
      ]);
    });

    it('does not duplicate Home nav item', () => {
      const nav = [HOME_NAV_ITEM, { text: 'Docs', link: '/intro/', activeMatch: '/intro/' }];
      expect(withConditionalHomeNav(nav, 'mermaid.ai')).toEqual(nav);
    });
  });

  describe('getHeaderLogo', () => {
    it('returns local favicon for mermaid.js.org', () => {
      expect(getHeaderLogo('mermaid.js.org')).toBe('/favicon.svg');
    });

    it('returns mermaid chart logo for other domains', () => {
      expect(getHeaderLogo('mermaid.ai')).toBe(
        'https://static.mermaidchart.dev/assets/mermaid-icon.svg'
      );
    });
  });
});
