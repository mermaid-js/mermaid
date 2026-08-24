/**
 * Pre-measurement rewrite.
 *
 * Nothing is added to the diagram here — unlike `grid-decomposed`, which has to
 * create a duplicate of every core node before the measure stage because it draws
 * the peeled trees as separate islands. This layout attaches each tree back to the
 * core node it hung from, so the copied root HOLA's decomposition produces is
 * never drawn: the real core node stands in for it.
 *
 * What remains is `hola-faithful`'s rule (guide §3.2) — subgraph containers, and
 * edges naming one, are removed before anything is measured — which is reused
 * verbatim.
 */

import type { LayoutData } from '../../types.js';
import { prepareHolaFaithfulLayout } from '../hola-faithful/prepareLayout.js';
import type { PreparedHolaFaithfulLayout } from '../hola-faithful/prepareLayout.js';

export type PreparedGridAttachedLayout = PreparedHolaFaithfulLayout;

export function prepareGridAttachedLayout(data: LayoutData): PreparedGridAttachedLayout {
  return prepareHolaFaithfulLayout(data);
}
