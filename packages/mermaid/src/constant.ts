// diagram names that support classDef statements
export const CLASSDEF_DIAGRAMS = [
  'graph',
  'flowchart',
  'flowchart-v2',
  'flowchart-elk',
  'stateDiagram',
  'stateDiagram-v2',
];

export const MAX_TEXTLENGTH = 50_000;
export const MAX_TEXTLENGTH_EXCEEDED_MSG =
  'graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa';

export const SECURITY_LVL_SANDBOX = 'sandbox';
export const SECURITY_LVL_LOOSE = 'loose';

export const XMLNS_SVG_STD = 'http://www.w3.org/2000/svg';
export const XMLNS_XLINK_STD = 'http://www.w3.org/1999/xlink';
export const XMLNS_XHTML_STD = 'http://www.w3.org/1999/xhtml';

// ------------------------------
// iFrame
export const IFRAME_WIDTH = '100%';
export const IFRAME_HEIGHT = '100%';
export const IFRAME_STYLES = 'border:0;margin:0;';
export const IFRAME_BODY_STYLE = 'margin:0';
export const IFRAME_SANDBOX_OPTS = 'allow-top-navigation-by-user-activation allow-popups';
export const IFRAME_NOT_SUPPORTED_MSG = 'The "iframe" tag is not supported by your browser.';

// DOMPurify settings for svgCode
export const DOMPURIFY_TAGS = ['foreignobject'];
export const DOMPURIFY_ATTR = ['dominant-baseline'];
