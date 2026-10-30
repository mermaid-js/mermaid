import type {
  PlausibleConfig,
  PlausibleEventOptions,
} from '@plausible-analytics/tracker/plausible.js';
import type { PlausibleSettings } from '../plausibleSettings.js';

interface PlausibleTracker {
  init: (config: PlausibleConfig) => void;
  track: (eventName: string, options: PlausibleEventOptions) => void;
}

// Set at build time from `getPlausibleSettings()` in `vite.config.ts`
declare const __DOCS_PLAUSIBLE__: PlausibleSettings;

const plausibleConfig = {
  // mermaid.js.org stats are public at https://p.mermaid.live/mermaid.js.org
  domain: __DOCS_PLAUSIBLE__.domain,
  endpoint: __DOCS_PLAUSIBLE__.endpoint,
  bindToWindow: true,
  autoCapturePageviews: true,
  outboundLinks: true,
  captureOnLocalhost: true,
} satisfies PlausibleConfig;

let trackerPromise: Promise<PlausibleTracker | null> | undefined;
let initPromise: Promise<void> | undefined;

const loadTracker = async () => {
  if (typeof window === 'undefined') {
    return null;
  }
  trackerPromise ??= import('@plausible-analytics/tracker/plausible.js');
  return trackerPromise;
};

export const initPlausible = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  initPromise ??= (async () => {
    const tracker = await loadTracker();
    tracker?.init(plausibleConfig);
  })();

  await initPromise;
};

export const trackPlausibleEvent = async (
  eventName: string,
  options: PlausibleEventOptions = {}
) => {
  const tracker = await loadTracker();
  if (!tracker) {
    return;
  }

  await initPlausible();
  tracker.track(eventName, options);
};
