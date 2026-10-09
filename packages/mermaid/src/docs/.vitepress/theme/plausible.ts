import type {
  PlausibleConfig,
  PlausibleEventOptions,
} from '@plausible-analytics/tracker/plausible.js';

interface PlausibleTracker {
  init: (config: PlausibleConfig) => void;
  track: (eventName: string, options: PlausibleEventOptions) => void;
}

const plausibleConfig = {
  domain: 'mermaid.js.org',
  // All tracked stats are public and available at https://p.mermaid.live/mermaid.js.org
  endpoint: 'https://p.mermaid.live/api/event',
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
