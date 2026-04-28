const XLINK_NS = 'http://www.w3.org/1999/xlink';
const ABSOLUTE_URL_PATTERN = /^[A-Za-z][\d+.A-Za-z-]*:/;

const resolveRelativeUrl = (url: string, baseUrl: string): string | undefined => {
  if (!url || ABSOLUTE_URL_PATTERN.test(url) || url.startsWith('//')) {
    return;
  }

  try {
    return new URL(url, baseUrl).href;
  } catch {
    return;
  }
};

/**
 * Resolve relative anchor links before serializing sandboxed SVG content into a data: iframe.
 */
export const resolveRelativeLinksInElement = (element: Element, baseUrl: string): void => {
  for (const anchor of element.querySelectorAll('a')) {
    const href = anchor.getAttribute('href');
    const resolvedHref = href ? resolveRelativeUrl(href, baseUrl) : undefined;

    if (resolvedHref) {
      anchor.setAttribute('href', resolvedHref);
    }

    const xlinkHref = anchor.getAttributeNS(XLINK_NS, 'href') ?? anchor.getAttribute('xlink:href');
    const resolvedXlinkHref = xlinkHref ? resolveRelativeUrl(xlinkHref, baseUrl) : undefined;

    if (resolvedXlinkHref) {
      anchor.setAttributeNS(XLINK_NS, 'xlink:href', resolvedXlinkHref);
    }
  }
};
