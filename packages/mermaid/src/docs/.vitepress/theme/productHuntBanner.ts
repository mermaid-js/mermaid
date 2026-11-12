export type ProductHuntBannerPhase = 'pre-launch' | 'launch';

export interface ProductHuntBanner {
  headline: string;
  tagline: string;
  button: string;
  href: string;
}

type DismissalStorage = Pick<Storage, 'getItem' | 'setItem'>;

// Product Hunt days run on Pacific time; November 18th 2026 is PST (UTC-8).
const LAUNCH_START = Date.parse('2026-11-18T00:01:00-08:00');
const LAUNCH_END = Date.parse('2026-11-18T23:59:00-08:00');

const TAGLINE = 'Build it once, run it the same way every time.';

export const getProductHuntBannerPhase = (now: Date): ProductHuntBannerPhase | undefined => {
  const time = now.getTime();
  if (time < LAUNCH_START) {
    return 'pre-launch';
  }
  if (time < LAUNCH_END) {
    return 'launch';
  }
  return undefined;
};

export const getProductHuntBanner = (
  phase: ProductHuntBannerPhase,
  utmSource: string
): ProductHuntBanner => {
  if (phase === 'launch') {
    return {
      headline: 'Mermaid Flow is live on Product Hunt.',
      tagline: TAGLINE,
      button: 'See the launch',
      href: 'https://www.producthunt.com/products/mermaid-chart?launch=mermaid-flow',
    };
  }
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: 'banner_ad',
    utm_campaign: 'flow_hunt',
  });
  return {
    headline: 'Mermaid Flow launches on Product Hunt November 18th.',
    tagline: TAGLINE,
    button: 'Learn more',
    href: `https://mermaid.ai/products/flow?${params.toString()}`,
  };
};

const dismissalKey = (phase: ProductHuntBannerPhase) => `product-hunt-banner-dismissed:${phase}`;

/**
 * Tracks which banners the visitor closed. `getStorage` is a getter because
 * browsers that block site data throw on reading `window.localStorage` itself,
 * not only on using it.
 */
export const createProductHuntBannerDismissals = (getStorage: () => DismissalStorage) => {
  // Keeps a banner closed for this page view even when it can't be persisted.
  const closedThisPageView = new Set<ProductHuntBannerPhase>();

  return {
    isDismissed(phase: ProductHuntBannerPhase): boolean {
      if (closedThisPageView.has(phase)) {
        return true;
      }
      try {
        return getStorage().getItem(dismissalKey(phase)) === 'true';
      } catch {
        // Storage is unavailable, so nothing was persisted: show the banner.
        return false;
      }
    },
    dismiss(phase: ProductHuntBannerPhase): void {
      closedThisPageView.add(phase);
      try {
        getStorage().setItem(dismissalKey(phase), 'true');
      } catch {
        // Nothing to persist to; the banner stays closed for this page view only.
      }
    },
  };
};
