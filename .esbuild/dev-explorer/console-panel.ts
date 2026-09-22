import { LitElement, html } from 'lit';

import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  ts: number;
  level: LogLevel;
  message: string;
};

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

// Manual HH:MM:SS.mmm — NOT `toLocaleTimeString`. The Intl path costs ~1µs/call,
// and the panel formats every visible entry on every render; a chatty render
// (dagre emits thousands of log lines) turned this into seconds of self-time
// (9s+ in profiles). Hand-formatting is ~100x cheaper and locale-irrelevant here.
function formatTs(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(
    d.getMilliseconds()
  ).padStart(3, '0')}`;
}

function _levelVariant(level: LogLevel) {
  switch (level) {
    case 'error':
      return 'danger';
    case 'warn':
      return 'warning';
    default:
      return 'neutral';
  }
}

type DisplayLevel = 'debug' | LogLevel;

function displayLevel(entry: LogEntry): DisplayLevel {
  // Mermaid often emits debug lines through console.log/info with a marker.
  if (entry.message.includes(': DEBUG :')) return 'debug';
  return entry.level;
}

function displayVariant(level: DisplayLevel) {
  switch (level) {
    case 'error':
      return 'danger';
    case 'warn':
      return 'warning';
    case 'debug':
      return 'success';
    default:
      return 'neutral';
  }
}

export class DevConsolePanel extends LitElement {
  static properties = {
    logs: { state: true },
    showInfo: { state: true },
    showWarn: { state: true },
    showError: { state: true },
    showDebug: { state: true },
    filterText: { state: true },
  };

  declare logs: LogEntry[];
  declare showInfo: boolean;
  declare showWarn: boolean;
  declare showError: boolean;
  declare showDebug: boolean;
  declare filterText: string;

  /** Hard cap on retained entries. A single dagre render can emit tens of
   *  thousands of log lines; without a cap the panel grows unbounded and every
   *  re-render re-formats the whole list (O(n²)). Keep only the newest N. */
  static MAX_LOGS = 5000;
  #pending: LogEntry[] = [];
  #flushHandle = 0;

  constructor() {
    super();
    this.logs = [];
    this.showInfo = true;
    this.showWarn = true;
    this.showError = true;
    this.showDebug = true;
    this.filterText = '';
  }

  createRenderRoot() {
    return this;
  }

  clear() {
    if (this.#flushHandle) {
      cancelAnimationFrame(this.#flushHandle);
      this.#flushHandle = 0;
    }
    this.#pending = [];
    this.logs = [];
  }

  // Batch appends into ONE state update per frame. The old code reassigned
  // `this.logs` on every entry, so a render emitting N log lines triggered N
  // Lit re-renders, each re-formatting up to N entries → O(n²) and seconds of
  // wasted reformatting (the dagre-vs-elk "spinning" was entirely this).
  // Coalescing collapses a whole render's logs into a single bounded update.
  append(entry: LogEntry) {
    this.#pending.push(entry);
    if (this.#flushHandle) {
      return;
    }
    this.#flushHandle = requestAnimationFrame(() => this.#flushPending());
  }

  #flushPending() {
    this.#flushHandle = 0;
    if (this.#pending.length === 0) {
      return;
    }
    const merged = [...this.logs, ...this.#pending];
    this.#pending = [];
    const max = DevConsolePanel.MAX_LOGS;
    this.logs = merged.length > max ? merged.slice(merged.length - max) : merged;
  }

  #visibleText() {
    return this.filteredLogs()
      .map((l) => `[${formatTs(l.ts)}] ${displayLevel(l).toUpperCase()} ${l.message}`)
      .join('\n');
  }

  #copyWithExecCommand(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async copyVisible() {
    const text = this.#visibleText();
    if (!text) return;

    try {
      const clipboard = globalThis.navigator?.clipboard;
      if (clipboard && typeof clipboard.writeText === 'function') {
        await clipboard.writeText(text);
        return;
      }
    } catch {
      // Fall through to the legacy copy path below.
    }

    this.#copyWithExecCommand(text);
  }

  selectVisible() {
    const body = this.querySelector('.console-body');
    if (!body) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(body);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async selectAndCopyVisible() {
    this.selectVisible();
    await this.copyVisible();
  }

  filteredLogs() {
    const q = this.filterText.trim().toLowerCase();
    return this.logs.filter((l) => {
      const isDebugLine = l.message.includes(': DEBUG :');
      // Treat debug-marked lines as their own independent toggle, since Mermaid often routes them through
      // console.log/info with a marker rather than a distinct "debug" level.
      if (isDebugLine && !this.showDebug) return false;

      if (!isDebugLine) {
        const levelOk =
          l.level === 'info' ? this.showInfo : l.level === 'warn' ? this.showWarn : this.showError;
        if (!levelOk) return false;
      }

      if (!q) return true;
      return l.message.toLowerCase().includes(q);
    });
  }

  render() {
    const visible = this.filteredLogs();
    return html`
      <div class="console">
        <div class="console-toolbar">
          <div class="spacer"></div>
          <sl-input
            size="small"
            placeholder="filter…"
            clearable
            value=${this.filterText}
            @sl-input=${(e: any) => (this.filterText = e.target.value ?? '')}
          ></sl-input>
          <sl-checkbox
            size="small"
            ?checked=${this.showDebug}
            @sl-change=${(e: any) => (this.showDebug = e.target.checked)}
            >debug</sl-checkbox
          >
          <sl-checkbox
            size="small"
            ?checked=${this.showInfo}
            @sl-change=${(e: any) => (this.showInfo = e.target.checked)}
            >info</sl-checkbox
          >
          <sl-checkbox
            size="small"
            ?checked=${this.showWarn}
            @sl-change=${(e: any) => (this.showWarn = e.target.checked)}
            >warn</sl-checkbox
          >
          <sl-checkbox
            size="small"
            ?checked=${this.showError}
            @sl-change=${(e: any) => (this.showError = e.target.checked)}
            >error</sl-checkbox
          >
          <sl-button
            size="small"
            variant="default"
            @click=${() => void this.selectAndCopyVisible()}
          >
            <sl-icon slot="prefix" name="clipboard"></sl-icon>
            Select + Copy
          </sl-button>
          <sl-button size="small" variant="default" @click=${() => this.clear()}>
            <sl-icon slot="prefix" name="trash"></sl-icon>
            Clear
          </sl-button>
        </div>
        <div class="console-body">
          ${visible.length === 0
            ? html`<div class="empty">No logs yet.</div>`
            : visible.map((l) => {
                const lvl = displayLevel(l);
                return html`
                  <div class="logline">
                    <div class="logmeta">
                      <sl-badge variant=${displayVariant(lvl)}>${lvl}</sl-badge>
                      <span class="path">${formatTs(l.ts)}</span>
                    </div>
                    <div>${l.message}</div>
                  </div>
                `;
              })}
        </div>
      </div>
    `;
  }
}

customElements.define('dev-console-panel', DevConsolePanel);
