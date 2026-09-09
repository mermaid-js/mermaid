import { LitElement, html, nothing } from 'lit';

import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

/**
 * Structural mirror of `ValidateLayoutResult` from
 * `layout-algorithms/layout-utils/validateLayout.ts`.
 *
 * Declared here rather than imported for the same reason the profiler and
 * size-capture shapes are: the Dev Explorer is bundled on its own and reaches
 * mermaid only through `window`, so a real import would drag the library into
 * this bundle. Only the fields the panel renders are listed — the validator's
 * `breakdown` carries more.
 */
export interface ValidationIssue {
  type: string;
  message: string;
  nodeIds?: string[];
  edgeId?: string;
}

export interface ValidationResult {
  ok: boolean;
  score: number;
  issues: ValidationIssue[];
  breakdown?: {
    nodeCount?: number;
    edgeCount?: number;
    crossings?: number;
    totalBendPenalty?: number;
    crossingPenalty?: number;
  };
}

/** What the panel is currently showing. */
export type ValidationState = 'idle' | 'running' | 'done' | 'unavailable' | 'error';

/**
 * Issue types the validator treats as soft — they lower the score but do not
 * make a layout invalid. Kept as a list so the panel can sort hard problems to
 * the top, which is the order you want to read them in.
 *
 * Mirrors `isSoftIssueType` in validateLayout.ts. Being out of date here costs
 * only row order, never correctness, so it does not need to track exactly.
 */
const SOFT_ISSUE_TYPES = new Set([
  'node-node-padding',
  'group-group-padding',
  'group-inside-group-padding',
  'node-too-close-to-group',
  'node-close-to-own-frame',
  'group-dead-space',
  'group-elongation',
  'grid-misalignment',
  'port-near-corner',
  'port-off-diamond-corner',
  'edge-to-group-too-short',
]);

/** One row of the grouped issue list. */
interface IssueGroup {
  type: string;
  soft: boolean;
  issues: ValidationIssue[];
}

function groupIssues(issues: ValidationIssue[]): IssueGroup[] {
  const byType = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const bucket = byType.get(issue.type);
    if (bucket) {
      bucket.push(issue);
    } else {
      byType.set(issue.type, [issue]);
    }
  }
  return (
    [...byType.entries()]
      .map(([type, list]) => ({ type, soft: SOFT_ISSUE_TYPES.has(type), issues: list }))
      // Hard problems first, then by how many there are: the two things that
      // decide what is worth looking at.
      .sort((a, b) =>
        a.soft === b.soft ? b.issues.length - a.issues.length : Number(a.soft) - Number(b.soft)
      )
  );
}

/** Colour the headline by score, on the same thresholds the DDLT sweep reads by. */
function scoreVariant(score: number, ok: boolean): 'success' | 'warning' | 'danger' {
  if (!ok) {
    return 'danger';
  }
  if (score >= 900) {
    return 'success';
  }
  return score >= 700 ? 'warning' : 'danger';
}

/** Cap on the individual messages rendered per group before "…and N more". */
const MAX_SHOWN_PER_GROUP = 50;

export class DevValidationPanel extends LitElement {
  static properties = {
    state: { state: true },
    result: { state: true },
    error: { state: true },
    durationMs: { state: true },
    expanded: { state: true },
  };

  declare state: ValidationState;
  declare result: ValidationResult | undefined;
  declare error: string;
  declare durationMs: number;
  /** Issue types whose individual messages are shown. */
  declare expanded: string[];

  constructor() {
    super();
    this.state = 'idle';
    this.result = undefined;
    this.error = '';
    this.durationMs = 0;
    this.expanded = [];
  }

  createRenderRoot() {
    return this;
  }

  /** Clear back to "not run yet" — called when a fresh render starts. */
  reset() {
    this.state = 'idle';
    this.result = undefined;
    this.error = '';
    this.durationMs = 0;
    this.expanded = [];
  }

  #toggle(type: string) {
    this.expanded = this.expanded.includes(type)
      ? this.expanded.filter((t) => t !== type)
      : [...this.expanded, type];
  }

  #renderHeadline() {
    const result = this.result;
    if (!result) {
      return nothing;
    }
    const variant = scoreVariant(result.score, result.ok);
    const b = result.breakdown ?? {};
    return html`
      <div class="validation-headline">
        <div class="validation-score ${variant}">${Math.round(result.score)}</div>
        <div class="validation-score-meta">
          <div>
            <sl-badge variant=${result.ok ? 'success' : 'danger'}>
              ${result.ok ? 'valid' : 'invalid'}
            </sl-badge>
            <span class="subtle">/ 1000</span>
          </div>
          <div class="subtle">
            ${b.nodeCount ?? '–'} nodes · ${b.edgeCount ?? '–'} edges · ${b.crossings ?? '–'}
            crossings ${this.durationMs > 0 ? html` · ${this.durationMs.toFixed(0)} ms` : nothing}
          </div>
          ${result.ok
            ? html`<div class="subtle">
                −${Math.round(b.totalBendPenalty ?? 0)} bends ·
                −${Math.round(b.crossingPenalty ?? 0)} crossings
              </div>`
            : html`<div class="subtle">
                a layout with a hard violation scores 0 regardless of its geometry
              </div>`}
        </div>
      </div>
    `;
  }

  #renderIssues() {
    const issues = this.result?.issues ?? [];
    if (issues.length === 0) {
      return html`<div class="empty">No issues — nothing reduced the score.</div>`;
    }
    const groups = groupIssues(issues);
    return html`
      <div class="validation-issues">
        ${groups.map((group) => {
          const open = this.expanded.includes(group.type);
          const shown = open ? group.issues.slice(0, MAX_SHOWN_PER_GROUP) : [];
          const hidden = group.issues.length - shown.length;
          return html`
            <div class="issue-group">
              <button
                type="button"
                class="issue-head"
                aria-expanded=${open ? 'true' : 'false'}
                @click=${() => this.#toggle(group.type)}
              >
                <sl-icon name=${open ? 'chevron-down' : 'chevron-right'}></sl-icon>
                <sl-badge variant=${group.soft ? 'warning' : 'danger'}>
                  ${group.issues.length}
                </sl-badge>
                <span class="issue-type">${group.type}</span>
                ${group.soft ? html`<span class="subtle">soft</span>` : nothing}
              </button>
              ${open
                ? html`
                    <div class="issue-list">
                      ${shown.map(
                        (issue) => html`
                          <div class="issue-line">
                            <span class="issue-msg">${issue.message}</span>
                            ${issue.edgeId
                              ? html`<span class="issue-ref">${issue.edgeId}</span>`
                              : nothing}
                            ${issue.nodeIds?.length
                              ? html`<span class="issue-ref">${issue.nodeIds.join(', ')}</span>`
                              : nothing}
                          </div>
                        `
                      )}
                      ${hidden > 0
                        ? html`<div class="subtle issue-line">…and ${hidden} more</div>`
                        : nothing}
                    </div>
                  `
                : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }

  #renderBody() {
    switch (this.state) {
      case 'idle':
        return html`<div class="empty">Render a diagram to validate it.</div>`;
      case 'running':
        return html`<div class="empty">Validating…</div>`;
      case 'unavailable':
        return html`<div class="empty">
          No layout was captured for this render. Validation needs a layout that runs through the
          shared renderer.
        </div>`;
      case 'error':
        return html`<div class="empty error">${this.error}</div>`;
      default:
        return html`${this.#renderHeadline()}${this.#renderIssues()}`;
    }
  }

  render() {
    const issueCount = this.result?.issues.length ?? 0;
    return html`
      <div class="validation">
        <div class="validation-toolbar">
          <span class="validation-title">Validation</span>
          ${this.state === 'done'
            ? html`<span class="subtle">${issueCount} issue${issueCount === 1 ? '' : 's'}</span>`
            : nothing}
          <div class="spacer"></div>
          ${this.state === 'done' && issueCount > 0
            ? html`
                <sl-button
                  size="small"
                  variant="default"
                  @click=${() =>
                    (this.expanded = this.expanded.length
                      ? []
                      : groupIssues(this.result?.issues ?? []).map((g) => g.type))}
                >
                  ${this.expanded.length ? 'Collapse all' : 'Expand all'}
                </sl-button>
              `
            : nothing}
        </div>
        <div class="validation-body">${this.#renderBody()}</div>
      </div>
    `;
  }
}

customElements.define('dev-validation-panel', DevValidationPanel);
