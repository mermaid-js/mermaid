import { LitElement, html } from 'lit';

import '@shoelace-style/shoelace/dist/components/input/input.js';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  ts: number;
  level: LogLevel;
  message: string;
};

function formatTs(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString(undefined, { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

function levelVariant(level: LogLevel) {
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
    this.logs = [];
  }

  append(entry: LogEntry) {
    this.logs = [...this.logs, entry];
  }

  async copyVisible() {
    const visible = this.filteredLogs();
    const text = visible
      .map((l) => `[${formatTs(l.ts)}] ${l.level.toUpperCase()} ${l.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
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
          <sl-button size="small" variant="default" @click=${() => void this.copyVisible()}>
            <sl-icon slot="prefix" name="clipboard"></sl-icon>
            Copy
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
