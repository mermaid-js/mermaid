/**
 * Utilities for resolving relative URLs in sandbox mode.
 *
 * When securityLevel is 'sandbox', diagrams are rendered inside a data: URI iframe.
 * Data URIs have no base URL context, so relative URLs in diagram links
 * (e.g., "./page.html") cannot be resolved by the browser.
 *
 * This module provides functionality to pre-resolve relative URLs to absolute URLs
 * before the SVG is serialized and embedded in the sandbox iframe.
 */

const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Checks if a URL is absolute (should not be modified).
 *
 * A URL is considered absolute if it:
 * - Starts with a protocol scheme (http://, https://, mailto:, etc.)
 * - Starts with protocol-relative prefix (//)
 *
 * @param url - The URL to check
 * @returns true if the URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  // Protocol schemes (http:, https:, mailto:, javascript:, data:, etc.)
  if (/^[A-Za-z][\d+.A-Za-z-]*:/.test(url)) {
    return true;
  }
  // Protocol-relative URLs
  if (url.startsWith('//')) {
    return true;
  }
  return false;
}

/**
 * Resolves relative URLs in a DOM element (in place) against a base URL.
 * Used for sandbox mode to enable link navigation from data URI iframes.
 *
 * This function finds all elements with href or xlink:href attributes
 * and resolves relative URLs to absolute URLs using the provided base URL.
 * The element is mutated directly - no return value.
 *
 * @param element - The DOM element (typically an SVG) to process
 * @param baseUrl - The base URL to resolve relative URLs against
 */
export function resolveRelativeUrlsInElement(element: Element, baseUrl: string): void {
  // Find all elements with href or xlink:href attributes
  // We need to handle both standard href and xlink:href (used in SVG)
  const elementsWithHref = element.querySelectorAll('[href]');
  const elementsWithXlinkHref = element.querySelectorAll('[*|href]');

  // Process regular href attributes
  for (const el of elementsWithHref) {
    const href = el.getAttribute('href');
    if (href && !isAbsoluteUrl(href)) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        el.setAttribute('href', absoluteUrl);
      } catch {
        // If URL resolution fails, leave the original href unchanged
      }
    }
  }

  // Process xlink:href attributes (common in SVG)
  for (const el of elementsWithXlinkHref) {
    const xlinkHref = el.getAttributeNS(XLINK_NS, 'href');
    if (xlinkHref && !isAbsoluteUrl(xlinkHref)) {
      try {
        const absoluteUrl = new URL(xlinkHref, baseUrl).href;
        el.setAttributeNS(XLINK_NS, 'xlink:href', absoluteUrl);
      } catch {
        // If URL resolution fails, leave the original href unchanged
      }
    }
  }
}
