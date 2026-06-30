export const landingPopUpStorageKey = 'mermaid-landing-pop-up-last-seen';
export type LandingPopUpChoice = 'full-editor' | 'browse-docs' | 'live-editor' | 'skip';

const isEligibleHost = (hostname: string) => {
  return (
    hostname === 'localhost' ||
    hostname === 'mermaid.js.org' ||
    hostname.endsWith('.mermaid.js.org')
  );
};

const isMermaidLiveReferrer = (referrer: string | undefined) => {
  if (!referrer) {
    return false;
  }

  try {
    const referrerHost = new URL(referrer).hostname;
    return referrerHost === 'mermaid.live' || referrerHost.endsWith('.mermaid.live');
  } catch {
    return false;
  }
};

export const shouldShowLandingPopUp = (params: {
  hostname: string;
  referrer?: string;
  now?: number;
  getLastSeen: () => string | null;
}) => {
  if (!isEligibleHost(params.hostname)) {
    return false;
  }
  if (isMermaidLiveReferrer(params.referrer)) {
    return false;
  }

  const lastSeenValue = params.getLastSeen();
  if (!lastSeenValue) {
    return true;
  }

  const lastSeen = Number(lastSeenValue);
  if (!Number.isFinite(lastSeen)) {
    return true;
  }

  const modalTtlMs = 24 * 60 * 60 * 1000;
  return params.now !== undefined
    ? params.now - lastSeen >= modalTtlMs
    : Date.now() - lastSeen >= modalTtlMs;
};

export const markLandingPopUpSeen = (setLastSeen: (value: string) => void, now = Date.now()) => {
  setLastSeen(String(now));
};
