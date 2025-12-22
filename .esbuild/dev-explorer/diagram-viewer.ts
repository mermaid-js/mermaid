import { LitElement, html, nothing } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/split-panel/split-panel.js';

import './console-panel';
import type { LogEntry, LogLevel } from './console-panel';

type MermaidIife = {
  initialize: (config: Record<string, unknown>) => void | Promise<void>;
  render: (
    id: string,
    text: string,
    container?: Element
  ) => Promise<{ svg: string; bindFunctions?: (el: Element) => void }>;
};

declare global {
  interface Window {
    mermaid?: MermaidIife;
    mermaidReady?: Promise<MermaidIife>;
  }
}

function stringifyArgs(args: unknown[]) {
  // Mermaid's internal logger frequently uses console formatting like:
  //   console.log('%c...message...', 'color: lightgreen', ...)
  // For the log panel we want the human text, not the formatting tokens/styles.
  let normalized = [...args];
  if (typeof normalized[0] === 'string') {
    const fmt = normalized[0];
    const cssCount = (fmt.match(/%c/g) ?? []).length;
    if (cssCount > 0) {
      normalized[0] = fmt.replaceAll('%c', '');
      // Drop the corresponding CSS args that follow the format string.
      normalized.splice(1, cssCount);
    }
  }

  return normalized
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack ?? a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral' | 'base';
type MermaidLayout = 'dagre' | 'elk';
type MermaidLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const DEFAULT_THEME: MermaidTheme = 'default';
const DEFAULT_LAYOUT: MermaidLayout = 'dagre';
const DEFAULT_MERMAID_LOG_LEVEL: MermaidLogLevel = 'warn';

function readUrlParam(name: string) {
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

function setUrlParams(pairs: Record<string, string | null | undefined>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(pairs)) {
    if (!v) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  history.replaceState(null, '', url);
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function isTheme(v: unknown): v is MermaidTheme {
  return v === 'default' || v === 'dark' || v === 'forest' || v === 'neutral' || v === 'base';
}

function isLayout(v: unknown): v is MermaidLayout {
  return v === 'dagre' || v === 'elk';
}

function isMermaidLogLevel(v: unknown): v is MermaidLogLevel {
  return (
    v === 'trace' || v === 'debug' || v === 'info' || v === 'warn' || v === 'error' || v === 'fatal'
  );
}

function normalizeLayout(v: unknown): MermaidLayout | null {
  // Back-compat:
  // - older UI used `renderer=dagre-d3|dagre-wrapper|elk`
  // - new UI uses `layout=dagre|elk`
  if (v === 'dagre' || v === 'elk') return v;
  if (v === 'dagre-d3' || v === 'dagre-wrapper') return 'dagre';
  return null;
}

function parseBoolean(v: unknown): boolean | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return null;
}

export class DevDiagramViewer extends LitElement {
  static properties = {
    filePath: { type: String },
    sseToken: { type: Number },
    theme: { state: true },
    layout: { state: true },
    mermaidLogLevel: { state: true },
    useMaxWidth: { state: true },
    loading: { state: true },
    error: { state: true },
    source: { state: true },
    svg: { state: true },
  };

  declare filePath: string;
  declare sseToken: number;
  declare theme: MermaidTheme;
  declare layout: MermaidLayout;
  declare mermaidLogLevel: MermaidLogLevel;
  declare useMaxWidth: boolean;
  declare loading: boolean;
  declare error: string;
  declare source: string;
  declare svg: string;

  #renderSeq = 0;
  #consolePatched = false;
  #originalConsole?: {
    log: typeof console.log;
    info: typeof console.info;
    debug: typeof console.debug;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    super();
    const themeParam = readUrlParam('theme');
    const layoutParam = readUrlParam('layout');
    const rendererParam = readUrlParam('renderer'); // legacy
    const logParam = readUrlParam('logLevel');
    const useMaxWidthParam = readUrlParam('useMaxWidth');

    const storedTheme = readStorage('devExplorer.viewer.theme');
    const storedLayout = readStorage('devExplorer.viewer.layout');
    const storedRenderer = readStorage('devExplorer.viewer.renderer'); // legacy
    const storedLog = readStorage('devExplorer.viewer.logLevel');
    const storedUseMaxWidth = readStorage('devExplorer.viewer.useMaxWidth');

    this.theme = isTheme(themeParam)
      ? themeParam
      : isTheme(storedTheme)
        ? storedTheme
        : DEFAULT_THEME;
    this.layout =
      normalizeLayout(layoutParam) ??
      normalizeLayout(rendererParam) ??
      normalizeLayout(storedLayout) ??
      normalizeLayout(storedRenderer) ??
      DEFAULT_LAYOUT;
    this.mermaidLogLevel = isMermaidLogLevel(logParam)
      ? logParam
      : isMermaidLogLevel(storedLog)
        ? storedLog
        : DEFAULT_MERMAID_LOG_LEVEL;

    this.useMaxWidth = parseBoolean(useMaxWidthParam) ?? parseBoolean(storedUseMaxWidth) ?? true;

    this.filePath = '';
    this.sseToken = 0;
    this.loading = true;
    this.error = '';
    this.source = '';
    this.svg = '';
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.#installConsoleCapture();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#restoreConsoleCapture();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('filePath')) {
      void this.#loadAndRender();
    } else if (changed.has('sseToken')) {
      // On rebuild events, re-fetch + re-render the currently open diagram.
      if (this.filePath) void this.#loadAndRender();
    } else if (
      changed.has('theme') ||
      changed.has('layout') ||
      changed.has('mermaidLogLevel') ||
      changed.has('useMaxWidth')
    ) {
      // Re-render the currently loaded diagram with the new config without refetching.
      if (this.source) void this.#renderCurrentSource();
    }
  }

  #back() {
    this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
  }

  #persistSettings() {
    writeStorage('devExplorer.viewer.theme', this.theme);
    writeStorage('devExplorer.viewer.layout', this.layout);
    writeStorage('devExplorer.viewer.logLevel', this.mermaidLogLevel);
    writeStorage('devExplorer.viewer.useMaxWidth', String(this.useMaxWidth));
    setUrlParams({
      theme: this.theme,
      layout: this.layout,
      renderer: null, // drop legacy param
      logLevel: this.mermaidLogLevel,
      useMaxWidth: this.useMaxWidth ? '1' : '0',
    });
  }

  #syncConsolePanelFilters() {
    const panel = this.querySelector('dev-console-panel') as any;
    if (!panel) return;
    // This is intentionally opinionated: less noise by default as logLevel increases.
    if (
      this.mermaidLogLevel === 'trace' ||
      this.mermaidLogLevel === 'debug' ||
      this.mermaidLogLevel === 'info'
    ) {
      panel.showInfo = true;
      panel.showWarn = true;
      panel.showError = true;
      return;
    }
    if (this.mermaidLogLevel === 'warn') {
      panel.showInfo = false;
      panel.showWarn = true;
      panel.showError = true;
      return;
    }
    // error / fatal
    panel.showInfo = false;
    panel.showWarn = false;
    panel.showError = true;
  }

  #appendLog(entry: LogEntry) {
    const panel = this.querySelector('dev-console-panel') as any;
    panel?.append?.(entry);
  }

  #installConsoleCapture() {
    if (this.#consolePatched) return;
    this.#consolePatched = true;

    this.#originalConsole = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
    };

    const capture = (level: LogLevel, args: unknown[]) => {
      this.#appendLog({
        ts: Date.now(),
        level,
        message: stringifyArgs(args),
      });
    };

    // Mermaid uses its own logger which routes to console.info/debug/warn/error.
    // Capture those too (map debug/info/log -> panel "info").
    console.log = (...args) => {
      capture('info', args);
      this.#originalConsole!.log.apply(console, args as any);
    };
    console.info = (...args) => {
      capture('info', args);
      this.#originalConsole!.info.apply(console, args as any);
    };
    console.debug = (...args) => {
      capture('info', args);
      this.#originalConsole!.debug.apply(console, args as any);
    };
    console.warn = (...args) => {
      capture('warn', args);
      this.#originalConsole!.warn.apply(console, args as any);
    };
    console.error = (...args) => {
      capture('error', args);
      this.#originalConsole!.error.apply(console, args as any);
    };
  }

  #restoreConsoleCapture() {
    if (!this.#consolePatched) return;
    this.#consolePatched = false;
    if (!this.#originalConsole) return;
    console.log = this.#originalConsole.log;
    console.info = this.#originalConsole.info;
    console.debug = this.#originalConsole.debug;
    console.warn = this.#originalConsole.warn;
    console.error = this.#originalConsole.error;
    this.#originalConsole = undefined;
  }

  #clearLogs() {
    const panel = this.querySelector('dev-console-panel') as any;
    panel?.clear?.();
  }

  async #fetchSource() {
    const url = new URL('/dev/api/file', window.location.origin);
    url.searchParams.set('path', this.filePath);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  }

  async #loadAndRender() {
    const seq = ++this.#renderSeq;
    this.loading = true;
    this.error = '';
    this.svg = '';
    this.#clearLogs();
    this.#syncConsolePanelFilters();

    try {
      const source = await this.#fetchSource();
      if (seq !== this.#renderSeq) return;
      this.source = source;
      await this.#renderMermaid(source);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  async #renderCurrentSource() {
    const seq = ++this.#renderSeq;
    this.loading = true;
    this.error = '';
    this.svg = '';
    this.#clearLogs();
    this.#syncConsolePanelFilters();
    try {
      const source = this.source;
      if (!source) return;
      if (seq !== this.#renderSeq) return;
      await this.#renderMermaid(source);
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  async #renderMermaid(text: string) {
    const m = (await window.mermaidReady?.catch(() => undefined)) ?? window.mermaid;
    if (!m) {
      throw new Error(
        'window.mermaid is not available (did /mermaid.esm.mjs load and did the bootstrap set window.mermaid?)'
      );
    }

    const initConfig = {
      startOnLoad: false,
      securityLevel: 'strict',
      theme: this.theme,
      layout: this.layout,
      logLevel: this.mermaidLogLevel,
      flowchart: {
        useMaxWidth: this.useMaxWidth,
      },
    };

    // Debugging aid: log exactly what we are about to initialize/render with.
    // Do it *before* initialize so detector issues can be correlated.
    const previewLimit = 4000;
    const preview =
      text.length > previewLimit
        ? `${text.slice(0, previewLimit)}\n… (${text.length - previewLimit} more chars)`
        : text;
    console.log('[dev-explorer] mermaid.initialize config:', initConfig);
    console.log('[dev-explorer] diagram source preview:\n' + preview);

    // Keep it deterministic-ish between reloads.
    await m.initialize(initConfig);

    const id = `dev-explorer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { svg, bindFunctions } = await m.render(id, text);
    this.svg = svg;
    // Allow mermaid to attach event handlers (e.g. links).
    await this.updateComplete;
    // If the page ever ended up scrolled down due to a previous oversized render, snap back to top.
    // (We intentionally removed vertical scrollbars in the viewer.)
    try {
      window.scrollTo(0, 0);
    } catch {
      // ignore
    }
    const container = this.querySelector('.diagram-inner');
    if (container && bindFunctions) bindFunctions(container);
  }

  render() {
    return html`
      <div class="header">
        <sl-button size="small" variant="default" @click=${() => this.#back()}>
          <sl-icon slot="prefix" name="arrow-left"></sl-icon>
          Back
        </sl-button>
        <div style="min-width: 0;">
          <div class="title">Diagram</div>
          <div class="path">${this.filePath}</div>
        </div>
        <div class="spacer"></div>
        <div class="viewer-controls">
          <div class="control">
            <span class="label">Theme</span>
            <sl-select
              size="small"
              value=${this.theme}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isTheme(v)) {
                  this.theme = v;
                  this.#persistSettings();
                }
              }}
            >
              <sl-option value="default">default</sl-option>
              <sl-option value="dark">dark</sl-option>
              <sl-option value="forest">forest</sl-option>
              <sl-option value="neutral">neutral</sl-option>
              <sl-option value="base">base</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <span class="label">Layout</span>
            <sl-select
              size="small"
              value=${this.layout}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isLayout(v)) {
                  this.layout = v;
                  this.#persistSettings();
                }
              }}
            >
              <sl-option value="dagre">dagre</sl-option>
              <sl-option value="elk">elk</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <span class="label">Log</span>
            <sl-select
              size="small"
              value=${this.mermaidLogLevel}
              @sl-change=${(e: any) => {
                const v = e.target?.value;
                if (isMermaidLogLevel(v)) {
                  this.mermaidLogLevel = v;
                  this.#persistSettings();
                  this.#syncConsolePanelFilters();
                }
              }}
            >
              <sl-option value="trace">trace</sl-option>
              <sl-option value="debug">debug</sl-option>
              <sl-option value="info">info</sl-option>
              <sl-option value="warn">warn</sl-option>
              <sl-option value="error">error</sl-option>
              <sl-option value="fatal">fatal</sl-option>
            </sl-select>
          </div>

          <div class="control">
            <sl-checkbox
              size="small"
              ?checked=${this.useMaxWidth}
              @sl-change=${(e: any) => {
                this.useMaxWidth = Boolean(e.target?.checked);
                this.#persistSettings();
              }}
              >useMaxWidth</sl-checkbox
            >
          </div>
        </div>
        ${this.loading ? html`<div class="subtle">rendering…</div>` : nothing}
      </div>

      ${this.error
        ? html`<div class="empty">Error: <span class="path">${this.error}</span></div>`
        : nothing}

      <div class="content">
        <sl-split-panel position="75" style="height: 100%;">
          <div slot="start" class="diagram">
            <div class="diagram-inner" data-theme=${this.theme} .innerHTML=${this.svg}></div>
          </div>
          <div slot="end" style="height: 100%;">
            <dev-console-panel></dev-console-panel>
          </div>
        </sl-split-panel>
      </div>
    `;
  }
}

customElements.define('dev-diagram-viewer', DevDiagramViewer);
