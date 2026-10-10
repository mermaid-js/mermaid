import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';

import { diffRenders, type DiffResult, type RenderedSvg } from './compare-diff.js';
import {
  buildRenderConfig,
  compareBackground,
  describeBundle,
  effectiveTheme,
  pickLayoutElkVersion,
  resolveVersionAlias,
  sortVersionsDesc,
  type RenderSettings,
  type VersionsResponse,
} from './compare-versions.js';

type Side = 'left' | 'right';

type PaneState = {
  /** Resolved version loaded into the current iframe ('' while unresolved). */
  version: string;
  /** Bumped to force a fresh iframe (dev rebuilds). */
  generation: number;
  ready: boolean;
  status: 'waiting' | 'loading' | 'rendering' | 'rendered' | 'error';
  message: string;
  result: RenderedSvg | null;
  /** Key (source + config) of `result`, and of the last render sent. */
  resultKey: string;
  sentKey: string;
  requestId: number;
};

export type CompareChangeDetail = { left?: string; right?: string; diff?: boolean };

function newPane(): PaneState {
  return {
    version: '',
    generation: 0,
    ready: false,
    status: 'waiting',
    message: '',
    result: null,
    resultKey: '',
    sentKey: '',
    requestId: 0,
  };
}

/**
 * The "Compare" tab: renders the current diagram with two mermaid versions side
 * by side, each in its own iframe (compare-pane.html), with an optional pixel
 * diff overlaid on the right pane.
 */
export class DevComparePanel extends LitElement {
  static properties = {
    source: { type: String },
    settings: { attribute: false },
    sseToken: { type: Number },
    left: { type: String },
    right: { type: String },
    diff: { type: Boolean },
    versions: { state: true },
    versionsError: { state: true },
    versionsSettled: { state: true },
    showPrereleases: { state: true },
    panes: { state: true },
    diffResult: { state: true },
    diffError: { state: true },
    diffBusy: { state: true },
  };

  declare source: string;
  declare settings: RenderSettings;
  declare sseToken: number;
  declare left: string;
  declare right: string;
  declare diff: boolean;
  declare versions: VersionsResponse | null;
  declare versionsError: string;
  declare versionsSettled: boolean;
  declare showPrereleases: boolean;
  declare panes: Record<Side, PaneState>;
  declare diffResult: DiffResult | null;
  declare diffError: string;
  declare diffBusy: boolean;

  #diffSeq = 0;
  #diffKey = '';
  #nextRequestId = 1;

  constructor() {
    super();
    this.source = '';
    this.sseToken = 0;
    this.left = 'latest';
    this.right = 'dev';
    this.diff = false;
    this.versions = null;
    this.versionsError = '';
    this.versionsSettled = false;
    this.showPrereleases = false;
    this.panes = { left: newPane(), right: newPane() };
    this.diffResult = null;
    this.diffError = '';
    this.diffBusy = false;
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('message', this.#onMessage);
    void this.#loadVersions();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('message', this.#onMessage);
  }

  async #loadVersions() {
    try {
      const res = await fetch('/dev/api/versions');
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      this.versions = (await res.json()) as VersionsResponse;
      this.versionsError = '';
    } catch (e) {
      this.versions = null;
      this.versionsError = e instanceof Error ? e.message : String(e);
    } finally {
      this.versionsSettled = true;
    }
  }

  #resolved(side: Side): string | undefined {
    const value = side === 'left' ? this.left : this.right;
    // Published 11.x needs the registry to pick its layout-elk, so non-dev
    // panes wait until the version list has settled (loaded or failed).
    if (value !== 'dev' && !this.versionsSettled) return undefined;
    return resolveVersionAlias(value, this.versions?.mermaid);
  }

  #config() {
    return buildRenderConfig(this.settings, { naturalSize: true });
  }

  #renderKey() {
    return JSON.stringify({ source: this.source, config: this.#config() });
  }

  #setPane(side: Side, patch: Partial<PaneState>) {
    this.panes = { ...this.panes, [side]: { ...this.panes[side], ...patch } };
  }

  #iframe(side: Side): HTMLIFrameElement | null {
    return this.querySelector(`iframe[data-side="${side}"]`);
  }

  willUpdate(changed: Map<string, unknown>) {
    // Pick up version changes (and 'latest' resolving once the list arrives)
    // before rendering, so the keyed iframe is recreated in the same pass.
    for (const side of ['left', 'right'] as const) {
      const resolved = this.#resolved(side) ?? '';
      const pane = this.panes[side];
      let generation = pane.generation;
      if (changed.has('sseToken') && changed.get('sseToken') !== undefined && resolved === 'dev') {
        // The dev bundle may have been rebuilt; a fresh iframe re-imports it.
        generation++;
      }
      if (resolved !== pane.version || generation !== pane.generation) {
        this.panes = {
          ...this.panes,
          [side]: {
            ...newPane(),
            version: resolved,
            generation,
            status: resolved ? 'loading' : 'waiting',
          },
        };
      }
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('source') || changed.has('settings') || changed.has('panes')) {
      this.#renderPanes();
    }
    if (changed.has('diff') || changed.has('panes')) {
      void this.#updateDiff();
    }
  }

  #renderPanes() {
    const key = this.#renderKey();
    for (const side of ['left', 'right'] as const) {
      const pane = this.panes[side];
      if (!pane.ready || !this.source || pane.sentKey === key) continue;
      const frame = this.#iframe(side);
      if (!frame?.contentWindow) continue;
      const requestId = this.#nextRequestId++;
      this.#setPane(side, { sentKey: key, requestId, status: 'rendering', message: '' });
      frame.contentWindow.postMessage(
        {
          type: 'render',
          source: this.source,
          config: this.#config(),
          background: compareBackground(effectiveTheme(this.settings.theme, this.source)),
          requestId,
        },
        window.location.origin
      );
    }
  }

  #onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const side = (['left', 'right'] as const).find(
      (s) => this.#iframe(s)?.contentWindow === event.source
    );
    if (!side) return;
    const msg = event.data as Record<string, unknown> | null;
    if (!msg || typeof msg !== 'object') return;
    const pane = this.panes[side];

    if (msg.type === 'ready') {
      let bundle;
      try {
        bundle = describeBundle(pane.version, {
          elkVersion: this.versions
            ? pickLayoutElkVersion(pane.version, this.versions.mermaid, this.versions.layoutElk)
            : undefined,
        });
      } catch (e) {
        this.#setPane(side, { status: 'error', message: String(e) });
        return;
      }
      (event.source as Window).postMessage(
        { type: 'load', version: pane.version, bundle },
        window.location.origin
      );
      this.#setPane(side, { ready: true, status: 'loading', message: '' });
    } else if (msg.type === 'loaded') {
      this.#setPane(side, { status: pane.sentKey ? pane.status : 'loading' });
    } else if (msg.type === 'rendered') {
      if (msg.requestId !== pane.requestId) return;
      this.#setPane(side, {
        status: 'rendered',
        message: '',
        result: {
          svg: String(msg.svg),
          width: Number(msg.width),
          height: Number(msg.height),
        },
        resultKey: pane.sentKey,
      });
    } else if (msg.type === 'error') {
      if (msg.requestId !== null && msg.requestId !== pane.requestId) return;
      this.#setPane(side, {
        status: 'error',
        message: String(msg.message),
        result: null,
        resultKey: '',
      });
    }
  };

  #emit(detail: CompareChangeDetail) {
    this.dispatchEvent(
      new CustomEvent<CompareChangeDetail>('compare-change', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  #postOverlay(dataUrl: string | null) {
    this.#iframe('right')?.contentWindow?.postMessage(
      { type: 'overlay', dataUrl },
      window.location.origin
    );
  }

  async #updateDiff() {
    const { left, right } = this.panes;
    const key = this.#renderKey();
    const ready =
      this.diff && left.result && right.result && left.resultKey === key && right.resultKey === key;
    if (!ready) {
      if (this.#diffKey) {
        this.#diffKey = '';
        this.#diffSeq++;
        this.#postOverlay(null);
      }
      if (this.diffResult) this.diffResult = null;
      if (this.diffError) this.diffError = '';
      if (this.diffBusy) this.diffBusy = false;
      return;
    }
    // Same inputs as the diff already shown (or in progress).
    const diffKey = `${left.version}#${left.generation}|${right.version}#${right.generation}|${key}`;
    if (diffKey === this.#diffKey) return;
    this.#diffKey = diffKey;
    const seq = ++this.#diffSeq;
    this.diffBusy = true;
    this.diffError = '';
    try {
      const result = await diffRenders(
        left.result!,
        right.result!,
        compareBackground(effectiveTheme(this.settings.theme, this.source))
      );
      if (seq !== this.#diffSeq) return;
      this.diffResult = result;
      this.#postOverlay(result.dataUrl);
    } catch (e) {
      if (seq !== this.#diffSeq) return;
      this.diffResult = null;
      this.diffError = e instanceof Error ? e.message : String(e);
      this.#postOverlay(null);
    } finally {
      if (seq === this.#diffSeq) this.diffBusy = false;
    }
  }

  #versionOptions(current: string | undefined) {
    const list = this.versions
      ? sortVersionsDesc(this.versions.mermaid.versions, {
          includePrereleases: this.showPrereleases,
        })
      : [];
    // Keep a URL-selected version visible even if filtered out / list offline.
    if (current && current !== 'dev' && !list.includes(current)) list.unshift(current);
    const latest = this.versions?.mermaid.distTags.latest;
    return html`
      <sl-option value="dev">dev (this checkout)</sl-option>
      ${list.map(
        (v) => html`<sl-option value=${v}>${v}${v === latest ? ' (latest)' : ''}</sl-option>`
      )}
    `;
  }

  #renderSelect(side: Side) {
    const value = this.#resolved(side) ?? '';
    return html`
      <div class="control">
        <span class="label">${side === 'left' ? 'Left' : 'Right'}</span>
        <sl-select
          class="compare-version-select"
          data-side=${side}
          size="small"
          hoist
          .value=${value}
          @sl-change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement | null)?.value;
            if (typeof v === 'string' && v) this.#emit({ [side]: v });
          }}
        >
          ${this.#versionOptions(value)}
        </sl-select>
      </div>
    `;
  }

  #renderPane(side: Side) {
    const pane = this.panes[side];
    const unresolved = !pane.version;
    const label = unresolved ? '…' : pane.version === 'dev' ? 'dev' : `mermaid@${pane.version}`;
    const size = pane.result ? `${pane.result.width}×${pane.result.height}` : '';
    return html`
      <div class="compare-pane" data-side=${side} data-status=${pane.status}>
        <div class="compare-pane-header">
          <span class="compare-pane-title">${label}</span>
          <span class="subtle">${pane.status}${size ? ` · ${size}` : ''}</span>
        </div>
        ${unresolved
          ? html`<div class="compare-pane-empty">
              ${this.versionsError
                ? 'Version list unavailable (offline?) — pick “dev” or an explicit version.'
                : 'Resolving the latest published version…'}
            </div>`
          : keyed(
              `${side}:${pane.version}:${pane.generation}`,
              html`<iframe
                data-side=${side}
                title=${`${side} pane: ${label}`}
                src="/dev/compare-pane.html"
              ></iframe>`
            )}
      </div>
    `;
  }

  #renderDiffStatus() {
    if (!this.diff) return html`<span class="subtle">Press D to toggle the pixel diff.</span>`;
    if (this.diffError) {
      return html`<span class="compare-diff-error" data-testid="compare-diff-status"
        >Diff unavailable: ${this.diffError}</span
      >`;
    }
    const { left, right } = this.panes;
    if (left.status === 'error' || right.status === 'error') {
      return html`<span class="compare-diff-error" data-testid="compare-diff-status"
        >Diff needs both panes rendered.</span
      >`;
    }
    if (this.diffBusy || !this.diffResult) {
      return html`<span class="subtle" data-testid="compare-diff-status"
        >Waiting for both renders…</span
      >`;
    }
    const r = this.diffResult;
    return html`<span
      class=${r.changedPixels === 0 ? 'compare-diff-same' : 'compare-diff-changed'}
      data-testid="compare-diff-status"
      data-changed-pixels=${r.changedPixels}
      >${r.changedPixels.toLocaleString()} changed pixels
      (${r.width}×${r.height})${r.sizeNote ? ` · ${r.sizeNote}` : ''}</span
    >`;
  }

  render() {
    return html`
      <div class="compare-root">
        <div class="compare-toolbar">
          ${this.#renderSelect('left')} ${this.#renderSelect('right')}
          <sl-checkbox
            size="small"
            ?checked=${this.showPrereleases}
            @sl-change=${(e: Event) => {
              this.showPrereleases = Boolean((e.target as HTMLInputElement | null)?.checked);
            }}
            >prereleases</sl-checkbox
          >
          <sl-button
            size="small"
            variant=${this.diff ? 'primary' : 'default'}
            data-testid="compare-diff-toggle"
            @click=${() => this.#emit({ diff: !this.diff })}
          >
            <sl-icon slot="prefix" name="subtract"></sl-icon>
            Diff
          </sl-button>
          ${this.#renderDiffStatus()}
          ${this.versionsError
            ? html`<span class="compare-diff-error"
                >Version list unavailable (offline?): ${this.versionsError}</span
              >`
            : nothing}
        </div>
        <div class="compare-panes">${this.#renderPane('left')} ${this.#renderPane('right')}</div>
      </div>
    `;
  }
}

customElements.define('dev-compare-panel', DevComparePanel);
