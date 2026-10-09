export const OSS_HOME_HERO_NAME_CLIP_CLASS = 'oss-home-name-clip';

const HOME_PATHS = new Set<string>(['', '/', '/index.html']);
const HERO_NAME_CLIP_SELECTOR = '.VPHomeHero .heading .name.clip';

function isMermaidAiHostname(hostname: string): boolean {
  const hn = hostname.toLowerCase();
  return hn === 'mermaid.ai' || hn.endsWith('.mermaid.ai');
}

/**
 * Adds an extra class to the VitePress homepage hero name clip span.
 *
 * This is intentionally implemented as a small DOM helper so it can be unit tested.
 */
export function applyOssHomeHeroNameClipClass({
  doc,
  hostname,
  pathname,
  className = OSS_HOME_HERO_NAME_CLIP_CLASS,
}: {
  doc: Document;
  hostname: string;
  pathname: string;
  className?: string;
}): number {
  // Enabled on all deployments except mermaid.ai (and subdomains).
  if (isMermaidAiHostname(hostname)) {
    return 0;
  }

  if (!HOME_PATHS.has(pathname)) {
    return 0;
  }

  const els = doc.querySelectorAll<HTMLElement>(HERO_NAME_CLIP_SELECTOR);
  let added = 0;
  for (const el of els) {
    if (!el.classList.contains(className)) {
      el.classList.add(className);
      added++;
    }
  }

  return added;
}
