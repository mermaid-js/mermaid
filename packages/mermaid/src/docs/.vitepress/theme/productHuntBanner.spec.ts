import { describe, expect, it } from 'vitest';
import {
  createProductHuntBannerDismissals,
  getProductHuntBanner,
  getProductHuntBannerPhase,
} from './productHuntBanner.js';

type DismissalStorage = Pick<Storage, 'getItem' | 'setItem'>;

const memoryStorage = (): DismissalStorage => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
};

const brokenStorage: DismissalStorage = {
  getItem: () => {
    throw new Error('storage blocked');
  },
  setItem: () => {
    throw new Error('storage blocked');
  },
};

// Browsers that block site data throw on reading `window.localStorage` itself.
const blockedStorage = (): DismissalStorage => {
  throw new Error('storage access denied');
};

describe('getProductHuntBannerPhase', () => {
  it('shows the pre-launch banner before launch day', () => {
    expect(getProductHuntBannerPhase(new Date('2026-11-12T12:00:00Z'))).toBe('pre-launch');
  });

  it('keeps the pre-launch banner until 12:01 AM PT on November 18th', () => {
    expect(getProductHuntBannerPhase(new Date('2026-11-18T00:00:59-08:00'))).toBe('pre-launch');
  });

  it('switches to the launch banner at 12:01 AM PT on November 18th', () => {
    expect(getProductHuntBannerPhase(new Date('2026-11-18T00:01:00-08:00'))).toBe('launch');
  });

  it('uses Pacific time, not the visitor time zone', () => {
    // Already November 18th in UTC, still November 17th in Pacific time.
    expect(getProductHuntBannerPhase(new Date('2026-11-18T03:00:00Z'))).toBe('pre-launch');
  });

  it('keeps the launch banner through launch day', () => {
    expect(getProductHuntBannerPhase(new Date('2026-11-18T23:58:59-08:00'))).toBe('launch');
  });

  it('goes back to the regular banner at 11:59 PM PT on November 18th', () => {
    expect(getProductHuntBannerPhase(new Date('2026-11-18T23:59:00-08:00'))).toBeUndefined();
    expect(getProductHuntBannerPhase(new Date('2026-12-01T00:00:00Z'))).toBeUndefined();
  });
});

describe('getProductHuntBanner', () => {
  it('has the pre-launch copy and links to the Flow page with the site as UTM source', () => {
    expect(getProductHuntBanner('pre-launch', 'mermaid_js')).toEqual({
      headline: 'Mermaid Flow launches on Product Hunt November 18th.',
      tagline: 'Build it once, run it the same way every time.',
      button: 'Learn more',
      href: 'https://mermaid.ai/products/flow?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=flow_hunt',
    });
  });

  it('has the launch copy and links to the Product Hunt launch', () => {
    expect(getProductHuntBanner('launch', 'mermaid_js')).toEqual({
      headline: 'Mermaid Flow is live on Product Hunt.',
      tagline: 'Build it once, run it the same way every time.',
      button: 'See the launch',
      href: 'https://www.producthunt.com/products/mermaid-chart?launch=mermaid-flow',
    });
  });
});

describe('banner dismissal', () => {
  it('is not dismissed by default', () => {
    const dismissals = createProductHuntBannerDismissals(memoryStorage);
    expect(dismissals.isDismissed('pre-launch')).toBe(false);
  });

  it('remembers a dismissed banner across page views', () => {
    const storage = memoryStorage();
    createProductHuntBannerDismissals(() => storage).dismiss('pre-launch');
    const nextPageView = createProductHuntBannerDismissals(() => storage);
    expect(nextPageView.isDismissed('pre-launch')).toBe(true);
  });

  it('still shows the launch banner after the pre-launch one was dismissed', () => {
    const storage = memoryStorage();
    const dismissals = createProductHuntBannerDismissals(() => storage);
    dismissals.dismiss('pre-launch');
    expect(dismissals.isDismissed('launch')).toBe(false);
  });

  it('shows the banner when reading storage throws', () => {
    const dismissals = createProductHuntBannerDismissals(() => brokenStorage);
    expect(dismissals.isDismissed('launch')).toBe(false);
  });

  it.each([
    ['writing to storage throws', () => brokenStorage],
    ['storage itself is blocked', blockedStorage],
  ])('keeps a banner closed for the page view when %s', (_reason, getStorage) => {
    const dismissals = createProductHuntBannerDismissals(getStorage);
    expect(() => dismissals.dismiss('pre-launch')).not.toThrow();
    expect(dismissals.isDismissed('pre-launch')).toBe(true);
    expect(dismissals.isDismissed('launch')).toBe(false);
  });
});
