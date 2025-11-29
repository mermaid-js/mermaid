/**
 * Utilities for resolving relative URLs in sandbox mode.
 *
 * When securityLevel is 'sandbox', diagrams are rendered inside a data: URI iframe.
 * Data URIs have no base URL context, so relative URLs in diagram links
 * (e.g., "./page.html") cannot be resolved by the browser.
 *
 * This module provides functionality to pre-resolve relative URLs to absolute URLs
 * before base64-encoding and embedding in the sandbox iframe.
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
 * Resolves relative URLs in SVG content against a base URL.
 * Used for sandbox mode to enable link navigation from data URI iframes.
 *
 * This function finds all elements with href or xlink:href attributes
 * and resolves relative URLs to absolute URLs using the provided base URL.
 *
 * @param svgContent - The rendered SVG markup string
 * @param baseUrl - The base URL to resolve relative URLs against
 * @returns SVG markup with all relative URLs resolved to absolute
 */
export function resolveRelativeUrls(svgContent: string, baseUrl: string): string {
  // Parse SVG as XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    // If parsing fails, return original content unchanged
    return svgContent;
  }

  // Find all elements with href or xlink:href attributes
  // We need to handle both standard href and xlink:href (used in SVG)
  const elementsWithHref = doc.querySelectorAll('[href]');
  const elementsWithXlinkHref = doc.querySelectorAll('[*|href]');

  // Process regular href attributes
  for (const element of elementsWithHref) {
    const href = element.getAttribute('href');
    if (href && !isAbsoluteUrl(href)) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        element.setAttribute('href', absoluteUrl);
      } catch {
        // If URL resolution fails, leave the original href unchanged
      }
    }
  }

  // Process xlink:href attributes (common in SVG)
  for (const element of elementsWithXlinkHref) {
    const xlinkHref = element.getAttributeNS(XLINK_NS, 'href');
    if (xlinkHref && !isAbsoluteUrl(xlinkHref)) {
      try {
        const absoluteUrl = new URL(xlinkHref, baseUrl).href;
        element.setAttributeNS(XLINK_NS, 'xlink:href', absoluteUrl);
      } catch {
        // If URL resolution fails, leave the original href unchanged
      }
    }
  }

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
