import { select } from 'd3';
import type { D3HtmlSelection } from '../types.js';

export interface DiagramRoot {
  /** Selection of the body that diagram elements should be queried from. */
  root: D3HtmlSelection<HTMLElement>;
  /** Owner document of {@link root} (the iframe document in sandbox mode). */
  doc: Document;
}

/**
 * Resolves the root selection a renderer should draw into, accounting for
 * `securityLevel: 'sandbox'` where the diagram lives inside an `#i<id>`
 * iframe. Centralizes the sandbox handling that was previously copy-pasted
 * (with non-null assertions) into every renderer.
 */
export const getDiagramRoot = (id: string, securityLevel?: string): DiagramRoot => {
  if (securityLevel === 'sandbox') {
    const sandboxElement = select<HTMLIFrameElement, unknown>('#i' + id);
    const doc = sandboxElement.node()?.contentDocument;
    if (!doc) {
      throw new Error(`Sandbox iframe #i${id} is missing its content document`);
    }
    return { root: select(doc.body) as unknown as D3HtmlSelection<HTMLElement>, doc };
  }
  return { root: select('body') as unknown as D3HtmlSelection<HTMLElement>, doc: document };
};
